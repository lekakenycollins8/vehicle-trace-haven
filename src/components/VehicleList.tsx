import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, AlertTriangle } from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  model: string;
  registration_number: string;
}

interface Position {
  id: string;
  vehicle_id: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: string;
}

interface Alert {
  id: string;
  vehicle_id: string;
  type: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

export function VehicleList() {
  const { data: vehicles, isLoading: isLoadingVehicles } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("vehicles");
      if (error) throw error;
      return data?.vehicles || [];
    },
  });

  const { data: positions } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("positions");
      if (error) throw error;
      return data?.positions || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("alerts");
      if (error) throw error;
      return data?.alerts || [];
    },
    refetchInterval: 30000,
  });

  if (isLoadingVehicles) {
    return <div className="flex justify-center p-8">Loading vehicles...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles?.map((vehicle) => {
          const vehiclePositions = positions?.filter((p) => p.vehicle_id === vehicle.id) || [];
          const latestPosition = vehiclePositions[0];
          const vehicleAlerts = alerts?.filter((a) => a.vehicle_id === vehicle.id && !a.resolved) || [];

          return (
            <Card key={vehicle.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  {vehicle.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Model: {vehicle.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Registration: {vehicle.registration_number}
                  </p>
                  {latestPosition && (
                    <div className="mt-4">
                      <p className="text-sm font-medium">Last Known Position:</p>
                      <p className="text-sm text-muted-foreground">
                        Lat: {latestPosition.latitude.toFixed(6)}, 
                        Lon: {latestPosition.longitude.toFixed(6)}
                      </p>
                      {latestPosition.speed && (
                        <p className="text-sm text-muted-foreground">
                          Speed: {latestPosition.speed} km/h
                        </p>
                      )}
                    </div>
                  )}
                  {vehicleAlerts.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm font-medium">Active Alerts:</p>
                      </div>
                      {vehicleAlerts.map((alert) => (
                        <p key={alert.id} className="text-sm text-destructive">
                          {alert.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}