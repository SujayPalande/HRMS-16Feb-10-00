import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  FileJson, 
  Users, 
  CalendarDays, 
  IndianRupee, 
  ClipboardList,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  FileDown
} from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";

export default function ReportsMainPage() {
  const [, setLocation] = useLocation();

  const reportCategories = [
    {
      title: "Attendance Reports",
      description: "Analyze daily, monthly, and yearly attendance patterns, late arrivals, and overtime.",
      icon: <CalendarDays className="h-6 w-6 text-blue-600" />,
      path: "/reports/attendance",
      metrics: [
        { label: "Avg. Presence", value: "94.2%" },
        { label: "Late Rate", value: "3.1%" }
      ],
      color: "blue"
    },
    {
      title: "Leave Reports",
      description: "Track leave applications, balances, accruals, and departmental leave trends.",
      icon: <ClipboardList className="h-6 w-6 text-teal-600" />,
      path: "/reports/leave",
      metrics: [
        { label: "On Leave", value: "12" },
        { label: "Pending", value: "5" }
      ],
      color: "teal"
    },
    {
      title: "Payroll Reports",
      description: "Comprehensive payroll analysis, salary distributions, deductions, and tax summaries.",
      icon: <IndianRupee className="h-6 w-6 text-green-600" />,
      path: "/reports/payroll",
      metrics: [
        { label: "Total Cost", value: "₹42.5L" },
        { label: "Last Cycle", value: "Jan 26" }
      ],
      color: "green"
    },
    {
      title: "Headcount Reports",
      description: "Monitor workforce growth, departmental distribution, and tenure analytics.",
      icon: <Users className="h-6 w-6 text-purple-600" />,
      path: "/reports/headcount",
      metrics: [
        { label: "Total Staff", value: "248" },
        { label: "Growth", value: "+4.2%" }
      ],
      color: "purple"
    }
  ];

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Analytics</h1>
            <p className="text-lg text-slate-500 mt-2">Executive dashboard for comprehensive workforce insights and data exports.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2 hover-elevate shadow-sm border-slate-200 dark:border-slate-800">
              <Download className="h-4 w-4" /> Bulk Export
            </Button>
            <Button className="gap-2 hover-elevate shadow-md bg-blue-600 hover:bg-blue-700 text-white border-0">
              <BarChart3 className="h-4 w-4" /> Schedule Report
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-none shadow-sm bg-blue-600 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
              <Users size={120} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-100 text-sm font-medium uppercase tracking-wider">Active Employees</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">248</div>
              <p className="text-blue-100 text-xs flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" /> +12 from last month
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-teal-600 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
              <CalendarDays size={120} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-teal-100 text-sm font-medium uppercase tracking-wider">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">96.8%</div>
              <p className="text-teal-100 text-xs flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" /> +0.5% higher
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-green-600 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
              <IndianRupee size={120} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-green-100 text-sm font-medium uppercase tracking-wider">Monthly Payroll</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">₹42.5L</div>
              <p className="text-green-100 text-xs flex items-center gap-1 font-medium">
                <TrendingUp className="h-3 w-3" /> Within budget
              </p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-purple-600 text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
              <ClipboardList size={120} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-purple-100 text-sm font-medium uppercase tracking-wider">Leave Utilization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold mb-1">8.2%</div>
              <p className="text-purple-100 text-xs flex items-center gap-1 font-medium">
                Normal range
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {reportCategories.map((report, idx) => (
            <motion.div
              key={report.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card 
                className="hover-elevate cursor-pointer border-slate-200 dark:border-slate-800 overflow-hidden group h-full"
                onClick={() => setLocation(report.path)}
              >
                <div className="p-1 h-1 bg-current" style={{ color: `var(--${report.color}-600)` }} />
                <CardHeader className="flex flex-row items-start justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-${report.color}-50 dark:bg-${report.color}-950 text-${report.color}-600`}>
                        {report.icon}
                      </div>
                      {report.title}
                    </CardTitle>
                    <CardDescription className="text-base pt-2">
                      {report.description}
                    </CardDescription>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 mt-4">
                    {report.metrics.map(m => (
                      <div key={m.label} className="space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{m.label}</p>
                        <p className="text-lg font-bold text-slate-700 dark:text-slate-200">{m.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm font-bold text-blue-600 flex items-center gap-1">
                      View full analysis <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="pt-12 border-t border-slate-100 dark:border-slate-900">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Download className="h-6 w-6 text-blue-600" />
              Quick Export Center
            </h2>
            <div className="flex items-center gap-4">
              <Select defaultValue="january-2026">
                <SelectTrigger className="w-48 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="january-2026">January 2026</SelectItem>
                  <SelectItem value="december-2025">December 2025</SelectItem>
                  <SelectItem value="year-2025">Full Year 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-50 dark:bg-slate-950/50 border-dashed border-2 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-900 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-4 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 mb-4 w-fit">
                  <FileSpreadsheet size={32} />
                </div>
                <CardTitle className="text-lg">Excel Export</CardTitle>
                <CardDescription>Multi-sheet comprehensive data</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Button variant="outline" className="w-full max-w-[160px] gap-2 hover-elevate shadow-sm bg-white dark:bg-slate-950">
                  <Download className="h-4 w-4" /> Download .xlsx
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-950/50 border-dashed border-2 border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-900 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-4 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 mb-4 w-fit">
                  <FileDown size={32} />
                </div>
                <CardTitle className="text-lg">PDF Reports</CardTitle>
                <CardDescription>Professional formatted documents</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Button variant="outline" className="w-full max-w-[160px] gap-2 hover-elevate shadow-sm bg-white dark:bg-slate-950">
                  <Download className="h-4 w-4" /> Download .pdf
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 dark:bg-slate-950/50 border-dashed border-2 border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 transition-colors">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto p-4 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600 mb-4 w-fit">
                  <FileText size={32} />
                </div>
                <CardTitle className="text-lg">Text/CSV Data</CardTitle>
                <CardDescription>Raw data for custom processing</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8">
                <Button variant="outline" className="w-full max-w-[160px] gap-2 hover-elevate shadow-sm bg-white dark:bg-slate-950">
                  <Download className="h-4 w-4" /> Download .txt
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
