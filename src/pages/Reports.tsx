import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            The reports feature is currently under development.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}