import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Reports() {
  const [timeRange, setTimeRange] = useState("week");

  const { data: positions } = useQuery({
    queryKey: ["positions", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("positions");
      if (error) throw error;
      return data?.positions || [];
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("alerts");
      if (error) throw error;
      return data?.alerts || [];
    },
  });

  // Process data for charts
  const speedData = positions?.map((pos: any) => ({
    time: new Date(pos.timestamp).toLocaleTimeString(),
    speed: pos.speed || 0,
  })) || [];

  const alertsByType = alerts?.reduce((acc: any, alert: any) => {
    acc[alert.type] = (acc[alert.type] || 0) + 1;
    return acc;
  }, {});

  const alertPieData = Object.entries(alertsByType || {}).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Reports</h1>
        <Tabs defaultValue="week" onValueChange={(value) => setTimeRange(value)}>
          <TabsList>
            <TabsTrigger value="day">24h</TabsTrigger>
            <TabsTrigger value="week">7d</TabsTrigger>
            <TabsTrigger value="month">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Speed Over Time</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={speedData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="speed"
                  stroke="#8884d8"
                  name="Speed (km/h)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts by Type</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={alertPieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {alertPieData.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}