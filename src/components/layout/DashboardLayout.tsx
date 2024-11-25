import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Car, 
  FileText, 
  Settings,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform bg-card shadow-lg transition-transform duration-200 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-center border-b px-4">
          <h1 className="text-2xl font-bold">TrackVehicles</h1>
        </div>
        <nav className="mt-8 space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}