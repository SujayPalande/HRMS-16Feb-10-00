import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CTCCalculator } from "@/components/payroll/ctc-calculator";

export default function SalaryStructurePage() {
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/system"],
  });

  const [basicPercent, setBasicPercent] = useState(50);
  const [hraPercent, setHraPercent] = useState(50);
  const [epfPercent, setEpfPercent] = useState(12);
  const [esicPercent, setEsicPercent] = useState(0.75);
  const [professionalTax, setProfessionalTax] = useState(200);

  useEffect(() => {
    const settings = systemSettings as any;
    if (settings?.salaryComponents) {
      setBasicPercent(settings.salaryComponents.basicSalaryPercentage);
      setHraPercent(settings.salaryComponents.hraPercentage);
      setEpfPercent(settings.salaryComponents.epfPercentage);
      setEsicPercent(settings.salaryComponents.esicPercentage);
      setProfessionalTax(settings.salaryComponents.professionalTax);
    }
  }, [systemSettings]);

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
            <p className="text-slate-500 mt-1">Manage global salary structure and use the CTC calculator</p>
          </div>
        </motion.div>

        <Tabs defaultValue="calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="calculator">CTC Calculator</TabsTrigger>
            <TabsTrigger value="active-components">Active Components</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="space-y-6 mt-6">
            <CTCCalculator />
          </TabsContent>

          <TabsContent value="active-components" className="mt-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
