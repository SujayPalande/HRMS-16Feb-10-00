import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowRight, Save, Calendar, Filter, Users, IndianRupee, LayoutGrid, CheckCircle2, FileDown, Plus, Edit2, X, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface SalaryComponent {
  basic: number;
  da: number;
  splAll: number;
  hra: number;
  transAll: number;
  lta: number;
  childAll: number;
  medAll: number;
  eduAll: number;
  washAll: number;
  othAll: number;
}

interface SalaryData {
  empCode: string;
  name: string;
  location?: string;
  current: SalaryComponent;
  proposed: SalaryComponent;
}

export default function SalaryIncrementPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [editingEmployee, setEditingEmployee] = useState<SalaryData | null>(null);

  // Fetch real employee data
  const { data: employeesData, isLoading } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  // Extract unique locations from real employee data
  const uniqueBranches = useMemo(() => {
    if (!employeesData) return [];
    const locations = employeesData
      .map(emp => emp.workLocation)
      .filter((loc): loc is string => !!loc);
    return Array.from(new Set(locations)).sort();
  }, [employeesData]);

  const [employees, setEmployees] = useState<SalaryData[]>([]);

  // Initialize employees from API data only once
  useEffect(() => {
    if (employeesData && (employees.length === 0 || employees.every(emp => calculateTotals(emp.current).ctc === 0))) {
      const mapped = employeesData.map(emp => ({
        empCode: emp.employeeId || emp.id.toString(),
        name: `${emp.firstName} ${emp.lastName}`,
        location: emp.workLocation || undefined,
        current: {
          basic: Math.round(Number(emp.salary || 0) * 0.5),
          da: 0,
          splAll: Math.round(Number(emp.salary || 0) * 0.1),
          hra: Math.round(Number(emp.salary || 0) * 0.2),
          transAll: Math.round(Number(emp.salary || 0) * 0.08),
          lta: Math.round(Number(emp.salary || 0) * 0.02),
          childAll: Math.round(Number(emp.salary || 0) * 0.02),
          medAll: Math.round(Number(emp.salary || 0) * 0.05),
          eduAll: 0,
          washAll: 0,
          othAll: Math.round(Number(emp.salary || 0) * 0.03)
        },
        proposed: {
          basic: 0, da: 0, splAll: 0, hra: 0, transAll: 0, lta: 0, childAll: 0, medAll: 0, eduAll: 0, washAll: 0, othAll: 0
        }
      }));
      setEmployees(mapped);
    }
  }, [employeesData, employees.length]);

  const calculateTotals = (comp?: SalaryComponent) => {
    if (!comp) return { gross: 0, pfEmplr: 0, esiEmplr: 0, bonus: 0, gratuity: 0, ctc: 0 };
    
    const values = {
      basic: Number(comp.basic) || 0,
      da: Number(comp.da) || 0,
      hra: Number(comp.hra) || 0,
      transAll: Number(comp.transAll) || 0,
      lta: Number(comp.lta) || 0,
      childAll: Number(comp.childAll) || 0,
      medAll: Number(comp.medAll) || 0,
      eduAll: Number(comp.eduAll) || 0,
      washAll: Number(comp.washAll) || 0,
      othAll: Number(comp.othAll) || 0,
      splAll: Number(comp.splAll) || 0,
    };
    
    const gross = Object.values(values).reduce((a, b) => a + b, 0);
    
    // Standard Calculations aligned with Statutory Requirements
    const basicLimit = 15000;
    
    // Employee Side (Deductions)
    const epfEmployee = Math.min(values.basic, basicLimit) * 0.12;
    const esicEmployee = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
    const pt = 200;
    const lwf = 25;
    
    // Employer Side (for CTC)
    const epfEmployer = Math.min(values.basic, basicLimit) * 0.13;
    const esicEmployer = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
    
    // Current policy: Bonus and Gratuity excluded from CTC as per recent fix
    // (They are part of Statutory but requested as 0 for modeling currently)
    const bonus = 0;
    const gratuity = 0;
    
    const ctc = gross + epfEmployer + esicEmployer + bonus + gratuity;
    const net = gross - (epfEmployee + esicEmployee + pt + lwf);
    
    return { gross, pfEmplr: epfEmployer, esiEmplr: esicEmployer, bonus, gratuity, ctc, net };
  };

  const handleUpdateSalary = async (updatedEmployee: SalaryData) => {
    try {
      const proposedTotals = calculateTotals(updatedEmployee.proposed);
      
      // If there's a proposed salary, update the user's salary in the database
      if (proposedTotals.ctc > 0) {
        const userId = employeesData?.find(e => (e.employeeId || e.id.toString()) === updatedEmployee.empCode)?.id;
        if (userId) {
          await apiRequest("PATCH", `/api/employees/${userId}`, {
            salary: Math.round(proposedTotals.ctc)
          });
          queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
          queryClient.invalidateQueries({ queryKey: ["/api/payment-records"] });
        }
      }
      
      setEmployees(prev => prev.map(emp => emp.empCode === updatedEmployee.empCode ? updatedEmployee : emp));
      setEditingEmployee(null);
    } catch (error) {
      console.error("Failed to update salary:", error);
    }
  };

  // Metrics for dashboard
  const stats = useMemo(() => {
    const active = employees.length;
    const currentTotal = employees.reduce((sum, emp) => sum + calculateTotals(emp.current).ctc, 0);
    const proposedTotal = employees.reduce((sum, emp) => {
      const totals = calculateTotals(emp.proposed);
      return sum + (totals.ctc > 0 ? totals.ctc : calculateTotals(emp.current).ctc);
    }, 0);
    const delta = proposedTotal - currentTotal;
    const percent = currentTotal > 0 ? (delta / currentTotal * 100).toFixed(1) : "0.0";

    return [
      { title: "Active Roster", value: active, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
      { title: "Current Outflow", value: `₹${Math.round(currentTotal).toLocaleString()}`, icon: IndianRupee, color: "text-slate-600", bg: "bg-slate-50" },
      { title: "Proposed Outflow", value: `₹${Math.round(proposedTotal).toLocaleString()}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
      { title: "Budget Delta", value: `₹${Math.round(delta).toLocaleString()} (${percent}%)`, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];
  }, [employees]);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Salary Increment Planning</h1>
          <p className="text-slate-500 dark:text-slate-400">Executive compensation modeling and appraisal simulation roster.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <Card key={i} className="border-none shadow-sm overflow-hidden hover-elevate transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{stat.value}</p>
                  </div>
                  <div className={cn("p-3 rounded-2xl", stat.bg)}>
                    <stat.icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-none shadow-sm max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
                    <Calendar className="w-5 h-5 text-indigo-600" /> Phase 1: Temporal Context
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial Year Start</Label>
                      <Input defaultValue="2026" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Financial Year End</Label>
                      <Input defaultValue="2027" className="h-12 rounded-xl bg-slate-50 border-slate-200" />
                    </div>
                  </div>
                  <Button onClick={() => setStep(2)} className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase tracking-wider">
                    Initialize Simulation <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <Card className="border-none shadow-sm max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
                    <Filter className="w-5 h-5 text-indigo-600" /> Phase 2: Structural Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-slate-500">Target Branch / Location</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50 font-medium">
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Branches</SelectItem>
                        {uniqueBranches.map(branch => (
                          <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider border-2">Back</Button>
                    <Button onClick={() => setStep(3)} className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider">
                      Access Roster
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <Card className="xl:col-span-1 border-none shadow-sm h-fit">
                  <CardHeader className="border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-600" /> Revision Logic
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 block mb-2">Algorithm A: Threshold</Label>
                        <div className="flex gap-2">
                          <Input placeholder="Salary <" className="h-10 rounded-xl bg-white" />
                          <Input placeholder="New Val" className="h-10 rounded-xl bg-white" />
                        </div>
                        <Button className="w-full mt-3 h-10 rounded-xl bg-indigo-600 font-bold text-xs uppercase">Process Logic</Button>
                      </div>
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 block mb-2">Algorithm B: Percentage</Label>
                        <Input placeholder="Increment %" className="h-10 rounded-xl bg-white" />
                        <Button className="w-full mt-3 h-10 rounded-xl bg-emerald-600 font-bold text-xs uppercase">Process %</Button>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full h-12 rounded-xl border-2 font-bold uppercase tracking-wider text-[10px]" onClick={() => setStep(2)}>
                      Reconfigure Search
                    </Button>
                  </CardContent>
                </Card>

                <Card className="xl:col-span-3 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" /> Modeling Roster
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" className="rounded-xl font-bold h-10 border-2">
                        <FileDown className="w-4 h-4 mr-2" /> Export Data
                      </Button>
                      <Button className="rounded-xl font-bold uppercase tracking-wider text-[10px] bg-slate-900 text-white h-10 px-6">
                        Commit Review
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {isLoading ? (
                      <div className="p-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">Synchronizing Roster...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2">Emp Info</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Basic</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">DA</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">SPL</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">HRA</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Trans</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">LTA</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Child</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Med</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Edu</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Wash</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Oth</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center text-indigo-600">Gross</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">PF</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">ESI</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center">Bonus</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-center text-right">CTC</TableHead>
                              <TableHead className="font-bold text-[8px] tracking-widest uppercase p-2 text-right">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {employees.map((emp) => {
                              const proposedTotals = calculateTotals(emp.proposed);
                              const hasIncrement = proposedTotals.ctc > 0;
                              const display = hasIncrement ? emp.proposed : emp.current;
                              const displayTotals = calculateTotals(display);
                              
                              return (
                                <TableRow key={emp.empCode} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                  <TableCell className="p-2">
                                    <div className="flex flex-col">
                                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[8px]">{emp.empCode}</span>
                                      <span className="font-bold uppercase text-slate-700 dark:text-slate-200 text-[8px] truncate max-w-[60px]">{emp.name}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.basic).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.da).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.splAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.hra).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.transAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.lta).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.childAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.medAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.eduAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.washAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(display.othAll).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px] font-bold text-indigo-600 dark:text-indigo-400">₹{Math.round(displayTotals.gross).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(displayTotals.pfEmplr).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(displayTotals.esiEmplr).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-center text-[8px]">₹{Math.round(displayTotals.bonus).toLocaleString()}</TableCell>
                                  <TableCell className="p-2 text-right">
                                    <span className={cn("font-bold text-[9px]", hasIncrement ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-50")}>
                                      ₹{Math.round(displayTotals.ctc).toLocaleString()}
                                    </span>
                                  </TableCell>
                                  <TableCell className="p-2 text-right">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="h-6 w-6 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                      onClick={() => setEditingEmployee(emp)}
                                    >
                                      <Edit2 className="w-2.5 h-2.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-none rounded-3xl shadow-2xl bg-white">
            <DialogHeader className="p-8 bg-slate-900 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight">Salary Revision Engine</DialogTitle>
                  <p className="text-slate-400 font-bold mt-1 uppercase text-xs tracking-widest">{editingEmployee?.name} ({editingEmployee?.empCode})</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                  <p className="text-[10px] font-bold uppercase text-slate-300">Revision Delta</p>
                  <p className="text-xl font-bold">
                    {editingEmployee ? (() => {
                      const cur = calculateTotals(editingEmployee.current).ctc;
                      const prop = calculateTotals(editingEmployee.proposed).ctc;
                      if (cur === 0) return prop > 0 ? "100%" : "0.0%";
                      const delta = prop > 0 ? ((prop - cur) / cur * 100).toFixed(1) : "0.0";
                      return `+${delta}%`;
                    })() : "0.0%"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="p-8 grid grid-cols-2 gap-8 bg-white overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Structure</h3>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-bold text-[9px]">READ ONLY</Badge>
                </div>
                <div className="space-y-3">
                  {Object.entries(editingEmployee?.current || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <Label className="text-[9px] font-bold uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <span className="font-bold text-slate-700 text-sm">₹{Math.round(value).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Total Gross</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).gross).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>PF (ER)</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).pfEmplr).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>ESI (ER)</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).esiEmplr).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Bonus</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).bonus).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Gratuity</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).gratuity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-slate-900 uppercase pt-2">
                    <span>Total CTC</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).ctc).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 bg-indigo-50/20 p-6 rounded-3xl border border-indigo-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Proposed Structure</h3>
                  <Badge className="bg-indigo-600 text-white font-bold text-[9px]">MANUAL OVERRIDE</Badge>
                </div>
                <div className="space-y-3">
                  {Object.entries(editingEmployee?.proposed || {}).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-4">
                      <Label className="w-24 text-[9px] font-bold uppercase text-indigo-500">{key.replace(/([A-Z])/g, ' $1')}</Label>
                      <Input 
                        type="number"
                        className="flex-1 h-10 rounded-xl bg-white border-indigo-100 focus:ring-indigo-500 font-bold text-sm"
                        value={value === 0 ? "" : value}
                        placeholder="0"
                        onChange={(e) => {
                          if (!editingEmployee) return;
                          const val = parseFloat(e.target.value) || 0;
                          setEditingEmployee({
                            ...editingEmployee,
                            proposed: { ...editingEmployee.proposed, [key]: val }
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="pt-6 border-t border-indigo-100 space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <span>Proposed Gross</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).gross).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <span>PF (ER)</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).pfEmplr).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <span>ESI (ER)</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).esiEmplr).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <span>Bonus</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).bonus).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-indigo-500 uppercase tracking-wider">
                    <span>Gratuity</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).gratuity).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-indigo-600 uppercase pt-2">
                    <span>Proposed CTC</span>
                    <span>₹{Math.round(calculateTotals(editingEmployee?.proposed || ({} as SalaryComponent)).ctc).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <span>Current CTC</span>
                  <span>₹{calculateTotals(editingEmployee?.current || ({} as SalaryComponent)).ctc.toLocaleString()}</span>
                </div>
                <Progress value={100} className="h-2 bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  <span>Proposed CTC</span>
                  <span>₹{calculateTotals(editingEmployee?.proposed).ctc.toLocaleString()}</span>
                </div>
                <Progress 
                  value={editingEmployee ? (() => {
                    const cur = calculateTotals(editingEmployee.current).ctc;
                    const prop = calculateTotals(editingEmployee.proposed).ctc;
                    if (cur === 0) return prop > 0 ? 100 : 0;
                    return Math.min(100, (prop / cur) * 100);
                  })() : 0} 
                  className="h-2 bg-indigo-100" 
                />
              </div>
            </div>

            <DialogFooter className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingEmployee(null)}
                className="flex-1 h-12 rounded-xl font-bold uppercase tracking-wider border-2"
              >
                Discard
              </Button>
              <Button 
                onClick={() => editingEmployee && handleUpdateSalary(editingEmployee)}
                className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider shadow-lg shadow-indigo-100"
              >
                Commit Revision
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
