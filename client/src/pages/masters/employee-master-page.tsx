import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserSearch, Filter, Search, Plus, ListFilter, Download, LayoutGrid, Table as TableIcon, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmployeeMasterPage() {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [selectedBranch, setSelectedBranch] = useState<string>("043");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "employee",
      status: "active",
      employmentType: "permanent",
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      incomeTaxApplicable: false,
      lwfApplicable: false,
      overtimeApplicable: false,
      bonusApplicable: false,
    }
  });

  const onSubmit = async (data: InsertUser) => {
    try {
      await apiRequest("POST", "/api/register", data);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Employee created successfully" });
      setIsDialogOpen(false);
      form.reset();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create employee",
        variant: "destructive"
      });
    }
  };

  const branches = [
    { id: "043", name: "ASN HR CONSULTANCY" },
    { id: "0115", name: "123456" },
    { id: "006", name: "AR ENTERPRISES" },
    { id: "096", name: "CYBAEM TECH" },
  ];

  const employees = [
    { id: "4864", name: "ANIKET DILIPRAO BIJWE", esi: "0", uan: "101669352736", dob: "02/02/1997", doj: "09/02/2022", status: "Active" },
    { id: "4898", name: "SHAILESH BALARAM MUNDHE", esi: "3313681353", uan: "101215221154", dob: "02/02/1995", doj: "08/03/2022", status: "Active" },
    { id: "4899", name: "AJAY RAJENDRA SURYAVANSHI", esi: "3312165558", uan: "101376644929", dob: "01/01/1996", doj: "10/05/2022", status: "Active" },
    { id: "4900", name: "VISHAL TATYASAHEB YADAV", esi: "3314755205", uan: "101907783944", dob: "13/01/2000", doj: "08/01/2023", status: "Active" },
    { id: "4901", name: "SHUBHAM SOMNATH SAWANT", esi: "0", uan: "101235027409", dob: "28/12/1997", doj: "10/02/2023", status: "Active" },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-900 -mx-6 -mt-6 px-8 pt-8 pb-12 mb-8 border-b border-blue-700 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <motion.h1 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-4xl font-black text-white tracking-tight uppercase"
              >
                Employee Master
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="text-blue-200 mt-2 text-lg font-medium"
              >
                Central Executive Database & Workforce Repository
              </motion.p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl h-12 bg-white text-blue-900 hover:bg-blue-50 font-black shadow-lg shadow-white/10">
                    <Plus className="w-5 h-5 mr-2" />
                    New Employee
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Executive Onboarding</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="pr-4 h-[70vh]">
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Email Address</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Username</FormLabel>
                                <FormControl>
                                  <Input {...field} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Password</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" title="Set a secure password" placeholder="••••••••" className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Employee ID</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} className="rounded-xl" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="salary"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Monthly CTC (INR)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    className="rounded-xl" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    value={field.value || ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="employmentType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Employment Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || 'permanent'}>
                                  <FormControl>
                                    <SelectTrigger className="rounded-xl">
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="permanent">Permanent</SelectItem>
                                    <SelectItem value="contract">Contract</SelectItem>
                                    <SelectItem value="consultant">Consultant</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="border-t pt-6">
                          <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-4">Statutory & Compliance</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="uanNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">UAN Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} className="rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="esicNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">ESIC Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} className="rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="panCard"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">PAN Card</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} className="rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {[
                              { name: 'pfApplicable', label: 'PF' },
                              { name: 'esicApplicable', label: 'ESIC' },
                              { name: 'ptApplicable', label: 'PT' },
                              { name: 'lwfApplicable', label: 'LWF' },
                              { name: 'incomeTaxApplicable', label: 'TDS/IT' },
                              { name: 'overtimeApplicable', label: 'OT' },
                              { name: 'bonusApplicable', label: 'Bonus' },
                            ].map((item) => (
                              <FormField
                                key={item.name}
                                control={form.control}
                                name={item.name as any}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-xl border p-4 bg-slate-50/50">
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                        checked={field.value}
                                        onChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {item.label}
                                      </FormLabel>
                                    </div>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="border-t pt-6">
                          <h4 className="text-sm font-black uppercase tracking-widest text-blue-600 mb-4">Banking Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="bankName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Bank Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} className="rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="bankAccountNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500">Account Number</FormLabel>
                                  <FormControl>
                                    <Input {...field} value={field.value || ''} className="rounded-xl" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest">
                          Onboard Employee
                        </Button>
                      </form>
                    </Form>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="rounded-xl h-12 border-blue-400 text-white hover:bg-white/10 font-bold backdrop-blur-sm">
                <Download className="w-5 h-5 mr-2" />
                Export Data
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 -mt-12 relative z-20 mb-8 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-1">
                <div className="flex-1 max-w-sm">
                  <Label className="text-xs font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Search Directory</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input placeholder="Employee name or code..." className="pl-10 h-11 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800/50" />
                  </div>
                </div>
                <div className="w-full md:w-64">
                  <Label className="text-xs font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Executive Branch</Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Label className="text-xs font-black text-slate-400 uppercase mb-1.5 block tracking-widest">Status Filter</Label>
                  <Select defaultValue="active">
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-800/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active Members</SelectItem>
                      <SelectItem value="inactive">Resigned</SelectItem>
                      <SelectItem value="invited">Pending Join</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 border-l border-slate-100 dark:border-slate-800 pl-6 h-12 mt-4 lg:mt-0">
                <Button 
                  variant={viewMode === "grid" ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setViewMode("grid")}
                  className={`rounded-xl h-11 w-11 ${viewMode === "grid" ? "bg-blue-600 shadow-blue-500/20" : "border-slate-200"}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </Button>
                <Button 
                  variant={viewMode === "table" ? "default" : "outline"} 
                  size="icon" 
                  onClick={() => setViewMode("table")}
                  className={`rounded-xl h-11 w-11 ${viewMode === "table" ? "bg-blue-600 shadow-blue-500/20" : "border-slate-200"}`}
                >
                  <TableIcon className="w-5 h-5" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-xl h-11 w-11 border-slate-200">
                  <ListFilter className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {viewMode === "table" ? (
          <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/30">
                    <TableRow className="border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-8">Member</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">Emp Code</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">ESI No.</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">UAN No.</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">DOB</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">Join Date</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6">Status</TableHead>
                      <TableHead className="font-black text-slate-400 uppercase text-[10px] tracking-widest py-5 px-6 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((emp, idx) => (
                      <TableRow key={emp.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all duration-200">
                        <TableCell className="py-4 px-8">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-md">
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold">{emp.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{emp.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">{emp.id}</TableCell>
                        <TableCell className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{emp.esi === "0" ? "N/A" : emp.esi}</TableCell>
                        <TableCell className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{emp.uan}</TableCell>
                        <TableCell className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{emp.dob}</TableCell>
                        <TableCell className="py-4 px-6 font-medium text-slate-600 dark:text-slate-400">{emp.doj}</TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none rounded-lg px-3 py-1 font-bold">
                            {emp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100">
                                <MoreHorizontal className="w-5 h-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-2xl p-2 w-48">
                              <DropdownMenuItem className="rounded-lg font-bold gap-3 py-3 cursor-pointer">
                                <Edit className="w-4 h-4 text-blue-600" /> Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg font-bold gap-3 py-3 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                                <Trash2 className="w-4 h-4" /> Deactivate
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <motion.div
                key={emp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
              >
                <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <div className="h-2 bg-blue-600" />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-6">
                      <Avatar className="h-16 w-16 border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-110 transition-transform duration-300">
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white text-xl font-black">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-black text-slate-800 dark:text-white leading-tight mb-1">{emp.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px] font-black">{emp.id}</Badge>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-none text-[10px] font-black px-2 py-0">ACTIVE</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">UAN Number</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{emp.uan}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">Date of Joining</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{emp.doj}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">ESI Number</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{emp.esi === "0" ? "NONE" : emp.esi}</span>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex gap-2">
                      <Button className="flex-1 rounded-xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border-none h-11">
                        View Details
                      </Button>
                      <Button size="icon" variant="outline" className="rounded-xl h-11 w-11 border-slate-200 hover:bg-blue-50 hover:text-blue-600">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
        
        <div className="mt-8 flex justify-center">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-2 flex items-center gap-1 border border-slate-100 dark:border-slate-800">
            <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 font-bold text-slate-500">First</Button>
            <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 font-bold bg-blue-600 text-white shadow-lg shadow-blue-500/20">1</Button>
            <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 font-bold hover:bg-slate-100">2</Button>
            <Button variant="ghost" size="sm" className="rounded-xl h-9 w-9 font-bold hover:bg-slate-100">3</Button>
            <Button variant="ghost" size="sm" className="rounded-xl h-9 px-4 font-bold text-slate-500">Last</Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
