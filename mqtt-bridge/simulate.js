const mqtt = require("mqtt");

// Configuration
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || "mqtt://10.141.141.72";

const client = mqtt.connect(MQTT_BROKER_URL, {
  reconnectPeriod: 5000,
  connectTimeout: 30000
});

client.on("connect", () => {
  console.log("MQTT simulator connected to:", MQTT_BROKER_URL);
  console.log("Starting simulation...");

  setInterval(() => {
    try {
      // Simulate realistic trailer telemetry
      const baseSpeed = 15 + Math.random() * 25; // 15-40 km/h
      const speed = (15 + Math.random() * 25).toFixed(2);
      const load = (200 + Math.random() * 300).toFixed(2);
      const pitch = (-5 + Math.random() * 10).toFixed(2);
      const safeSpeed = (25 + Math.random() * 15).toFixed(2); // 25-40 km/h
      
      // Determine status based on speed vs safe speed
      const speedNum = parseFloat(speed);
      const safeNum = parseFloat(safeSpeed);
      const status = speedNum > safeNum * 1.2 ? "DANGER" : 
                   speedNum > safeNum ? "WARNING" : "SAFE";

      // Publish to MQTT topics
      client.publish("trailer/speed", speed);
      client.publish("trailer/load", load);
      client.publish("trailer/pitch", pitch);
      client.publish("trailer/v_safe", safeSpeed);
      client.publish("trailer/status", status);

      console.log(`Sent telemetry: Speed=${speed}km/h, Load=${load}kg, Pitch=${pitch}°, Status=${status}`);
    } catch (error) {
      console.error("Error sending telemetry:", error);
    }
  }, 2000);
});

client.on("error", (err) => {
  console.error("MQTT simulator error:", err);
});

client.on("offline", () => {
  console.log("MQTT simulator offline");
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MQTT simulator...');
  client.end();
  process.exit(0);
});