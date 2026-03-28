import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DriverManagement } from "@/components/DriverManagement";

const DriverManagementPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Settings className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-sm font-bold text-foreground">Driver Management</h1>
            <p className="text-[10px] text-muted-foreground">Add and manage driver profiles</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/driver")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span className="text-xs">Back to Login</span>
        </Button>
      </header>

      {/* Main Content */}
      <main className="p-4">
        <DriverManagement />
      </main>
    </div>
  );
};

export default DriverManagementPage;
