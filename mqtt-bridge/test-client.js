const mqtt = require("mqtt");

// Simple test client to verify MQTT broker connectivity
const client = mqtt.connect("mqtt://10.141.141.72", {
  reconnectPeriod: 5000,
  connectTimeout: 30000
});

client.on("connect", () => {
  console.log("✅ Connected to MQTT broker");
  
  // Subscribe to all trailer topics
  client.subscribe("trailer/#", (err) => {
    if (err) {
      console.error("❌ Subscription error:", err);
    } else {
      console.log("✅ Subscribed to trailer/# topics");
    }
  });

  // Send test message
  setInterval(() => {
    const testMessage = {
      speed: (20 + Math.random() * 20).toFixed(2),
      load: (300 + Math.random() * 200).toFixed(2),
      pitch: (-2 + Math.random() * 4).toFixed(1),
      safe_speed: (30 + Math.random() * 10).toFixed(2),
      status: "SAFE"
    };

    client.publish("trailer/speed", testMessage.speed);
    client.publish("trailer/load", testMessage.load);
    client.publish("trailer/pitch", testMessage.pitch);
    client.publish("trailer/v_safe", testMessage.safe_speed);
    client.publish("trailer/status", testMessage.status);
    
    console.log("📤 Sent telemetry:", testMessage);
  }, 3000);
});

client.on("message", (topic, message) => {
  console.log(`📥 Received ${topic}: ${message.toString()}`);
});

client.on("error", (err) => {
  console.error("❌ MQTT error:", err);
});

client.on("offline", () => {
  console.log("🔌 MQTT offline");
});

client.on("reconnect", () => {
  console.log("🔄 Reconnecting...");
});

console.log("🚀 Starting MQTT test client...");