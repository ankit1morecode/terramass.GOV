const express = require('express');
const cors = require('cors');
const { getLatestTelemetry } = require('./local-storage');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`📊 Telemetry endpoint: http://localhost:${PORT}/api/telemetry`);
});
