import pytest
from httpx import AsyncClient, ASGITransport
import io
from PIL import Image
from backend.app.main import app
from backend.app.core.config import settings
from backend.app.database.session import init_db
from backend.app.services.yolo_service import yolo_service

@pytest.fixture(autouse=True)
async def setup_test_app():
    await init_db()
    if not yolo_service.is_loaded:
        yolo_service.initialize()

@pytest.fixture
def sample_image_bytes():
    img = Image.new("RGB", (200, 200), color=(120, 120, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()

@pytest.mark.asyncio
async def test_root_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "running"
        assert "version" in data

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "uptime_seconds" in data
        assert "model_loaded" in data

@pytest.mark.asyncio
async def test_model_info():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/model-info")
        assert response.status_code == 200
        data = response.json()
        assert data["model_version"] == settings.MODEL_VERSION
        assert "classes" in data
        assert "safety_disclaimer" in data

@pytest.mark.asyncio
async def test_update_thresholds():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {
            "defect_confidence_threshold": 0.55,
            "uncertainty_threshold": 0.30
        }
        response = await client.post("/api/v1/config/thresholds", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["defect_confidence_threshold"] == 0.55
        assert data["uncertainty_threshold"] == 0.30

@pytest.mark.asyncio
async def test_reject_invalid_image_extension():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("malicious_script.sh", b"echo 'bad'", "text/plain")}
        response = await client.post("/api/v1/inspections", files=files)
        assert response.status_code == 400
        assert "Unsupported file extension" in response.json()["detail"]

@pytest.mark.asyncio
async def test_reject_empty_image():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        files = {"file": ("empty.jpg", b"", "image/jpeg")}
        response = await client.post("/api/v1/inspections", files=files)
        assert response.status_code == 400
        assert "empty" in response.json()["detail"].lower()

@pytest.mark.asyncio
async def test_inspection_pipeline_and_history(sample_image_bytes):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Post inspection
        files = {"file": ("test_weld.jpg", sample_image_bytes, "image/jpeg")}
        data = {"device_id": "TEST-RIG-01", "notes": "Automated test weld"}
        post_res = await client.post("/api/v1/inspections", files=files, data=data)
        assert post_res.status_code == 201
        res_json = post_res.json()
        assert "inspection_id" in res_json
        assert res_json["overall_status"] in ["GOOD", "BAD", "UNCERTAIN"]
        assert 0.0 <= res_json["quality_score"] <= 100.0
        assert "original_image_url" in res_json
        assert "annotated_image_url" in res_json

        inspection_id = res_json["inspection_id"]

        # 2. Get by ID
        get_res = await client.get(f"/api/v1/inspections/{inspection_id}")
        assert get_res.status_code == 200
        assert get_res.json()["inspection_id"] == inspection_id

        # 3. List history
        list_res = await client.get("/api/v1/inspections?page=1&limit=10")
        assert list_res.status_code == 200
        history = list_res.json()
        assert history["total"] >= 1
        assert any(item["inspection_id"] == inspection_id for item in history["items"])

        # 4. Get stats
        stats_res = await client.get("/api/v1/inspections/stats/summary")
        assert stats_res.status_code == 200
        stats = stats_res.json()
        assert stats["total_inspections"] >= 1

        # 5. Delete inspection
        del_res = await client.delete(f"/api/v1/inspections/{inspection_id}")
        assert del_res.status_code == 200

        # Verify deletion
        get_after_del = await client.get(f"/api/v1/inspections/{inspection_id}")
        assert get_after_del.status_code == 404
