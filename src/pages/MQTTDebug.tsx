import { useState } from "react";
import { useMQTTDirect } from "@/components/MQTTDirectClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Wifi, WifiOff, Send, Play, Square } from "lucide-react";

export default function MQTTDebug() {
  const { messages, isConnected, publishMessage } = useMQTTDirect();
  const [testTopic, setTestTopic] = useState("trailer/test");
  const [testMessage, setTestMessage] = useState("test message");
  const [isSimulating, setIsSimulating] = useState(false);

  const startSimulation = () => {
    setIsSimulating(true);
    const interval = setInterval(() => {
      if (!isConnected) {
        setIsSimulating(false);
        clearInterval(interval);
        return;
      }
      
      const speed = (15 + Math.random() * 25).toFixed(2);
      const load = (200 + Math.random() * 300).toFixed(2);
      const pitch = (-5 + Math.random() * 10).toFixed(2);
      const safeSpeed = (25 + Math.random() * 15).toFixed(2);
      
      publishMessage("trailer/speed", speed);
      publishMessage("trailer/load", load);
      publishMessage("trailer/pitch", pitch);
      publishMessage("trailer/v_safe", safeSpeed);
      publishMessage("trailer/status", parseFloat(speed) > parseFloat(safeSpeed) ? "WARNING" : "SAFE");
    }, 2000);

    setTimeout(() => {
      setIsSimulating(false);
      clearInterval(interval);
    }, 30000); // Stop after 30 seconds
  };

  const stopSimulation = () => {
    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">MQTT Debug Console</h1>
          <Badge variant={isConnected ? "default" : "destructive"} className="gap-1">
            {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send Message */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Send Test Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Topic</label>
                <Input
                  value={testTopic}
                  onChange={(e) => setTestTopic(e.target.value)}
                  placeholder="trailer/test"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="test message"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => publishMessage(testTopic, testMessage)}
                  disabled={!isConnected}
                  className="flex-1"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
                <Button 
                  onClick={startSimulation}
                  disabled={!isConnected || isSimulating}
                  variant="outline"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Simulate
                </Button>
                {isSimulating && (
                  <Button 
                    onClick={stopSimulation}
                    variant="destructive"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Connection Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Broker:</span>
                <span className="text-sm font-mono">mqtt://10.141.141.72</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isConnected ? "default" : "destructive"}>
                  {isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Messages Received:</span>
                <span className="text-sm font-mono">{messages.length}</span>
              </div>
              {isSimulating && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Simulation:</span>
                  <Badge variant="secondary">Running</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Message Log */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Message Log</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages received yet. Start the simulator or send a test message.
                </p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {msg.topic}
                          </Badge>
                          <span className="text-sm font-mono">{msg.message}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
