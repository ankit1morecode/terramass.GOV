import { useEffect, useState } from "react";
import mqtt from "mqtt";

interface MQTTMessage {
  topic: string;
  message: string;
  timestamp: number;
}

export const useMQTTDirect = () => {
  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);

  useEffect(() => {
    const mqttBroker = "mqtt://10.141.141.72";
    
    const mqttClient = mqtt.connect(mqttBroker, {
      reconnectPeriod: 5000,
      connectTimeout: 30000,
      clean: true
    });

    mqttClient.on("connect", () => {
      console.log("Direct MQTT connected");
      setIsConnected(true);
      mqttClient.subscribe("trailer/#", (err) => {
        if (err) console.error("Subscription error:", err);
      });
    });

    mqttClient.on("message", (topic, message) => {
      const value = message.toString();
      setMessages(prev => [
        { topic, message: value, timestamp: Date.now() },
        ...prev.slice(0, 99) // Keep last 100 messages
      ]);
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT error:", err);
      setIsConnected(false);
    });

    mqttClient.on("offline", () => {
      console.log("MQTT offline");
      setIsConnected(false);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const publishMessage = (topic: string, message: string) => {
    if (client && isConnected) {
      client.publish(topic, message);
    }
  };

  return { messages, isConnected, publishMessage };
};
