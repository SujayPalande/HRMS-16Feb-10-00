import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileUp, FileDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function EmpDataUploadPage() {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  const units = [
    { id: "0115", name: "123456" },
    { id: "006", name: "AR ENTERPRISES" },
    { id: "093", name: "ABHIARCH CAREER PRIVATE LIMITED" },
    { id: "043", name: "ASN HR CONSULTANCY & SERVICES" },
    { id: "031", name: "BHAIRAV INFRASTRUCTURE" },
    { id: "0124", name: "CONSTRIX PRIVATE LIMITED" },
    { id: "096", name: "CYBAEM TECH" },
  ];

  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!selectedUnit) {
      toast({
        title: "Selection Required",
        description: "Please select a Unit/Department before uploading.",
        variant: "destructive",
      });
      return;
    }
    if (!file) {
      toast({
        title: "File Required",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("departmentId", selectedUnit);

      const response = await fetch("/api/employees/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      toast({
        title: "Upload Successful",
        description: "Employee data has been processed successfully.",
      });
      setFile(null);
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["employeeId", "username", "email", "firstName", "lastName", "role", "position", "salary"];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_template.csv";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 -mx-6 -mt-6 px-8 pt-8 pb-10 mb-8 border-b border-slate-700 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-4xl font-extrabold text-white tracking-tight"
              >
                EmpData Upload
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-slate-300 mt-2 text-lg"
              >
                Executive bulk processing system for employee information
              </motion.p>
            </div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-xl"
            >
              <Upload className="w-10 h-10 text-blue-400" />
            </motion.div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Units/Departments</Label>
                  <div className="border rounded-xl p-2 bg-slate-50 dark:bg-slate-800/50 max-h-60 overflow-y-auto custom-scrollbar">
                    {units.map((unit) => (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(unit.id)}
                        className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                          selectedUnit === unit.id
                            ? "bg-blue-600 text-white shadow-md transform scale-[1.02]"
                            : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="text-sm font-medium">{unit.name} ({unit.id})</span>
                        {selectedUnit === unit.id && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Target Head</Label>
                  <Select defaultValue="empdata">
                    <SelectTrigger className="rounded-xl h-11 border-slate-200 focus:ring-blue-500">
                      <SelectValue placeholder="Select heading" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="empdata">Employee Data</SelectItem>
                      <SelectItem value="personal">Personal Details</SelectItem>
                      <SelectItem value="bank">Bank Information</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-blue-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <AlertCircle className="w-32 h-32" />
              </div>
              <CardContent className="p-6 relative z-10">
                <h3 className="text-lg font-bold mb-2">Pro Tip</h3>
                <p className="text-blue-100 text-sm leading-relaxed mb-4">
                  Ensure your CSV file follows the standard template format to avoid processing errors.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full rounded-xl font-bold bg-white text-blue-600 hover:bg-blue-50"
                  onClick={downloadTemplate}
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 h-full overflow-hidden flex flex-col">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                <CardTitle className="text-xl font-bold flex items-center gap-3 text-slate-800 dark:text-white">
                  <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg">
                    <Upload className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  </div>
                  Upload Interface
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-12 bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-full shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <FileUp className="w-12 h-12 text-blue-600" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Drop your files here</h4>
                  <p className="text-slate-500 text-center max-w-xs mb-8">
                    Support for .csv and .xlsx files. Maximum file size is 10MB.
                  </p>
                  <div className="flex gap-4">
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="file-upload" 
                      accept=".csv,.xlsx" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <Button 
                      asChild
                      variant="outline" 
                      className="rounded-xl px-8 h-12 font-semibold border-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <label htmlFor="file-upload" className="cursor-pointer">
                        {file ? file.name : "Browse Files"}
                      </label>
                    </Button>
                    <Button 
                      onClick={handleUpload}
                      disabled={uploading}
                      className="rounded-xl px-8 h-12 font-bold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                    >
                      {uploading ? "Processing..." : "Upload & Sync"}
                    </Button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      System Ready
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Selected Unit</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {selectedUnit ? units.find(u => u.id === selectedUnit)?.name : "None Selected"}
                    </span>
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
