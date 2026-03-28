import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogIn, UserPlus, Truck, HardHat } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useToast } from "@/hooks/use-toast";

type RoleTab = "admin" | "driver";

const Auth = () => {
  const [roleTab, setRoleTab] = useState<RoleTab>("driver");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  // Driver-specific fields
  const [vehicleName, setVehicleName] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [licenseNo, setLicenseNo] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // After Google OAuth redirect, handle profile setup (fire-and-forget, non-blocking)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const provider = session.user.app_metadata?.provider;
        if (provider === "google") {
          // Run async logic outside callback to avoid blocking auth flow
          handleGooglePostAuth(session.user).catch(console.error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGooglePostAuth = async (user: any) => {
    try {
      const googleMode = localStorage.getItem("google_auth_mode");
      localStorage.removeItem("google_auth_mode");

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (googleMode === "signup") {
        // Sign-up mode: populate profile with Google name if missing
        if (!profile?.display_name) {
          const googleName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Google User";
          await supabase.from("profiles").upsert({
            user_id: user.id,
            display_name: googleName,
          }, { onConflict: "user_id" });
        }
        // Navigate after profile is set
        navigate("/auth");
      } else {
        // Sign-in mode: reject if no existing profile
        if (!profile || !profile.display_name) {
          await supabase.from("user_roles").delete().eq("user_id", user.id);
          await supabase.from("profiles").delete().eq("user_id", user.id);
          await supabase.auth.signOut();
          toast({
            title: "Account not found",
            description: "Please sign up first, then sign in with Google.",
            variant: "destructive",
          });
          return;
        }
        navigate("/auth");
      }
    } catch (err) {
      console.error("Google post-auth error:", err);
      // Don't block — let the normal auth flow continue
      navigate("/auth");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/auth");
      } else {
        const metadata: Record<string, string> = {
          display_name: displayName,
          role: roleTab,
        };
        if (roleTab === "driver") {
          metadata.vehicle_name = vehicleName;
          metadata.vehicle_plate = vehiclePlate;
          metadata.vehicle_type = vehicleType;
          metadata.license_no = licenseNo;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: metadata },
        });
        if (error) throw error;

        if (data.user) {
          await supabase.from("user_roles").update({ role: roleTab }).eq("user_id", data.user.id);
          // Also update profile with vehicle info in case trigger didn't capture it
          if (roleTab === "driver") {
            await supabase.from("profiles").update({
              vehicle_name: vehicleName,
              vehicle_plate: vehiclePlate,
              vehicle_type: vehicleType,
            }).eq("user_id", data.user.id);
          }
        }

        toast({ title: "Account created", description: "You can now sign in." });
        setIsLogin(true);
      }
    } catch (err: any) {
      const isNetworkError = err?.name === "TypeError" && err?.message?.includes("Failed to fetch");
      toast({
        title: "Error",
        description: isNetworkError
          ? "Cannot reach authentication service right now. Please retry in a moment."
          : err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: RoleTab; label: string; icon: typeof Truck }[] = [
    { key: "driver", label: "Driver", icon: Truck },
    { key: "admin", label: "Fleet Admin", icon: HardHat },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="card-glass rounded-lg p-8 w-full max-w-md space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            TerraMass<span className="text-primary">.GOV</span>
          </h1>
        </div>

        {/* Role tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-secondary/40">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setRoleTab(key)}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                roleTab === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          {isLogin
            ? `Sign in as ${roleTab === "admin" ? "Fleet Admin" : "Driver"}`
            : `Register as ${roleTab === "admin" ? "Fleet Admin" : "Driver"}`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="space-y-2">
                <Label className="text-foreground">Full Name</Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={roleTab === "admin" ? "Fleet Manager Name" : "Driver Name"}
                  required
                  className="bg-secondary/50 border-border"
                />
              </div>

              {roleTab === "driver" && (
                <>
                  <div className="space-y-2">
                    <Label className="text-foreground">License Number</Label>
                    <Input
                      value={licenseNo}
                      onChange={(e) => setLicenseNo(e.target.value)}
                      placeholder="DL-1234567890"
                      required
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-foreground">Vehicle Name</Label>
                      <Input
                        value={vehicleName}
                        onChange={(e) => setVehicleName(e.target.value)}
                        placeholder="Tata LPT 3518"
                        required
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-foreground">Plate Number</Label>
                      <Input
                        value={vehiclePlate}
                        onChange={(e) => setVehiclePlate(e.target.value)}
                        placeholder="UP-65-AB-1234"
                        required
                        className="bg-secondary/50 border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Vehicle Type</Label>
                    <Input
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      placeholder="Truck / Mining / Municipal / Fleet"
                      required
                      className="bg-secondary/50 border-border"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="bg-secondary/50 border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              className="bg-secondary/50 border-border"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isLogin ? (
              <><LogIn className="h-4 w-4 mr-2" /> Sign In</>
            ) : (
              <><UserPlus className="h-4 w-4 mr-2" /> Sign Up</>
            )}
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              localStorage.setItem("google_auth_mode", isLogin ? "signin" : "signup");
              const { error } = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (error) {
                localStorage.removeItem("google_auth_mode");
                toast({ title: "Error", description: error.message, variant: "destructive" });
                setLoading(false);
              }
            }}
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            {isLogin ? "Sign in with Google" : "Sign up with Google"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Auth;
