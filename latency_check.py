import time
from ultralytics import YOLO
import cv2
 
model = YOLO("runs/detect/YOLO Weld Detection project/weld_yolo_training/weights/best.pt")          # or the full runs/... path
 
image = cv2.imread("datasets/The Welding Defect Dataset/train/images/bad_weld_vid687_jpeg_jpg.rf.38ed9c3806fc2ff68dea2ccafcc431ab.jpg")
 
start = time.time()
results = model(image)
end = time.time()
 
latency = end - start
print("Inference Time:", latency, "seconds")
