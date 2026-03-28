import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Driver {
  id: string;
  display_name: string;
}

export const DriverMessagePanel = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<{ id: string; message: string; created_at: string; driver_id: string }[]>([]);

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from("drivers")
        .select("id, display_name")
        .order("display_name");
      if (data) setDrivers(data);
    };
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (!selectedDriverId) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("driver_messages")
        .select("id, message, created_at, driver_id")
        .eq("driver_id", selectedDriverId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setMessages(data);
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedDriverId]);

  const handleSend = async () => {
    if (!message.trim() || !selectedDriverId) return;
    setSending(true);
    await supabase.from("driver_messages").insert({
      driver_id: selectedDriverId,
      message: message.trim(),
    });
    setMessage("");
    setSending(false);
    // Refresh messages
    const { data } = await supabase
      .from("driver_messages")
      .select("id, message, created_at, driver_id")
      .eq("driver_id", selectedDriverId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setMessages(data);
  };

  const handleSendToAll = async () => {
    if (!message.trim() || drivers.length === 0) return;
    setSending(true);
    const rows = drivers.map((d) => ({
      driver_id: d.id,
      message: message.trim(),
    }));
    await supabase.from("driver_messages").insert(rows);
    setMessage("");
    setSending(false);
  };

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Message Drivers
        </h3>
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
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button size="sm" onClick={handleSend} disabled={sending || !selectedDriverId || !message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={handleSendToAll} disabled={sending || !message.trim()}>
            <Users className="h-4 w-4" />
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
                    <p className="text-foreground">{msg.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(msg.created_at).toLocaleString()}
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
