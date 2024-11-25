import { VehicleList } from "@/components/VehicleList";

export default function Vehicles() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Vehicles</h1>
      <VehicleList />
    </div>
  );
}