const express = require('express');
const cors = require('cors');
const { getLatestTelemetry } = require('./local-storage');

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;
// Bind to loopback by default so the API isn't exposed to the whole LAN.
const HOST = process.env.API_HOST || "127.0.0.1";
const ALLOWED_ORIGINS = (process.env.API_ALLOWED_ORIGINS || "http://localhost:8080,http://localhost:5173")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Middleware
app.disable("x-powered-by");
app.use(cors({ origin: ALLOWED_ORIGINS, methods: ["GET"] }));
app.use(express.json({ limit: "10kb" }));

// API endpoint to get latest telemetry data
app.get('/api/telemetry', (req, res) => {
  try {
    const telemetry = getLatestTelemetry();

    // If no telemetry data, return mock data for TRAILER_1
    if (!telemetry || telemetry.length === 0) {
      const mockData = [{
        vehicle_id: "TRAILER_1",
        vehicle_name: "TRAILER_1",
        vehicle_plate: "TR-001",
        driver: "John Smith",
        vehicle_type: "truck",
        speed: 25 + Math.random() * 15,
        safe_speed: 35,
        slope: Math.random() * 10 - 5,
        grip_coefficient: 0.7 + Math.random() * 0.2,
        load: 300 + Math.random() * 200,
        throttle: 50 + Math.random() * 40,
        deceleration: Math.random() * 2,
        braking_distance: 20 + Math.random() * 30,
        status: "SAFE",
        updated_at: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }];
      return res.json(mockData);
    }
    
    res.json(telemetry);
  } catch (error) {
    console.error('Telemetry API error:', error);
    res.status(500).json({ error: 'Failed to fetch telemetry data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, HOST, () => {
  console.log(`🚀 API Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Telemetry endpoint: http://${HOST}:${PORT}/api/telemetry`);
});
