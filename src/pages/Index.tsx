import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, AlertTriangle, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { VehicleMap } from "@/components/VehicleMap";

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

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ vehicles: any[] }>("vehicles");
      if (error) throw error;
      return data.vehicles;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ alerts: any[] }>("alerts");
      if (error) throw error;
      return data.alerts;
    },
  });

  const activeVehicles = vehicles?.filter(v => {
    const lastPosition = v.positions?.[0];
    return lastPosition && Date.now() - new Date(lastPosition.timestamp).getTime() < 30 * 60 * 1000;
  });

  const stats = [
    {
      name: "Total Vehicles",
      value: vehicles?.length || 0,
      icon: Car,
      color: "text-blue-500",
    },
    {
      name: "Active Vehicles",
      value: activeVehicles?.length || 0,
      icon: Activity,
      color: "text-green-500",
    },
    {
      name: "Active Alerts",
      value: alerts?.filter(a => !a.resolved)?.length || 0,
      icon: AlertTriangle,
      color: "text-red-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.name}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleMap />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alerts?.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center space-x-4 rounded-lg border p-4"
                >
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              {(!alerts || alerts.length === 0) && (
                <p className="text-muted-foreground">No recent alerts</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
