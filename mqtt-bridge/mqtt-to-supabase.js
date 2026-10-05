const mqtt = require("mqtt");
const { createClient } = require("@supabase/supabase-js");
const { saveTelemetry, getLatestTelemetry } = require("./local-storage");

// Configuration — all from environment, no hardcoded credentials.
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;
const MQTT_USERNAME = process.env.MQTT_USERNAME;
const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const MQTT_WEBHOOK_SECRET = process.env.MQTT_WEBHOOK_SECRET;

const missing = ["MQTT_BROKER_URL", "SUPABASE_URL", "SUPABASE_ANON_KEY", "MQTT_WEBHOOK_SECRET"].filter(
  (k) => !process.env[k]
);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(", ")} (see .env.example)`);
  process.exit(1);
}

const client = mqtt.connect(MQTT_BROKER_URL, {
  reconnectPeriod: 5000,
  connectTimeout: 30000,
  clean: true,
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Writes go through the authenticated mqtt-webhook edge function; the anon key alone
// has no write access to vehicle_telemetry.
async function pushTelemetry(record) {
  const { error } = await supabase.functions.invoke("mqtt-webhook", {
    body: record,
    headers: { "x-webhook-secret": MQTT_WEBHOOK_SECRET },
  });
  return error;
}

let telemetry = {
  vehicle_id: "TRAILER_1",
  vehicle_name: "TRAILER_1",
  vehicle_plate: "TR-001",
  driver: "John Smith",
  vehicle_type: "truck"
};

client.on("connect", () => {
  console.log("MQTT connected to broker:", MQTT_BROKER_URL);
  client.subscribe("trailer/#", (err) => {
    if (err) {
      console.error("Subscription error:", err);
    } else {
      console.log("Subscribed to trailer/# topics");
    }
  });
});

client.on("error", (err) => {
  console.error("MQTT connection error:", err);
});

client.on("offline", () => {
  console.log("MQTT client offline");
});

client.on("reconnect", () => {
  console.log("MQTT reconnecting...");
});

client.on("message", async (topic, message) => {
  try {
    const value = message.toString();
    console.log(`Received ${topic}: ${value}`);

    // Update telemetry based on topic
    switch(topic) {
      case "trailer/speed":
        telemetry.speed = parseFloat(value);
        break;
      case "trailer/load":
        telemetry.load = parseFloat(value);
        break;
      case "trailer/pitch":
        telemetry.slope = parseFloat(value);
        break;
      case "trailer/v_safe":
        telemetry.safe_speed = parseFloat(value);
        break;
      case "trailer/status":
        telemetry.status = value;
        break;
      default:
        console.log(`Unknown topic: ${topic}`);
        return;
    }

    telemetry.updated_at = new Date().toISOString();

    // Calculate derived values
    if (telemetry.speed && telemetry.safe_speed) {
      telemetry.throttle = Math.min(100, (telemetry.speed / telemetry.safe_speed) * 100);
      telemetry.deceleration = telemetry.speed > telemetry.safe_speed ? 
        (telemetry.speed - telemetry.safe_speed) * 0.5 : 0;
      
      // Simple braking distance calculation (simplified)
      telemetry.braking_distance = Math.round(
        (telemetry.speed * telemetry.speed) / (254 * 0.7) * (1 + telemetry.slope / 100)
      );
    }

    telemetry.grip_coefficient = 0.7 + Math.random() * 0.2; // Simulated grip

    // Try to save to Supabase first
    try {
      const error = await pushTelemetry(telemetry);

      if (error) {
        console.error("Supabase webhook error:", error.message);
        // Fallback to local storage
        saveTelemetry(telemetry);
      } else {
        console.log("✅ Telemetry saved to Supabase");
      }
    } catch (supabaseError) {
      console.error("Supabase connection error:", supabaseError.message);
      // Fallback to local storage
      saveTelemetry(telemetry);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down MQTT bridge...');
  client.end();
  process.exit(0);
});