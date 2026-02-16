import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { FileUp, FileDown, Plus, Search, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { type Department } from "@shared/schema";
import * as XLSX from "xlsx";

export default function ImportEmployeeMasterPage() {
  const { toast } = useToast();
  const [selectedUnit, setSelectedUnit] = useState<string>("1");
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [sendInvitation, setSendInvitation] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "DefaultPassword123!",
      role: "employee",
      status: "active",
      employeeId: "",
      departmentId: 1,
      position: "",
      phoneNumber: "",
    },
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create employee");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Success",
        description: "Employee created successfully.",
      });
      setIsManualEntry(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (employees: any[]) => {
      let successCount = 0;
      let errorCount = 0;

      for (const emp of employees) {
        try {
          const res = await apiRequest("POST", "/api/register", {
            ...emp,
            role: emp.role || "employee",
            password: emp.password || "DefaultPassword123!",
            status: "active",
            isActive: true
          });
          if (res.ok) successCount++;
          else {
            const err = await res.json();
            console.error(`Failed to import ${emp.email}:`, err);
            errorCount++;
          }
        } catch (err) {
          console.error("Failed to import employee:", emp.email, err);
          errorCount++;
        }
      }
      return { successCount, errorCount };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Import Finished",
        description: `Successfully imported ${data.successCount} employees. ${data.errorCount} failed.`,
        variant: data.errorCount > 0 ? "destructive" : "default"
      });
      setIsUploading(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name);
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const binaryData = evt.target?.result;
        const workbook = XLSX.read(binaryData, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        console.log("Extracted JSON data:", jsonData);

        if (jsonData.length === 0) {
          throw new Error("The file is empty or formatted incorrectly.");
        }

        const formattedData = jsonData.map((row: any) => {
          const firstName = row.firstName || row['First Name'] || row['firstname'] || "";
          const lastName = row.lastName || row['Last Name'] || row['lastname'] || "";
          const email = row.email || row['Email'] || row['Email ID'] || "";
          const employeeId = String(row.employeeId || row['Employee ID'] || row['Employee Code'] || row['Code'] || "");
          const position = row.position || row['Position'] || row['Designation'] || "";
          const username = row.username || row['Username'] || (email ? email.split('@')[0] : `user_${employeeId}`);

          return {
            firstName,
            lastName,
            email,
            username,
            employeeId,
            position,
            departmentId: parseInt(selectedUnit) || 1
          };
        });

        const validEmployees = formattedData.filter(emp => emp.firstName && emp.email);
        console.log("Valid employees for import:", validEmployees);
        
        if (validEmployees.length === 0) {
          throw new Error("No valid employee records found. Check headers (First Name, Email are required).");
        }

        bulkImportMutation.mutate(validEmployees);
      } catch (err: any) {
        console.error("Import error details:", err);
        toast({
          title: "Import Error",
          description: err.message,
          variant: "destructive",
        });
        setIsUploading(false);
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      toast({ title: "Read Error", description: "Failed to read file.", variant: "destructive" });
      setIsUploading(false);
    };
    reader.readAsBinaryString(file);
  };

  const downloadTemplate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Downloading template...");
    try {
      const templateData = [
        {
          "Employee ID": "EMP001",
          "First Name": "John",
          "Last Name": "Doe",
          "Email": "john.doe@company.com",
          "Designation": "Software Engineer",
          "Username": "johndoe"
        },
        {
          "Employee ID": "EMP002",
          "First Name": "Jane",
          "Last Name": "Smith",
          "Email": "jane.smith@company.com",
          "Designation": "HR Manager",
          "Username": "janesmith"
        }
      ];
      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Template");
      XLSX.writeFile(wb, "HR_Employee_Import_Template.xlsx");
      console.log("Template download triggered successfully");
    } catch (err) {
      console.error("Template download error:", err);
      toast({ title: "Error", description: "Failed to generate template", variant: "destructive" });
    }
  };

  const onSubmit = (data: InsertUser) => {
    if (!data.username) {
      data.username = data.email.split('@')[0];
    }
    createEmployeeMutation.mutate(data);
  };

  const units = departments.length > 0 
    ? departments.map(d => ({ id: String(d.id), name: `${d.name} (${d.id})` }))
    : [
        { id: "1", name: "Human Resources (1)" },
        { id: "2", name: "Engineering (2)" },
        { id: "096", name: "CYBAEM TECH (096)" },
      ];

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#f8fafc]">
        {/* Navigation Toolbar */}
        <div className="bg-[#0078d4] h-12 flex items-center px-4 justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex bg-white/10 rounded-sm p-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={() => setIsManualEntry(true)}><Plus className="h-4 w-4"/></Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20"><Search className="h-4 w-4"/></Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => fileInputRef.current?.click()}
              >
                <FileUp className="h-4 w-4"/>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-white/20" onClick={downloadTemplate}><FileDown className="h-4 w-4"/></Button>
            </div>
            <div className="h-6 w-[1px] bg-white/20 mx-1"></div>
            <div className="flex gap-1">
               <Input placeholder="Search ByName" className="h-7 w-32 bg-white text-[10px] rounded-none border-none placeholder:text-slate-400" />
               <Button className="h-7 bg-[#004e8c] text-white text-[10px] rounded-none px-2 hover:bg-[#003d6e]">Search</Button>
            </div>
          </div>
          <div className="bg-white px-2 py-0.5 rounded-sm">
            <span className="text-[#0078d4] font-black text-sm italic tracking-tighter">GNAT</span>
          </div>
        </div>

        {/* Page Header */}
        <div className="bg-black text-white h-8 flex items-center px-4 shrink-0">
          <h1 className="text-xs font-bold uppercase tracking-widest">Import Employee Master</h1>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          <Card className="border rounded-none shadow-sm bg-white">
            <CardContent className="p-0">
              <div className="flex items-center gap-4 bg-[#f1f1f1] border-b p-3">
                <Label className="text-[11px] font-bold text-slate-700 min-w-[120px]">Units/Departments</Label>
                <div className="flex flex-1 gap-2">
                  <Select onValueChange={setSelectedUnit} value={selectedUnit}>
                    <SelectTrigger className="h-8 rounded-none border-slate-300 bg-white text-[11px] w-full max-w-md">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button className="h-8 bg-[#e1e1e1] hover:bg-[#d1d1d1] text-black text-[11px] rounded-none px-6 border border-slate-300 font-medium">Select</Button>
                </div>
                <Button 
                  onClick={() => setIsManualEntry(!isManualEntry)}
                  className="h-8 bg-[#0078d4] text-white text-[11px] rounded-none px-4 hover:bg-[#005a9e] font-bold"
                >
                  {isManualEntry ? "Cancel Entry" : "Add New Employee"}
                </Button>
              </div>

              <AnimatePresence mode="wait">
                {isManualEntry ? (
                  <motion.div 
                    key="manual-entry"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-6 border-t bg-white"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-black uppercase border-l-4 border-[#0078d4] pl-3">Manual Provisioning</h3>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 border">
                        <Checkbox 
                          id="invite" 
                          checked={sendInvitation} 
                          onCheckedChange={(checked) => setSendInvitation(!!checked)}
                        />
                        <label htmlFor="invite" className="text-[10px] font-bold uppercase tracking-tight cursor-pointer">Dispatch Email Invitation</label>
                      </div>
                    </div>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Employee Code</Label>
                                <FormControl><Input {...field} value={field.value ?? ""} className="h-8 rounded-none border-slate-200 text-xs" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[10px] font-bold uppercase text-slate-500">First Name</Label>
                                <FormControl><Input {...field} className="h-8 rounded-none border-slate-200 text-xs" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Last Name</Label>
                                <FormControl><Input {...field} className="h-8 rounded-none border-slate-200 text-xs" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <Label className="text-[10px] font-bold uppercase text-slate-500">Official Email</Label>
                                <FormControl><Input {...field} type="email" className="h-8 rounded-none border-slate-200 text-xs" /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex gap-2 justify-end pt-4">
                          <Button type="submit" disabled={createEmployeeMutation.isPending} className="h-9 bg-[#0078d4] text-white text-[11px] rounded-none px-6 font-bold shadow-sm">
                            {createEmployeeMutation.isPending ? "Saving..." : "Save Identity"}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setIsManualEntry(false)} className="h-9 rounded-none border-slate-300 text-[11px] px-6">Abort</Button>
                        </div>
                      </form>
                    </Form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="import-interface"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 flex flex-col items-center justify-center min-h-[400px]"
                  >
                    <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex items-center justify-center mb-6">
                      {isUploading ? <Loader2 className="w-8 h-8 text-[#0078d4] animate-spin" /> : <FileUp className="w-8 h-8 text-slate-300" />}
                    </div>
                    <h3 className="text-sm font-bold text-slate-600 mb-2 uppercase tracking-widest">
                      {isUploading ? "Executing Data Ingest..." : "Select Import Source"}
                    </h3>
                    <p className="text-[11px] text-slate-400 text-center max-w-sm mb-8 leading-relaxed">
                      CSV/XLSX structure must strictly follow the defined header protocol. 
                      System will automatically provision accounts for new records.
                    </p>
                    
                    <input 
                      type="file" 
                      id="bulk-employee-input"
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      data-testid="input-bulk-employee"
                    />

                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        className="h-9 rounded-none border-slate-300 text-[11px] px-8 hover:bg-slate-50 font-medium"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('bulk-employee-input')?.click();
                        }}
                        disabled={isUploading}
                        data-testid="button-browse-files"
                      >
                        Browse Files
                      </Button>
                      <Button 
                        className="h-9 bg-[#0078d4] text-white text-[11px] rounded-none px-10 hover:bg-[#005a9e] font-bold shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          document.getElementById('bulk-employee-input')?.click();
                        }}
                        disabled={isUploading}
                        data-testid="button-upload-sync"
                      >
                        Upload & Sync
                      </Button>
                    </div>

                    <div className="mt-12 flex items-center gap-6">
                       <Button 
                        variant="link" 
                        onClick={downloadTemplate} 
                        className="text-[10px] text-[#0078d4] h-auto p-0 font-bold flex items-center gap-1 hover:no-underline"
                        data-testid="button-download-template"
                       >
                          <FileDown className="h-3 w-3" /> Download Template Protocol
                       </Button>
                       <div className="h-3 w-[1px] bg-slate-200"></div>
                       <div className="flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">System Ready for Ingest</span>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
