package com.safesignal.shared.emergency

interface EmergencyIncidentRepository {
    suspend fun getAll(): List<EmergencyIncident>
    suspend fun save(incident: EmergencyIncident)
    suspend fun getById(id: String): EmergencyIncident?
    suspend fun delete(id: String)
}
