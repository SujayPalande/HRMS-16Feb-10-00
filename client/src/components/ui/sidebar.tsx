import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { User } from "@shared/schema";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { 
  LayoutDashboard, Users, Building2, ShieldCheck, Clock, 
  CalendarCheck, CalendarClock, FileBarChart, FileSpreadsheet, 
  LogOut, ChevronRight, ChevronLeft, ChevronDown, DollarSign, Settings,
  Target, GraduationCap, Briefcase, Car, Package, FileText, Scale,
  UserCheck, BarChart3, Wallet, Receipt, TrendingUp, Award,
  BookOpen, Calendar, ClipboardList, FileCheck, Truck, Box,
  FileSignature, AlertTriangle, Calculator, FileArchive, Download,
  ShieldAlert, Settings2, Play, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSidebar } from "@/hooks/use-sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { hasAnyPermission } from "@/lib/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
  permissions?: string[];
};

type NavSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  items: NavItem[];
  permissions?: string[];
  adminOnly?: boolean;
};

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { collapsed, toggleSidebar } = useSidebar();
  const { user, logoutMutation } = useAuth();
  const { organizationName } = useOrganization();
  
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('sidebar-open-sections');
    return saved ? JSON.parse(saved) : {};
  });
  
  // Ref to preserve sidebar scroll position when navigating
  const navRef = useRef<HTMLElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const previousLocationRef = useRef<string>(location);

  useEffect(() => {
    localStorage.setItem('sidebar-open-sections', JSON.stringify(openSections));
  }, [openSections]);
  
  // Restore scroll position after location change with multiple attempts
  useLayoutEffect(() => {
    if (location !== previousLocationRef.current) {
      previousLocationRef.current = location;
      // We no longer automatically scroll on location change to respect user position
    }
  }, [location]);
  
  // Save scroll position on every scroll event to capture the latest position
  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;
    
    const handleScroll = () => {
      scrollPositionRef.current = navElement.scrollTop;
    };
    
    navElement.addEventListener('scroll', handleScroll, { passive: true });
    return () => navElement.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleSection = (sectionId: string) => {
    // No-op for scroll preservation - the browser and our effects already handle this
    setOpenSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isSuperAdmin = user?.role === 'developer' || user?.role === 'admin';
  const isAdminRole = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';
  const isDeveloper = user?.role === 'developer';

  const developerNavSections: NavSection[] = [
    {
      id: "developer",
      title: "Developer",
      icon: <Settings className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "System Settings", href: "/developer/system-settings", icon: <Settings className="h-4 w-4" /> },
        { title: "Employee Limit", href: "/developer/employee-limit", icon: <Users className="h-4 w-4" /> }
      ]
    }
  ];

  const navSections: NavSection[] = [
    {
      id: "master-data",
      title: "Administration",
      icon: <Settings2 className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "Master Data", href: "/master-data", icon: <Settings className="h-4 w-4" /> },
        { title: "System Settings", href: "/developer/system-settings", icon: <Settings className="h-4 w-4" /> },
        { title: "Employee Limit", href: "/developer/employee-limit", icon: <ShieldAlert className="h-4 w-4" /> }
      ]
    },
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "Overview", href: "/", icon: <LayoutDashboard className="h-4 w-4" /> }
      ]
    },
    {
      id: "employee-management",
      title: "Employee Management",
      icon: <Users className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "Employees", href: "/employees", icon: <Users className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Departments", href: "/departments", icon: <Building2 className="h-4 w-4" />, permissions: ["departments.view"] },
        { title: "Roles & Permissions", href: "/roles", icon: <ShieldCheck className="h-4 w-4" />, permissions: ["roles.view"] },
        { title: "Document Management", href: "/documents", icon: <FileArchive className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "attendance-leave",
      title: "Attendance & Leave",
      icon: <Clock className="h-5 w-5" />,
      defaultOpen: true,
      items: [
        { title: "Attendance", href: "/attendance", icon: <Clock className="h-4 w-4" />, permissions: ["attendance.view"] },
        { title: "Leave Management", href: "/leave", icon: <CalendarCheck className="h-4 w-4" />, permissions: ["leave.view"] },
        { title: "Holidays", href: "/holidays", icon: <CalendarClock className="h-4 w-4" /> },
        { title: "Shift Management", href: "/shifts", icon: <Calendar className="h-4 w-4" />, permissions: ["attendance.view"] }
      ]
    },
    {
      id: "payroll",
      title: "Payroll Management",
      icon: <DollarSign className="h-5 w-5" />,
      adminOnly: true,
      items: [
        { title: "Payroll Dashboard", href: "/payroll", icon: <Wallet className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Salary Structure", href: "/payroll/structure", icon: <Receipt className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Payslip Generation", href: "/payroll/payslips", icon: <FileText className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Bank Transfers", href: "/payroll/transfers", icon: <DollarSign className="h-4 w-4" />, permissions: ["payroll.view"] }
      ]
    },
    {
      id: "recruitment",
      title: "Recruitment & Onboarding",
      icon: <Briefcase className="h-5 w-5" />,
      adminOnly: true,
      items: [
        { title: "Offer Letters", href: "/recruitment/offers", icon: <FileSignature className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Digital Joining", href: "/recruitment/joining", icon: <UserCheck className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Document Portal", href: "/recruitment/documents", icon: <FileArchive className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "performance",
      title: "Performance Management",
      icon: <Target className="h-5 w-5" />,
      items: [
        { title: "Goals & KPIs", href: "/performance/goals", icon: <Target className="h-4 w-4" /> },
        { title: "Appraisals", href: "/performance/appraisals", icon: <TrendingUp className="h-4 w-4" /> },
        { title: "360° Feedback", href: "/performance/feedback", icon: <Award className="h-4 w-4" /> },
        { title: "Performance Reports", href: "/performance/reports", icon: <BarChart3 className="h-4 w-4" /> }
      ]
    },
    {
      id: "training",
      title: "Training & Development",
      icon: <GraduationCap className="h-5 w-5" />,
      items: [
        { title: "Training Calendar", href: "/training/calendar", icon: <Calendar className="h-4 w-4" /> },
        { title: "Skill Matrix", href: "/training/skills", icon: <ClipboardList className="h-4 w-4" /> },
        { title: "Certifications", href: "/training/certifications", icon: <Award className="h-4 w-4" /> },
        { title: "Training Requests", href: "/training/requests", icon: <BookOpen className="h-4 w-4" /> }
      ]
    },
    {
      id: "expense",
      title: "Expense & Travel",
      icon: <Car className="h-5 w-5" />,
      items: [
        { title: "Expense Claims", href: "/expense/claims", icon: <Receipt className="h-4 w-4" /> },
        { title: "Travel Requests", href: "/expense/travel", icon: <Truck className="h-4 w-4" /> },
        { title: "Reimbursements", href: "/expense/reimbursements", icon: <Wallet className="h-4 w-4" /> }
      ]
    },
    {
      id: "assets",
      title: "Asset Management",
      icon: <Package className="h-5 w-5" />,
      adminOnly: true,
      items: [
        { title: "Asset Allocation", href: "/assets/allocation", icon: <Box className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Asset Tracking", href: "/assets/tracking", icon: <Package className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Asset Returns", href: "/assets/returns", icon: <FileCheck className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "letters",
      title: "HR Letters & Documents",
      icon: <FileText className="h-5 w-5" />,
      adminOnly: true,
      items: [
        { title: "Appointment Letters", href: "/letters/appointment", icon: <FileSignature className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Increment Letters", href: "/letters/increment", icon: <TrendingUp className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Warning Letters", href: "/letters/warning", icon: <AlertTriangle className="h-4 w-4" />, permissions: ["employees.view"] },
        { title: "Experience Letters", href: "/letters/experience", icon: <Award className="h-4 w-4" />, permissions: ["employees.view"] }
      ]
    },
    {
      id: "self-service",
      title: "Self Service",
      icon: <UserCheck className="h-5 w-5" />,
      items: [
        { title: "My Profile", href: "/self-service/profile", icon: <Users className="h-4 w-4" /> },
        { title: "My Payslips", href: "/self-service/payslips", icon: <FileText className="h-4 w-4" /> },
        { title: "My Documents", href: "/self-service/documents", icon: <Download className="h-4 w-4" /> },
        { title: "My Attendance", href: "/self-service/attendance", icon: <Clock className="h-4 w-4" /> }
      ]
    },
    {
      id: "reports",
      title: "Reports & Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      adminOnly: true,
      items: [
        { title: "Attendance Reports", href: "/reports/attendance", icon: <FileBarChart className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Leave Reports", href: "/reports/leave", icon: <FileSpreadsheet className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Payroll Reports", href: "/reports/payroll", icon: <DollarSign className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Muster Roll - Form II", href: "/reports/muster-roll", icon: <ClipboardList className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Leave Register - Form 20", href: "/reports/leave-register", icon: <BookOpen className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Headcount Report", href: "/reports/headcount", icon: <Users className="h-4 w-4" />, permissions: ["reports.view"] },
        { title: "Provident Fund", href: "/compliance/pf", icon: <Shield className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Employees' State Insurance", href: "/compliance/esi", icon: <Building2 className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Professional Tax", href: "/compliance/pt", icon: <Calculator className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Maharashtra Labour Welfare Fund", href: "/compliance/mlwf", icon: <Shield className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Bonus Reports", href: "/compliance/bonus-reports", icon: <FileSpreadsheet className="h-4 w-4" />, permissions: ["payroll.view"] },
        { title: "Form 16", href: "/compliance/form16-tds", icon: <FileText className="h-4 w-4" />, permissions: ["payroll.view"] }
      ]
    }
  ];

    const sectionsToUse = isDeveloper ? developerNavSections : navSections;

    const filteredSections = sectionsToUse
      .filter(section => {
        if (section.id === "master-data") return isSuperAdmin;
        if (section.adminOnly && !isAdminRole) return false;
        if (section.permissions) {
          return hasAnyPermission(user, section.permissions);
        }
        return true;
      })
    .map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (!item.permissions || item.permissions.length === 0) return true;
        return hasAnyPermission(user, item.permissions);
      })
    }))
    .filter(section => section.items.length > 0);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (user: User) => {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };

  const isSectionActive = (section: NavSection) => {
    return section.items.some(item => location === item.href || location.startsWith(item.href + '/'));
  };

  return (
    <>
      <div 
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          !collapsed ? "block" : "hidden"
        )}
        onClick={() => toggleSidebar()}
      />
      
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out lg:relative lg:z-0",
          "lg:translate-x-0",
          collapsed ? "-translate-x-full lg:translate-x-0 lg:w-20" : "translate-x-0 w-72",
          className
        )}
      >
        <div className={cn(
          "flex items-center border-b border-slate-200 transition-all duration-300",
          collapsed ? "justify-center px-2 py-4" : "justify-between px-4 py-4"
        )}>
          {collapsed ? (
            <Button 
              onClick={() => toggleSidebar()} 
              variant="ghost" 
              size="icon" 
              className="hidden lg:flex"
              data-testid="button-sidebar-expand"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          ) : (
            <>
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div className="w-16 h-10 rounded-md overflow-hidden bg-white flex items-center justify-center">
                    <img src={`${import.meta.env.BASE_URL}images/img.png`} alt="logo" className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900 mt-1">HRMS</h1>
                </div>
              </div>
              <Button 
                onClick={() => toggleSidebar()} 
                variant="ghost" 
                size="icon" 
                className="hidden lg:flex"
                data-testid="button-sidebar-toggle"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
        
        <nav ref={navRef} className="flex-1 py-3 overflow-y-auto sidebar-scrollbar">
          {filteredSections.map((section) => {
            const isOpen = openSections[section.id] ?? section.defaultOpen ?? false;
            const isActive = isSectionActive(section);
            
            return (
              <div key={section.id} className="mb-1">
                {collapsed ? (
                  <div className="px-2">
                    {section.items.slice(0, 1).map((item, j) => (
                      <Link 
                        key={j} 
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center p-2 my-1 rounded-md",
                          location === item.href 
                            ? "bg-teal-50 text-teal-700" 
                            : "text-slate-600 hover:bg-slate-100"
                        )}
                        data-testid={`link-${section.id}`}
                      >
                        {section.icon}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                    <CollapsibleTrigger 
                      className={cn(
                        "flex items-center justify-between w-full px-3 py-2 mx-1 text-sm font-medium rounded-md transition-colors",
                        isActive 
                          ? "bg-teal-50 text-teal-700" 
                          : "text-slate-700 hover:bg-slate-50"
                      )}
                      data-testid={`button-section-${section.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(isActive ? "text-teal-600" : "text-slate-500")}>
                          {section.icon}
                        </div>
                        <span className="text-sm">{section.title}</span>
                      </div>
                      <ChevronDown 
                        className={cn(
                          "h-4 w-4 text-slate-400 transition-transform duration-200",
                          isOpen && "rotate-180"
                        )} 
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <div className="ml-4 pl-4 border-l border-slate-200">
                        {section.items.map((item, j) => {
                          const isItemActive = location === item.href;
                          return (
                            <Link 
                              key={j} 
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 my-0.5 text-sm rounded-md transition-colors",
                                isItemActive 
                                  ? "bg-teal-100 text-teal-800 font-medium" 
                                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                              )}
                              data-testid={`link-${item.href.replace(/\//g, '-').slice(1)}`}
                            >
                              <div className={cn(
                                "flex-shrink-0",
                                isItemActive ? "text-teal-600" : "text-slate-400"
                              )}>
                                {item.icon}
                              </div>
                              <span>{item.title}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            );
          })}
        </nav>
        
        {user && (
          <div className="p-3 border-t border-slate-200">
            <div className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.photoUrl || ""} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="text-sm">{getInitials(user)}</AvatarFallback>
              </Avatar>
              
              {!collapsed && (
                <div className="ml-3 mr-auto overflow-hidden">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                </div>
              )}
              
              <Button 
                onClick={handleLogout} 
                variant="ghost" 
                size="icon" 
                className="ml-auto text-slate-500 hover:text-slate-700"
                data-testid="button-logout"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
