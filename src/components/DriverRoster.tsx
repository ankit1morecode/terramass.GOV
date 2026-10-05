import { useState, type FormEvent } from "react";
import { Users, UserPlus, Trash2, Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { driverApi, type DriverProfile } from "@/lib/driver-api";

const emptyForm = { display_name: "", vehicle_name: "", vehicle_plate: "", vehicle_type: "truck", password: "" };

interface DriverRosterProps {
  drivers: DriverProfile[];
  onChange: () => void;
}

export const DriverRoster = ({ drivers, onChange }: DriverRosterProps) => {
  const { toast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<DriverProfile | null>(null);

  const set = (key: keyof typeof emptyForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast({ title: "Password must be at least 8 characters", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await driverApi.create(form);
      toast({ title: `${form.display_name} added` });
      setForm(emptyForm);
      setShowAdd(false);
      onChange();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to add driver", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await driverApi.remove(pendingDelete.id);
      toast({ title: `${pendingDelete.display_name} removed` });
      onChange();
    } catch (err) {
      toast({ title: err instanceof Error ? err.message : "Failed to remove driver", variant: "destructive" });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <div className="card-glass rounded-lg overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Drivers ({drivers.length})
        </h3>
        <Button size="sm" variant="secondary" className="ml-auto h-7 text-xs" onClick={() => setShowAdd(true)}>
          <UserPlus className="h-3.5 w-3.5 mr-1" />
          Add
        </Button>
      </div>
      <div className="p-2 max-h-52 overflow-y-auto space-y-1">
        {drivers.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">No drivers yet — add one to get started.</p>
        ) : (
          drivers.map((d) => (
            <div key={d.id} className="group flex items-center gap-3 p-2 rounded hover:bg-accent/10 transition-colors">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{d.display_name}</p>
                <p className="text-[10px] text-muted-foreground truncate font-mono">
                  {d.vehicle_name} · {d.vehicle_plate}
                </p>
              </div>
              <Button
                size="icon"
                variant="ghost"
                aria-label={`Remove ${d.display_name}`}
                className="h-7 w-7 text-destructive opacity-60 group-hover:opacity-100 hover:bg-destructive/10"
                onClick={() => setPendingDelete(d)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))
        )}
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add driver</DialogTitle>
            <DialogDescription>The driver signs in to the Driver Portal with this password.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="d-name">Driver name</Label>
              <Input id="d-name" required maxLength={100} value={form.display_name} onChange={(e) => set("display_name")(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-vehicle">Vehicle</Label>
                <Input id="d-vehicle" maxLength={100} placeholder="TRAILER_1" value={form.vehicle_name} onChange={(e) => set("vehicle_name")(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-plate">Plate</Label>
                <Input id="d-plate" maxLength={20} placeholder="UP-65-AB-1234" value={form.vehicle_plate} onChange={(e) => set("vehicle_plate")(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle type</Label>
              <Select value={form.vehicle_type} onValueChange={set("vehicle_type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="mining">Mining</SelectItem>
                  <SelectItem value="municipal">Municipal</SelectItem>
                  <SelectItem value="fleet">Fleet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="d-pass">Password</Label>
              <Input
                id="d-pass"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                maxLength={128}
                value={form.password}
                onChange={(e) => set("password")(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">At least 8 characters. Stored hashed.</p>
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save driver"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.display_name}?</AlertDialogTitle>
            <AlertDialogDescription>This deletes the driver and all of their messages.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
