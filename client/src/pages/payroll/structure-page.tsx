import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Settings, Save, IndianRupee, Percent, Building2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SalaryStructurePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/system"],
  });

  const [basicPercent, setBasicPercent] = useState(50);
  const [hraPercent, setHraPercent] = useState(50);
  const [epfPercent, setEpfPercent] = useState(12);
  const [esicPercent, setEsicPercent] = useState(0.75);
  const [professionalTax, setProfessionalTax] = useState(200);

  useEffect(() => {
    if (systemSettings?.salaryComponents) {
      setBasicPercent(systemSettings.salaryComponents.basicSalaryPercentage);
      setHraPercent(systemSettings.salaryComponents.hraPercentage);
      setEpfPercent(systemSettings.salaryComponents.epfPercentage);
      setEsicPercent(systemSettings.salaryComponents.esicPercentage);
      setProfessionalTax(systemSettings.salaryComponents.professionalTax);
    }
  }, [systemSettings]);

  const updateSalaryComponentsMutation = useMutation({
    mutationFn: async (data: any) => {
      const updatedSettings = {
        ...(systemSettings ?? {}),
        salaryComponents: data
      };
      return await apiRequest("PUT", "/api/settings/system", updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "Success",
        description: "Salary structure updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update salary structure",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateSalaryComponentsMutation.mutate({
      basicSalaryPercentage: basicPercent,
      hraPercentage: hraPercent,
      epfPercentage: epfPercent,
      esicPercentage: esicPercent,
      professionalTax: professionalTax
    });
  };

  const salaryComponents = [
    { name: "Basic Salary", type: "Earning", value: `${basicPercent}%`, taxable: true },
    { name: "HRA", type: "Earning", value: `${hraPercent}%`, taxable: false },
    { name: "Dearness Allowance", type: "Earning", value: "10%", taxable: true },
    { name: "PF (Employee)", type: "Deduction", value: `${epfPercent}%`, taxable: false },
    { name: "ESIC", type: "Deduction", value: `${esicPercent}%`, taxable: false },
    { name: "Professional Tax", type: "Deduction", value: `₹${professionalTax}`, taxable: false },
  ];

  if (isLoadingSettings) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </AppLayout>
    );
  }

  const sampleCTC = 1000000;
  const gross = (sampleCTC / 30) * 25;
  const basic = gross * (basicPercent / 100);
  const hra = basic * (hraPercent / 100);
  const pf = basic * (epfPercent / 100);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Salary Structure (CTC Breakup)</h1>
            <p className="text-slate-500 mt-1">Configure global salary component percentages</p>
          </div>
          <Button 
            className="gap-2" 
            onClick={handleSave}
            disabled={updateSalaryComponentsMutation.isPending}
            data-testid="button-save-structure"
          >
            {updateSalaryComponentsMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-teal-600" />
                Configuration
              </CardTitle>
              <CardDescription>Adjust component percentages (Gross based)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm">Basic Salary (% of Gross)</label>
                  <Badge variant="secondary">{basicPercent}%</Badge>
                </div>
                <Slider
                  value={[basicPercent]}
                  onValueChange={([v]) => setBasicPercent(v)}
                  max={70}
                  min={30}
                  step={1}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-medium text-sm">HRA (% of Basic)</label>
                  <Badge variant="secondary">{hraPercent}%</Badge>
                </div>
                <Slider
                  value={[hraPercent]}
                  onValueChange={([v]) => setHraPercent(v)}
                  max={50}
                  min={0}
                  step={1}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">PF % (Basic)</label>
                  <Input 
                    type="number" 
                    value={epfPercent} 
                    onChange={(e) => setEpfPercent(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">ESIC % (Gross)</label>
                  <Input 
                    type="number" 
                    value={esicPercent} 
                    onChange={(e) => setEsicPercent(parseFloat(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PT (Fixed)</label>
                  <Input 
                    type="number" 
                    value={professionalTax} 
                    onChange={(e) => setProfessionalTax(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5 text-teal-600" />
                Sample Calculation
              </CardTitle>
              <CardDescription>Monthly CTC: ₹{(sampleCTC/12).toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between p-2 bg-slate-50 rounded">
                <span>Gross (25 days)</span>
                <span className="font-medium">₹{Math.round(gross).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50/50 rounded">
                <span>Basic</span>
                <span className="font-medium">₹{Math.round(basic).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-green-50/50 rounded">
                <span>HRA</span>
                <span className="font-medium">₹{Math.round(hra).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50/50 rounded">
                <span>PF Contribution</span>
                <span className="font-medium text-red-600">-₹{Math.round(pf).toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-red-50/50 rounded">
                <span>PT</span>
                <span className="font-medium text-red-600">-₹{professionalTax}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-teal-700">
                <span>Net Payable</span>
                <span>₹{Math.round(gross - pf - professionalTax).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Active Components</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-xs uppercase text-slate-500 tracking-wider">
                    <th className="text-left py-3 px-4 font-medium">Component</th>
                    <th className="text-left py-3 px-4 font-medium">Type</th>
                    <th className="text-left py-3 px-4 font-medium">Value</th>
                    <th className="text-left py-3 px-4 font-medium">Taxable</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {salaryComponents.map((comp, index) => (
                    <tr key={index} className="border-b hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-medium">{comp.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant={comp.type === "Earning" ? "default" : "destructive"} className="text-[10px] h-5">
                          {comp.type}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{comp.value}</td>
                      <td className="py-3 px-4">
                        <Badge variant={comp.taxable ? "secondary" : "outline"} className="text-[10px] h-5">
                          {comp.taxable ? "Yes" : "No"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
