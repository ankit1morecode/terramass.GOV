# MQTT Bridge for TerraMass

This bridge connects MQTT telemetry data from trailers to Supabase for real-time dashboard visualization.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Update `.env` with your MQTT broker and Supabase credentials.

4. Run the bridge:
```bash
node mqtt-to-supabase.js
```

## Topics

The bridge subscribes to these MQTT topics:
- `trailer/speed` - Vehicle speed in km/h
- `trailer/load` - Load weight in kg
- `trailer/pitch` - Slope/pitch angle in degrees
- `trailer/v_safe` - Safe speed limit in km/h
- `trailer/status` - Vehicle status (SAFE/WARNING/DANGER)

## Data Processing

The bridge calculates derived values:
- Throttle percentage
- Deceleration
- Braking distance
- Grip coefficient (simulated)

## Simulator

Use the simulator to test the bridge:
```bash
node simulate.js
```

This publishes realistic telemetry data every 2 seconds.
