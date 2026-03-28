import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageSquare, Send, Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Driver {
  user_id: string;
  display_name: string | null;
  vehicle_name: string | null;
  vehicle_plate: string | null;
}

export const AdminMessagePanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<any[]>([]);

  // ✅ FETCH DRIVERS (ONLY FROM drivers TABLE)
  useEffect(() => {
    const fetchDrivers = async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("id, display_name, vehicle_name, vehicle_plate");

      if (error) {
        console.error("Driver fetch error:", error);
        return;
      }

      if (data) {
        setDrivers(
          data.map((d) => ({
            user_id: d.id,
            display_name: d.display_name,
            vehicle_name: d.vehicle_name,
            vehicle_plate: d.vehicle_plate,
          }))
        );
      }
    };

    fetchDrivers();
  }, []);

  // ✅ FETCH SENT MESSAGES
  useEffect(() => {
    if (!user) return;

    const fetchSent = async () => {
      const { data, error } = await supabase
        .from("admin_messages")
        .select("id, to_user_id, message, created_at, read")
        .eq("from_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Message fetch error:", error);
        return;
      }

      if (data) setSentMessages(data);
    };

    fetchSent();
    const interval = setInterval(fetchSent, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const refreshMessages = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("admin_messages")
      .select("id, to_user_id, message, created_at, read")
      .eq("from_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setSentMessages(data);
  };

  // ✅ SEND SINGLE
  const handleSend = async () => {
    if (!message.trim() || !selectedDriver || !user) return;

    setSending(true);

    const { error } = await supabase.from("admin_messages").insert({
      from_user_id: user.id,
      to_user_id: selectedDriver,
      message: message.trim(),
    });

    setSending(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sent", description: "Message delivered." });
      setMessage("");
      refreshMessages();
    }
  };

  // ✅ BROADCAST
  const handleSendToAll = async () => {
    if (!broadcastMessage.trim() || !user || drivers.length === 0) return;

    setSendingBroadcast(true);

    const rows = drivers.map((d) => ({
      from_user_id: user.id,
      to_user_id: d.user_id,
      message: broadcastMessage.trim(),
    }));

    const { error } = await supabase.from("admin_messages").insert(rows);

    setSendingBroadcast(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Broadcast Sent" });
      setBroadcastMessage("");
      refreshMessages();
    }
  };

  // ✅ DELETE DRIVER (CLEAN)
  const handleRemoveDriver = async (driverId: string) => {
    await supabase.from("drivers").delete().eq("id", driverId);
    await supabase.from("admin_messages").delete().eq("to_user_id", driverId);

    setDrivers((prev) => prev.filter((d) => d.user_id !== driverId));
    setSentMessages((prev) => prev.filter((m) => m.to_user_id !== driverId));

    if (selectedDriver === driverId) setSelectedDriver(null);

    toast({ title: "Driver removed" });
  };

  const filteredMessages = selectedDriver
    ? sentMessages.filter((m) => m.to_user_id === selectedDriver)
    : sentMessages;

  const getDriverName = (id: string) =>
    drivers.find((d) => d.user_id === id)?.display_name || id.slice(0, 8);

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="p-4 border-b flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium uppercase">Message Drivers</h3>
      </div>

      <div className="p-4 space-y-3">
        {/* Driver selector */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSelectedDriver(null)}>All</button>

          {drivers.map((d) => (
            <div key={d.user_id} className="flex items-center gap-1">
              <button onClick={() => setSelectedDriver(d.user_id)}>
                {d.display_name || d.user_id.slice(0, 8)}
              </button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </AlertDialogTrigger>

                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Driver</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the driver.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleRemoveDriver(d.user_id)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>

        {/* Broadcast */}
        {!selectedDriver && (
          <div className="flex gap-2">
            <Input value={broadcastMessage} onChange={(e) => setBroadcastMessage(e.target.value)} />
            <Button onClick={handleSendToAll}>
              <Users className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Single */}
        {selectedDriver && (
          <div className="flex gap-2">
            <Input value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button onClick={handleSend}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="h-48">
          {filteredMessages.map((msg) => (
            <div key={msg.id}>
              <p>{msg.message}</p>
            </div>
          ))}
        </ScrollArea>
      </div>
    </div>
  );
};