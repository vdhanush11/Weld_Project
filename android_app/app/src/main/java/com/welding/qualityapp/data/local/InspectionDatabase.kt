package com.welding.qualityapp.data.local

import android.content.Context
import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Entity(tableName = "cached_inspections")
data class CachedInspectionEntity(
    @PrimaryKey val id: String,
    val timestamp: String,
    val originalImageUrl: String,
    val annotatedImageUrl: String,
    val overallStatus: String,
    val qualityScore: Float,
    val decisionReason: String,
    val confidenceCategory: String,
    val defectCount: Int,
    val modelVersion: String,
    val processingTimeMs: Float
)

@Dao
interface InspectionDao {
    @Query("SELECT * FROM cached_inspections ORDER BY timestamp DESC")
    fun getAllInspections(): Flow<List<CachedInspectionEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertInspection(inspection: CachedInspectionEntity)

    @Query("DELETE FROM cached_inspections WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM cached_inspections")
    suspend fun clearAll()
}

@Database(entities = [CachedInspectionEntity::class], version = 1, exportSchema = false)
abstract class InspectionDatabase : RoomDatabase() {
    abstract fun inspectionDao(): InspectionDao

    companion object {
        @Volatile
        private var INSTANCE: InspectionDatabase? = null

        fun getDatabase(context: Context): InspectionDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    InspectionDatabase::class.java,
                    "weld_quality_cache.db"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
