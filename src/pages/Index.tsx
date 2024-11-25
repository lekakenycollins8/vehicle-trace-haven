import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { VehicleList } from "@/components/VehicleList";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">TrackVehicles</h1>
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm text-destructive hover:text-destructive/90"
          >
            Sign Out
          </button>
        </div>
      </header>
      <main>
        <VehicleList />
      </main>
    </div>
  );
}