import { ReactNode } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/layout/header";
import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
  autoHeight?: boolean;
}

export function AppLayout({ children, autoHeight = false }: AppLayoutProps) {
  const { collapsed } = useSidebar();

  const navigation = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Building2, label: "Master Data", href: "/master-data" },
    { icon: Users, label: "Employees", href: "/employees" },
  ];

  return (
    <div className={cn("flex bg-slate-50", autoHeight ? "min-h-screen overflow-hidden" : "h-screen overflow-hidden")}>
      <Sidebar />
      
      <div className={cn("flex flex-col", autoHeight ? "flex-none w-full" : "flex-1 overflow-hidden")}>
        <Header />
        
        <main className={cn(autoHeight ? "h-auto overflow-visible" : "flex-1 overflow-y-auto", "p-4 md:p-6 lg:p-8")}>
          {children}
        </main>

        {/* Footer */}
        <footer className="p-3 border-t border-slate-200 text-center text-sm text-slate-500">
          Powered by <a href="https://www.cybaemtech.com" target="_blank" rel="noreferrer" className="text-teal-600 hover:underline">Cybaem Tech</a>
        </footer>
      </div>
    </div>
  );
}
