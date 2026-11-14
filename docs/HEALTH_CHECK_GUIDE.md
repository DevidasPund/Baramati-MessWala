# MessMate Production Health Check Guide
**Baramati Messwala – Smart Mess & Tiffin Management System**  
*Lead Architect: Devidas Pund*

---

## 1. Overview

MessMate provides a production health check endpoint (`/api/health`) that monitors server availability and executes a live query against the production Supabase PostgreSQL database to ensure end-to-end responsiveness.

Render and external uptime services (e.g., BetterStack, UptimeRobot, Pingdom) should be pointed to this endpoint.

---

## 2. Health Endpoint Specifications

- **URL**: `https://<YOUR_RENDER_BACKEND_URL>/api/health`
- **HTTP Method**: `GET`
- **Authentication**: None required (public health probe)
- **Response Format**: `application/json`

### Success Response (`200 OK`)
When both the Node.js Express server and Supabase PostgreSQL database are functioning normally:

```json
{
  "status": "healthy",
  "application": "MessMate – Smart Mess & Tiffin Management System",
  "business": "Baramati Messwala",
  "developer": "Devidas Pund",
  "database": {
    "status": "connected",
    "provider": "Supabase PostgreSQL",
    "latencyMs": "24ms"
  },
  "uptimeSeconds": 86400,
  "environment": "production",
  "timestamp": "2026-11-14T22:30:00.000Z"
}
```

### Unhealthy Response (`503 Service Unavailable`)
If the database connection fails or drops:

```json
{
  "status": "unhealthy",
  "application": "MessMate – Smart Mess & Tiffin Management System",
  "business": "Baramati Messwala",
  "developer": "Devidas Pund",
  "database": {
    "status": "error",
    "provider": "Supabase PostgreSQL",
    "latencyMs": "N/A"
  },
  "uptimeSeconds": 120,
  "environment": "production",
  "timestamp": "2026-11-14T22:30:00.000Z"
}
```

---

## 3. Recommended Health Monitoring Configuration

### Render Health Check
Render automatically pings this endpoint if configured in `render.yaml`:
```yaml
healthCheckPath: /api/health
```
If the health check returns anything other than `200 OK` for consecutive retries during a deploy, Render pauses traffic switching and retains the previously working container.

### External Uptime Monitor Setup (e.g., UptimeRobot / BetterStack)
To prevent Render Free/Starter instances from spinning down after inactivity and to receive instant SMS/Email alerts:
1. **Monitor Type**: `HTTP(s)`
2. **URL**: `https://messmate-backend.onrender.com/api/health`
3. **Monitoring Interval**: `5 minutes`
4. **Keyword Checking**: Verify JSON contains `"status":"healthy"`
5. **Alert Condition**: HTTP status != 200 or response time > 10,000ms
