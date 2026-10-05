import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { driverApi, type DriverMessage, type DriverProfile } from "@/lib/driver-api";

export const DriverMessagePanel = ({ drivers }: { drivers: DriverProfile[] }) => {
  const { toast } = useToast();
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<DriverMessage[]>([]);

  const fetchMessages = useCallback(async () => {
    if (!selectedDriverId) return;
    try {
      setMessages(await driverApi.messages(selectedDriverId));
    } catch {
      // transient; next poll retries
    }
  }, [selectedDriverId]);

  useEffect(() => {
    setMessages([]);
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const send = async (target: { driverId: string } | { broadcast: true }) => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    try {
      const { count } = await driverApi.send(text, target);
      setMessage("");
      if ("broadcast" in target) toast({ title: `Broadcast sent to ${count} drivers` });
      await fetchMessages();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to send", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => selectedDriverId && send({ driverId: selectedDriverId });

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Message Drivers</h3>
      </div>
      <div className="p-4 space-y-3">
        <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a driver..." />
          </SelectTrigger>
          <SelectContent>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            maxLength={1000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button
            size="sm"
            aria-label="Send to selected driver"
            onClick={handleSend}
            disabled={sending || !selectedDriverId || !message.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            aria-label="Broadcast to all drivers"
            title="Broadcast to all drivers"
            onClick={() => send({ broadcast: true })}
            disabled={sending || !message.trim() || drivers.length === 0}
          >
            <Radio className="h-4 w-4" />
          </Button>
        </div>

        {selectedDriverId && (
          <ScrollArea className="h-40">
            {messages.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No messages yet</p>
            ) : (
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-2 rounded bg-secondary/30 text-xs">
                    <p className="text-foreground break-words">{msg.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex justify-between">
                      <span>{new Date(msg.created_at).toLocaleString()}</span>
                      <span>{msg.read ? "Read" : "Delivered"}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );
};
