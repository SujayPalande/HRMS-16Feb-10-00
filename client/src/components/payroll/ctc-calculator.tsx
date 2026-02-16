import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calculator, Download, RotateCcw, Info, TrendingUp, TrendingDown, IndianRupee, Settings2, Building2, Shield, Landmark, Users } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

export function CTCCalculator() {
  const [ctc, setCtc] = React.useState<number>(50000);
  const [isYearly, setIsYearly] = React.useState(false);
  const [taxRegime, setTaxRegime] = React.useState<"old" | "new">("new");
  const [activeStatutoryTab, setActiveStatutoryTab] = React.useState("esic");
  
  // Percentages (Default values)
  const [percentages, setPercentages] = React.useState({
    basic: 40,
    hra: 20,
    da: 10,
    lta: 5,
    special: 15,
    performance: 10,
  });

  const [options, setOptions] = React.useState({
    epf: true,
    profTax: true,
    esi: true,
    mlwf: true,
    metroCity: true,
  });

  // Manual override values for statutory components
  const [manualOverrides, setManualOverrides] = React.useState({
    esicEmployee: null as number | null,
    esicEmployer: null as number | null,
    pfEmployee: null as number | null,
    pfEmployer: null as number | null,
    profTax: null as number | null,
    mlwfEmployee: null as number | null,
    mlwfEmployer: null as number | null,
  });

  // MLWF is half-yearly (June & December)
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isMlwfMonth = currentMonth === 6 || currentMonth === 12; // June or December

  const monthlyCTC = isYearly ? ctc / 12 : ctc;
  const annualCTC = isYearly ? ctc : ctc * 12;

  // Calculations
  const grossSalary = monthlyCTC;
  const basic = (grossSalary * percentages.basic) / 100;
  const hra = (grossSalary * percentages.hra) / 100;
  const da = (grossSalary * percentages.da) / 100;
  const lta = (grossSalary * percentages.lta) / 100;
  const performance = (grossSalary * percentages.performance) / 100;
  const specialAllowance = grossSalary - (basic + hra + da + lta + performance);

  // ESIC - applicable if gross <= 21000
  const isEsicApplicable = options.esi && grossSalary <= 21000;
  const esicEmployeeRate = 0.75; // 0.75%
  const esicEmployerRate = 3.25; // 3.25%
  const esicEmployeeCalc = isEsicApplicable ? Math.round(grossSalary * (esicEmployeeRate / 100)) : 0;
  const esicEmployerCalc = isEsicApplicable ? Math.round(grossSalary * (esicEmployerRate / 100)) : 0;
  
  // Use manual override if set, otherwise use calculated value
  const esicEmployee = manualOverrides.esicEmployee !== null ? manualOverrides.esicEmployee : esicEmployeeCalc;
  const esicEmployer = manualOverrides.esicEmployer !== null ? manualOverrides.esicEmployer : esicEmployerCalc;

  // PF - 12% of basic, capped at 15000 basic
  const pfBasicCap = 15000;
  const pfRate = 12; // 12%
  const pfEmployerAdditional = 1; // 1% additional employer contribution
  const pfEmployeeCalc = options.epf ? Math.round(Math.min(basic, pfBasicCap) * (pfRate / 100)) : 0;
  const pfEmployerCalc = options.epf ? Math.round(Math.min(basic, pfBasicCap) * ((pfRate + pfEmployerAdditional) / 100)) : 0;
  
  const pfEmployee = manualOverrides.pfEmployee !== null ? manualOverrides.pfEmployee : pfEmployeeCalc;
  const pfEmployer = manualOverrides.pfEmployer !== null ? manualOverrides.pfEmployer : pfEmployerCalc;

  // Professional Tax
  const profTaxCalc = options.profTax ? 200 : 0;
  const profTax = manualOverrides.profTax !== null ? manualOverrides.profTax : profTaxCalc;

  // MLWF - Half yearly (June & December) - 25 employee, 75 employer
  const mlwfEmployeeRate = 25;
  const mlwfEmployerRate = 75;
  const mlwfEmployeeCalc = options.mlwf && isMlwfMonth ? mlwfEmployeeRate : 0;
  const mlwfEmployerCalc = options.mlwf && isMlwfMonth ? mlwfEmployerRate : 0;
  
  const mlwfEmployee = manualOverrides.mlwfEmployee !== null ? manualOverrides.mlwfEmployee : mlwfEmployeeCalc;
  const mlwfEmployer = manualOverrides.mlwfEmployer !== null ? manualOverrides.mlwfEmployer : mlwfEmployerCalc;

  // Income Tax Calculation
  const calculateIncomeTax = (annualIncome: number, regime: "old" | "new") => {
    if (regime === "new") {
      const stdDed = 75000;
      const taxable = Math.max(0, annualIncome - stdDed);
      if (taxable <= 1200000) return 0;
      let tax = 0;
      if (taxable > 2400000) tax += (taxable - 2400000) * 0.30;
      if (taxable > 2000000) tax += (Math.min(taxable, 2400000) - 2000000) * 0.25;
      if (taxable > 1600000) tax += (Math.min(taxable, 2000000) - 1600000) * 0.20;
      if (taxable > 1200000) tax += (Math.min(taxable, 1600000) - 1200000) * 0.15;
      if (taxable > 800000) tax += (Math.min(taxable, 1200000) - 800000) * 0.10;
      if (taxable > 400000) tax += (Math.min(taxable, 800000) - 400000) * 0.05;
      return tax * 1.04;
    } else {
      const stdDed = 50000;
      const deductions = Math.min(pfEmployee * 12 + 100000, 150000);
      const taxable = Math.max(0, annualIncome - stdDed - deductions);
      if (taxable <= 500000) return 0;
      let tax = 0;
      if (taxable > 1000000) tax += (taxable - 1000000) * 0.30;
      if (taxable > 500000) tax += (Math.min(taxable, 1000000) - 500000) * 0.20;
      if (taxable > 250000) tax += (Math.min(taxable, 500000) - 250000) * 0.05;
      return tax * 1.04;
    }
  };

  const annualIncomeTax = calculateIncomeTax(annualCTC, taxRegime);
  const incomeTax = annualIncomeTax / 12;

  const totalDeductions = esicEmployee + pfEmployee + profTax + mlwfEmployee + incomeTax;
  const netMonthlySalary = monthlyCTC - totalDeductions;

  const handleReset = () => {
    setCtc(50000);
    setPercentages({
      basic: 40,
      hra: 20,
      da: 10,
      lta: 5,
      special: 15,
      performance: 10,
    });
    setManualOverrides({
      esicEmployee: null,
      esicEmployer: null,
      pfEmployee: null,
      pfEmployer: null,
      profTax: null,
      mlwfEmployee: null,
      mlwfEmployer: null,
    });
  };

  const handleManualOverride = (field: keyof typeof manualOverrides, value: string) => {
    const numValue = value === "" ? null : Number(value);
    setManualOverrides(prev => ({ ...prev, [field]: numValue }));
  };

  const resetOverride = (field: keyof typeof manualOverrides) => {
    setManualOverrides(prev => ({ ...prev, [field]: null }));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("CTC Breakdown Report", 14, 15);
    const tableData = [
      ["Component", "Monthly Amount", "Annual Amount"],
      ["Basic Salary", `INR ${basic.toFixed(0)}`, `INR ${(basic * 12).toFixed(0)}`],
      ["HRA", `INR ${hra.toFixed(0)}`, `INR ${(hra * 12).toFixed(0)}`],
      ["DA", `INR ${da.toFixed(0)}`, `INR ${(da * 12).toFixed(0)}`],
      ["LTA", `INR ${lta.toFixed(0)}`, `INR ${(lta * 12).toFixed(0)}`],
      ["Special Allowance", `INR ${specialAllowance.toFixed(0)}`, `INR ${(specialAllowance * 12).toFixed(0)}`],
      ["Performance Bonus", `INR ${performance.toFixed(0)}`, `INR ${(performance * 12).toFixed(0)}`],
      ["Gross Salary", `INR ${grossSalary.toFixed(0)}`, `INR ${(grossSalary * 12).toFixed(0)}`],
      ["ESIC (Employee)", `INR ${esicEmployee.toFixed(0)}`, `INR ${(esicEmployee * 12).toFixed(0)}`],
      ["PF (Employee)", `INR ${pfEmployee.toFixed(0)}`, `INR ${(pfEmployee * 12).toFixed(0)}`],
      ["Professional Tax", `INR ${profTax.toFixed(0)}`, `INR ${(profTax * 12).toFixed(0)}`],
      ["MLWF (Employee)", `INR ${mlwfEmployee.toFixed(0)}`, `INR ${(mlwfEmployee * 2).toFixed(0)} (Half-yearly)`],
      ["Income Tax", `INR ${incomeTax.toFixed(0)}`, `INR ${(incomeTax * 12).toFixed(0)}`],
      ["Net Take Home", `INR ${netMonthlySalary.toFixed(0)}`, `INR ${(netMonthlySalary * 12).toFixed(0)}`],
    ];
    (doc as any).autoTable({
      head: [tableData[0]],
      body: tableData.slice(1),
      startY: 25,
    });
    doc.save("ctc-breakdown.pdf");
  };

  const exportExcel = () => {
    const data = [
      { Component: "Basic Salary", Monthly: basic, Annual: basic * 12 },
      { Component: "HRA", Monthly: hra, Annual: hra * 12 },
      { Component: "DA", Monthly: da, Annual: da * 12 },
      { Component: "LTA", Monthly: lta, Annual: lta * 12 },
      { Component: "Special Allowance", Monthly: specialAllowance, Annual: specialAllowance * 12 },
      { Component: "Performance Bonus", Monthly: performance, Annual: performance * 12 },
      { Component: "Gross Salary", Monthly: grossSalary, Annual: grossSalary * 12 },
      { Component: "ESIC (Employee)", Monthly: esicEmployee, Annual: esicEmployee * 12 },
      { Component: "ESIC (Employer)", Monthly: esicEmployer, Annual: esicEmployer * 12 },
      { Component: "PF (Employee)", Monthly: pfEmployee, Annual: pfEmployee * 12 },
      { Component: "PF (Employer)", Monthly: pfEmployer, Annual: pfEmployer * 12 },
      { Component: "Professional Tax", Monthly: profTax, Annual: profTax * 12 },
      { Component: "MLWF (Employee)", Monthly: mlwfEmployee, Annual: mlwfEmployee * 2 },
      { Component: "MLWF (Employer)", Monthly: mlwfEmployer, Annual: mlwfEmployer * 2 },
      { Component: "Income Tax", Monthly: incomeTax, Annual: incomeTax * 12 },
      { Component: "Net Take Home", Monthly: netMonthlySalary, Annual: netMonthlySalary * 12 },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "CTC Breakdown");
    XLSX.writeFile(wb, "ctc-breakdown.xlsx");
  };

  return (
    <Card className="w-full max-w-6xl mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader className="bg-muted/30 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calculator className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">CTC Calculator</CardTitle>
              <CardDescription>Calculate take-home salary and compensation structure</CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleReset} className="hover-elevate" data-testid="button-reset-calculator">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
        {/* Left Column: Inputs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <Label className="text-base font-semibold">Cost to Company (CTC)</Label>
            <div className="flex flex-col gap-4">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₹</span>
                <Input 
                  type="number" 
                  value={ctc} 
                  onChange={(e) => setCtc(Number(e.target.value))}
                  className="pl-8 h-12 text-lg font-medium"
                  data-testid="input-ctc"
                />
              </div>
              <Tabs 
                value={isYearly ? "yearly" : "monthly"} 
                onValueChange={(v) => setIsYearly(v === "yearly")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 h-10">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Components (%)</Label>
              <Badge variant="secondary" className="font-normal">Total: 100%</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(percentages).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <Label className="capitalize text-xs text-muted-foreground">{key}</Label>
                  <Input 
                    type="number" 
                    value={value} 
                    onChange={(e) => setPercentages(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="h-8 text-sm"
                    data-testid={`input-percent-${key}`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Enable/Disable</Label>
            <div className="space-y-2">
              {[
                { key: "esi", label: "ESIC", desc: "0.75% Employee" },
                { key: "epf", label: "PF", desc: "12% of Basic" },
                { key: "profTax", label: "PT", desc: "₹200/month" },
                { key: "mlwf", label: "MLWF", desc: "₹25 (Half-yearly)" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded-lg border bg-muted/10">
                  <div>
                    <Label className="text-sm font-medium">{item.label}</Label>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={options[item.key as keyof typeof options]} 
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, [item.key]: v }))}
                    data-testid={`switch-${item.key}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column: Statutory Tabs */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-primary" />
              <Label className="text-base font-semibold">Statutory Components (Manual Override)</Label>
            </div>
            
            <Tabs value={activeStatutoryTab} onValueChange={setActiveStatutoryTab} className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="esic" className="text-xs">ESIC</TabsTrigger>
                <TabsTrigger value="pf" className="text-xs">PF</TabsTrigger>
                <TabsTrigger value="pt" className="text-xs">PT</TabsTrigger>
                <TabsTrigger value="mlwf" className="text-xs">MLWF</TabsTrigger>
              </TabsList>

              <TabsContent value="esic" className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-sm">ESIC - Employee State Insurance</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Applicable if Gross ≤ ₹21,000/month. Employee: 0.75%, Employer: 3.25%
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employee (0.75%)</Label>
                        {manualOverrides.esicEmployee !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("esicEmployee")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.esicEmployee ?? esicEmployeeCalc}
                        onChange={(e) => handleManualOverride("esicEmployee", e.target.value)}
                        className="h-8"
                        data-testid="input-esic-employee"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Calculated: ₹{esicEmployeeCalc}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employer (3.25%)</Label>
                        {manualOverrides.esicEmployer !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("esicEmployer")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.esicEmployer ?? esicEmployerCalc}
                        onChange={(e) => handleManualOverride("esicEmployer", e.target.value)}
                        className="h-8"
                        data-testid="input-esic-employer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Calculated: ₹{esicEmployerCalc}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pf" className="space-y-4">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-sm">PF - Provident Fund</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    12% of Basic (capped at ₹15,000). Employer: 12% + 1% Admin
                  </p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employee (12%)</Label>
                        {manualOverrides.pfEmployee !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("pfEmployee")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.pfEmployee ?? pfEmployeeCalc}
                        onChange={(e) => handleManualOverride("pfEmployee", e.target.value)}
                        className="h-8"
                        data-testid="input-pf-employee"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Calculated: ₹{pfEmployeeCalc}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employer (13%)</Label>
                        {manualOverrides.pfEmployer !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("pfEmployer")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.pfEmployer ?? pfEmployerCalc}
                        onChange={(e) => handleManualOverride("pfEmployer", e.target.value)}
                        className="h-8"
                        data-testid="input-pf-employer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Calculated: ₹{pfEmployerCalc}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pt" className="space-y-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-sm">PT - Professional Tax</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    State-specific tax deducted monthly. Default: ₹200/month
                  </p>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-xs">Monthly Amount</Label>
                      {manualOverrides.profTax !== null && (
                        <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("profTax")}>
                          Reset
                        </Button>
                      )}
                    </div>
                    <Input 
                      type="number"
                      value={manualOverrides.profTax ?? profTaxCalc}
                      onChange={(e) => handleManualOverride("profTax", e.target.value)}
                      className="h-8"
                      data-testid="input-prof-tax"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Default: ₹{profTaxCalc}</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="mlwf" className="space-y-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span className="font-medium text-sm">MLWF - Maharashtra Labour Welfare Fund</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Half-yearly contribution (June & December). Employee: ₹25, Employer: ₹75
                  </p>
                  <Badge variant={isMlwfMonth ? "default" : "secondary"} className="mb-3">
                    {isMlwfMonth ? "Current month is MLWF deduction month" : "Not a MLWF deduction month"}
                  </Badge>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employee (₹25)</Label>
                        {manualOverrides.mlwfEmployee !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("mlwfEmployee")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.mlwfEmployee ?? mlwfEmployeeCalc}
                        onChange={(e) => handleManualOverride("mlwfEmployee", e.target.value)}
                        className="h-8"
                        data-testid="input-mlwf-employee"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Default: ₹25 (in June/Dec)</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">Employer (₹75)</Label>
                        {manualOverrides.mlwfEmployer !== null && (
                          <Button variant="ghost" size="sm" className="h-5 px-1 text-xs" onClick={() => resetOverride("mlwfEmployer")}>
                            Reset
                          </Button>
                        )}
                      </div>
                      <Input 
                        type="number"
                        value={manualOverrides.mlwfEmployer ?? mlwfEmployerCalc}
                        onChange={(e) => handleManualOverride("mlwfEmployer", e.target.value)}
                        className="h-8"
                        data-testid="input-mlwf-employer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Default: ₹75 (in June/Dec)</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Right Column: Breakdown */}
        <div className="lg:col-span-4">
          <motion.div 
            layout
            className="rounded-xl border bg-primary/5 p-6 h-full flex flex-col"
          >
            <div className="mb-4">
              <Tabs value={taxRegime} onValueChange={(v: any) => setTaxRegime(v)} className="w-full">
                <TabsList className="grid grid-cols-2">
                  <TabsTrigger value="old">Old Regime</TabsTrigger>
                  <TabsTrigger value="new">New Regime</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-4 flex-1">
              <div className="text-center p-4 rounded-lg bg-background shadow-sm border">
                <p className="text-sm text-muted-foreground mb-1">Net Monthly Take Home</p>
                <h3 className="text-3xl font-bold text-primary">₹ {netMonthlySalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
                <p className="text-xs text-muted-foreground mt-2">Annual: ₹ {(netMonthlySalary * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Earnings
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>Basic</span><span className="font-medium">₹{basic.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>HRA</span><span className="font-medium">₹{hra.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Special</span><span className="font-medium">₹{specialAllowance.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Gross</span><span>₹{grossSalary.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-3 h-3" /> Deductions
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>ESIC</span><span className="text-destructive">-₹{esicEmployee.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>PF</span><span className="text-destructive">-₹{pfEmployee.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>PT</span><span className="text-destructive">-₹{profTax.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>MLWF</span><span className="text-destructive">-₹{mlwfEmployee.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>Tax</span><span className="text-destructive">-₹{incomeTax.toLocaleString()}</span></div>
                  <div className="flex justify-between font-bold border-t pt-1"><span>Total</span><span className="text-destructive">-₹{totalDeductions.toLocaleString()}</span></div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Employer Cost</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span>ESIC (Employer)</span><span>₹{esicEmployer.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>PF (Employer)</span><span>₹{pfEmployer.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span>MLWF (Employer)</span><span>₹{mlwfEmployer.toLocaleString()}</span></div>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button onClick={exportPDF} className="w-full hover-elevate" data-testid="button-export-pdf">
                <Download className="w-4 h-4 mr-2" /> PDF
              </Button>
              <Button variant="outline" onClick={exportExcel} className="w-full hover-elevate" data-testid="button-export-excel">
                <Download className="w-4 h-4 mr-2" /> Excel
              </Button>
            </div>
          </motion.div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/30 border-t text-center justify-center p-4">
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <Info className="w-3 h-3" /> MLWF is deducted only in June & December (Half-yearly). Rates: Employee ₹25, Employer ₹75
        </p>
      </CardFooter>
    </Card>
  );
}
