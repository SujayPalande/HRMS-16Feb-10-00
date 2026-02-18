import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
    { name: "House Rent Allowance (HRA)", type: "Earning", value: "20%", taxable: false },
    { name: "Dearness Allowance (DA)", type: "Earning", value: "10%", taxable: true },
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
      <div className="space-y-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight" data-testid="text-page-title">Salary Structure (CTC Breakup)</h1>
            <p className="text-slate-500 mt-1 text-lg">Detailed compensation breakdown and statutory compliance calculator</p>
          </div>
        </motion.div>

        <div className="space-y-8">
          <CTCCalculator />

          <Card className="shadow-lg border-2 border-slate-100 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-xl font-bold text-slate-900">Active Salary Components</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 text-xs uppercase text-slate-500 tracking-widest font-bold">
                      <th className="text-left py-4 px-6">Component</th>
                      <th className="text-left py-4 px-6">Type</th>
                      <th className="text-left py-4 px-6">Value</th>
                      <th className="text-left py-4 px-6">Taxable</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-100">
                    {salaryComponents.map((comp, index) => (
                      <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-900">{comp.name}</td>
                        <td className="py-4 px-6">
                          <Badge variant={comp.type === "Earning" ? "default" : "destructive"} className="font-bold px-3 py-1">
                            {comp.type}
                          </Badge>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-700">{comp.value}</td>
                        <td className="py-4 px-6">
                          <Badge variant={comp.taxable ? "secondary" : "outline"} className="font-bold">
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
      </div>
    </AppLayout>
  );
}
