import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Banknote, 
  Tags, 
  Building2, 
  MapPin, 
  Users, 
  FileCheck, 
  Upload, 
  IndianRupee, 
  Key, 
  Scale, 
  ShieldCheck, 
  TrendingUp, 
  Factory, 
  Search,
  FileSearch,
  UserPlus,
  ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const masterOptions = [
  { title: "Bank Master", icon: Banknote, color: "text-blue-600", path: "/master/bank-master" },
  { title: "Category Master", icon: Tags, color: "text-purple-600", path: "/master/category-master" },
  { title: "Company Master", icon: Building2, color: "text-emerald-600", path: "/master/company-master" },
  { title: "Cost Center", icon: MapPin, color: "text-orange-600", path: "/master/cost-center" },
  { title: "Department Master", icon: Factory, color: "text-cyan-600", path: "/master/department-master" },
  { title: "Document Approval", icon: FileCheck, color: "text-indigo-600", path: "/master/document-approval" },
  { title: "EmpData Upload", icon: Upload, color: "text-slate-600", path: "/master/empdata-upload" },
  { title: "Employee Deductions", icon: IndianRupee, color: "text-red-600", path: "/master/employee-deductions" },
  { title: "Employee Master", icon: Users, color: "text-blue-700", path: "/master/employee-master" },
  { title: "Import Employee", icon: UserPlus, color: "text-teal-600", path: "#" },
  { title: "Import Payrates", icon: ClipboardList, color: "text-amber-600", path: "#" },
  { title: "Login", icon: Key, color: "text-gray-700", path: "#" },
  { title: "MLWF SubCode", icon: Scale, color: "text-blue-500", path: "/master/lwf-subcode" },
  { title: "Missing Details", icon: FileSearch, color: "text-rose-500", path: "#" },
  { title: "PT SubCode", icon: ShieldCheck, color: "text-violet-600", path: "#" },
  { title: "Rate Master", icon: TrendingUp, color: "text-lime-600", path: "#" },
  { title: "Salary Increment", icon: TrendingUp, color: "text-pink-600", path: "/masters/salary-increment" },
  { title: "Unit Master", icon: Factory, color: "text-sky-600", path: "#" },
  { title: "Verification Agency", icon: ShieldCheck, color: "text-slate-700", path: "#" },
  { title: "Work Location", icon: MapPin, color: "text-orange-700", path: "#" }
];

export default function MasterDataPage() {
  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Master Data Management</h1>
          <p className="text-slate-500 dark:text-slate-400">Configure core system master data and settings.</p>
        </div>

        <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm dark:bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              Miscellaneous Masters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {masterOptions.map((option) => (
                <Button
                  key={option.title}
                  variant="outline"
                  className="h-auto py-6 flex flex-col items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-800"
                  asChild
                >
                  <Link href={option.path}>
                    <div className={`p-3 rounded-full bg-slate-100 dark:bg-slate-800 ${option.color}`}>
                      <option.icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-center leading-tight">{option.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
