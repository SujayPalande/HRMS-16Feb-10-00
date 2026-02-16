import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Calculator, Filter, Search, Edit2, CheckCircle2, AlertCircle, FileDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";

export default function EmployeeDeductionsPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("096");
  const [searchQuery, setSearchQuery] = useState("");

  const units = [
    { id: "0115", name: "123456" },
    { id: "006", name: "AR ENTERPRISES" },
    { id: "093", name: "ABHIARCH CAREER PRIVATE LIMITED" },
    { id: "043", name: "ASN HR CONSULTANCY & SERVICES" },
    { id: "096", name: "CYBAEM TECH" },
  ];

  const deductions = [
    { code: "6283", name: "ABHIJEET PRATAP PATIL", salaryAdv: 0, cantDed: 0, incomeTax: 0, uniform: 0, bankDed: 0, other: 0 },
    { code: "4905", name: "ABHISHEK VIVEKRAO PANDE", salaryAdv: 0, cantDed: 0, incomeTax: 0, uniform: 0, bankDed: 0, other: 0 },
    { code: "4899", name: "AJAY RAJENDRA SURYAVANSHI", salaryAdv: 500, cantDed: 0, incomeTax: 200, uniform: 0, bankDed: 0, other: 0 },
    { code: "4908", name: "AKANKSHA SANKET LOLAGE", salaryAdv: 0, cantDed: 0, incomeTax: 0, uniform: 0, bankDed: 0, other: 0 },
    { code: "6521", name: "AMIT SHANTARAM KERE", salaryAdv: 0, cantDed: 0, incomeTax: 0, uniform: 0, bankDed: 0, other: 0 },
    { code: "4864", name: "ANIKET DILIPRAO BIJWE", salaryAdv: 0, cantDed: 0, incomeTax: 150, uniform: 0, bankDed: 0, other: 0 },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-900 -mx-6 -mt-6 px-8 pt-8 pb-10 mb-8 border-b border-red-700 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-extrabold text-white tracking-tight"
              >
                Employee Deductions
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-red-100 mt-2 text-lg"
              >
                Advanced payroll adjustment and deduction management console
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl"
            >
              <IndianRupee className="w-10 h-10 text-red-300" />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-1 space-y-6">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Filter className="w-5 h-5 text-red-600" />
                  Units / Departments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-1">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      onClick={() => setSelectedUnit(unit.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                        selectedUnit === unit.id
                          ? "bg-red-600 text-white shadow-lg"
                          : "hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <span className="text-sm font-semibold">{unit.name}</span>
                      <Badge variant={selectedUnit === unit.id ? "secondary" : "outline"} className="font-mono text-[10px]">
                        {unit.id}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-1 gap-4">
              <Card className="bg-emerald-600 text-white border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Active Status</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">94%</h4>
                  <p className="text-emerald-100 text-xs">Payroll deductions processed</p>
                </CardContent>
              </Card>

              <Card className="bg-red-600 text-white border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">Pending</span>
                  </div>
                  <h4 className="text-3xl font-bold mb-1">12</h4>
                  <p className="text-red-100 text-xs">Awaiting HR approval</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="xl:col-span-3">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <Calculator className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    Monthly Payroll Deductions
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="Search employee..." 
                        className="pl-10 h-10 rounded-xl border-slate-200"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                      <FileDown className="w-4 h-4" />
                    </Button>
                    <Button className="rounded-xl h-10 bg-red-600 hover:bg-red-700 font-bold">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Deduction
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-800/30">
                      <TableRow className="border-b border-slate-100 dark:border-slate-800">
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">EmpCode</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6">Name</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">Salary Adv</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">Cant Ded</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">ITax</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">Uniform</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">Bank</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-right">Other</TableHead>
                        <TableHead className="font-bold text-slate-700 dark:text-slate-300 py-4 px-6 text-center">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deductions.map((item, idx) => (
                        <TableRow 
                          key={item.code} 
                          className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}
                        >
                          <TableCell className="py-4 px-6 font-mono text-sm font-semibold text-slate-600 dark:text-slate-400">{item.code}</TableCell>
                          <TableCell className="py-4 px-6 font-bold text-slate-800 dark:text-slate-200">{item.name}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.salaryAdv}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.cantDed}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.incomeTax}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.uniform}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.bankDed}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{item.other}</TableCell>
                          <TableCell className="py-4 px-6 text-center">
                            <Button variant="ghost" size="icon" className="rounded-lg hover:bg-red-100 hover:text-red-600">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-8">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Records: {deductions.length}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold">Previous</Button>
                    <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs font-bold">Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
