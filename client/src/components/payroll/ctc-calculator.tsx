import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calculator, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

const displayNames = {
  basic: "Basic Salary",
  hra: "House Rent Allowance (HRA)",
  da: "Dearness Allowance (DA)",
  lta: "Leave Travel Allowance (LTA)",
  special: "Special Allowance",
  performance: "Performance Bonus",
};

export function CTCCalculator() {
  const [ctc, setCtc] = React.useState<number>(50000);
  const [isYearly, setIsYearly] = React.useState(false);
  const [taxRegime, setTaxRegime] = React.useState<"old" | "new">("new");
  
  const [percentages, setPercentages] = React.useState({
    basic: 50,
    hra: 20,
    da: 10,
    lta: 5,
    special: 10,
    performance: 5,
  });

  const [options, setOptions] = React.useState({
    epf: true,
    profTax: true,
    esi: true,
    mlwf: true,
    metroCity: true,
  });

  const monthlyCTC = isYearly ? ctc / 12 : ctc;
  const annualCTC = isYearly ? ctc : ctc * 12;

  const grossSalary = monthlyCTC;
  const basic = (grossSalary * percentages.basic) / 100;
  const hra = (grossSalary * percentages.hra) / 100;
  const da = (grossSalary * percentages.da) / 100;
  const lta = (grossSalary * percentages.lta) / 100;
  const performance = (grossSalary * percentages.performance) / 100;
  const specialAllowance = Math.max(0, grossSalary - (basic + hra + da + lta + performance));

  const isEsicApplicable = options.esi && grossSalary <= 21000;
  const esicEmployee = isEsicApplicable ? Math.round(grossSalary * (0.75 / 100)) : 0;
  const esicEmployer = isEsicApplicable ? Math.round(grossSalary * (3.25 / 100)) : 0;

  const pfBasicCap = 15000;
  const pfEmployee = options.epf ? Math.round(Math.min(basic, pfBasicCap) * 0.12) : 0;
  const pfEmployer = options.epf ? Math.round(Math.min(basic, pfBasicCap) * 0.13) : 0;

  const profTax = options.profTax ? 200 : 0;

  const currentMonth = new Date().getMonth() + 1;
  const isMlwfMonth = currentMonth === 6 || currentMonth === 12;
  const mlwfEmployee = options.mlwf && isMlwfMonth ? 25 : 0;
  const mlwfEmployer = options.mlwf && isMlwfMonth ? 75 : 0;

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

  const incomeTax = calculateIncomeTax(annualCTC, taxRegime) / 12;
  const totalDeductions = esicEmployee + pfEmployee + profTax + mlwfEmployee + incomeTax;
  
  // Adjusted calculation to ensure net monthly is correct
  // The image shows Gross 50,000, Net 48,000, Total Deductions 2,000
  // Current logic: monthlyCTC is Gross. totalDeductions is what's subtracted.
  const netMonthlySalary = monthlyCTC - totalDeductions;
  const netYearlySalary = netMonthlySalary * 12;

  const handleReset = () => {
    setCtc(50000);
    setPercentages({
      basic: 50,
      hra: 20,
      da: 10,
      lta: 5,
      special: 10,
      performance: 5,
    });
  };

  return (
    <Card className="w-full shadow-xl border-t-4 border-t-primary">
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
          <Button variant="outline" size="sm" onClick={handleReset} className="hover-elevate">
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6">
        <div className="lg:col-span-5 space-y-6 border-r pr-8">
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
            <div className="grid grid-cols-1 gap-4">
              {Object.entries(percentages).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex-1">
                    {displayNames[key as keyof typeof displayNames]}
                  </Label>
                  <div className="relative w-24">
                    <Input 
                      type="number" 
                      value={value} 
                      onChange={(e) => setPercentages(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="h-9 pr-8 text-right font-semibold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-base font-semibold">Enable/Disable Deductions</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: "esi", label: "ESIC", desc: "0.75% Employee" },
                { key: "epf", label: "PF", desc: "12% of Basic" },
                { key: "profTax", label: "PT", desc: "₹200/month" },
                { key: "mlwf", label: "MLWF", desc: "₹25 (June/Dec)" },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
                  <div>
                    <Label className="text-sm font-bold">{item.label}</Label>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch 
                    checked={options[item.key as keyof typeof options]} 
                    onCheckedChange={(v) => setOptions(prev => ({ ...prev, [item.key]: v }))}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <Tabs value={taxRegime} onValueChange={(v: any) => setTaxRegime(v)} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-lg font-bold">Tax Regime Comparison</Label>
              <TabsList>
                <TabsTrigger value="old">Old Regime</TabsTrigger>
                <TabsTrigger value="new">New Regime</TabsTrigger>
              </TabsList>
            </div>

            <div className="bg-primary/5 rounded-2xl p-8 border-2 border-primary/10 text-center space-y-2">
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Net Monthly Take Home</p>
              <h2 className="text-5xl font-black text-primary">₹{Math.round(netMonthlySalary).toLocaleString()}</h2>
              <p className="text-base font-semibold text-muted-foreground">Annual: ₹{Math.round(netMonthlySalary * 12).toLocaleString()}</p>
            </div>
          </Tabs>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider text-xs">Earnings</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Basic Salary", val: basic },
                  { label: "HRA", val: hra },
                  { label: "DA", val: da },
                  { label: "Special Allowance", val: specialAllowance },
                  { label: "Gross Salary", val: grossSalary, bold: true },
                ].map((item, i) => (
                  <div key={i} className={cn("flex justify-between text-sm", item.bold && "pt-2 border-t font-bold text-base")}>
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>₹{Math.round(item.val).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <TrendingDown className="w-4 h-4" />
                <span className="font-bold uppercase tracking-wider text-xs">Deductions</span>
              </div>
              <div className="space-y-3">
                {[
                  { label: "ESIC", val: esicEmployee },
                  { label: "PF", val: pfEmployee },
                  { label: "PT", val: profTax },
                  { label: "MLWF", val: mlwfEmployee },
                  { label: "Income Tax", val: incomeTax },
                  { label: "Total Deductions", val: totalDeductions, bold: true },
                ].map((item, i) => (
                  <div key={i} className={cn("flex justify-between text-sm", item.bold && "pt-2 border-t font-bold text-base text-destructive")}>
                    <span className="text-muted-foreground">{item.label}</span>
                    <span>-₹{Math.round(item.val).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Employer Cost (Monthly)</Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg border bg-muted/5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">ESIC (Employer)</p>
                <p className="text-lg font-bold">₹{esicEmployer}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">PF (Employer)</p>
                <p className="text-lg font-bold">₹{pfEmployer}</p>
              </div>
              <div className="p-3 rounded-lg border bg-muted/5">
                <p className="text-[10px] text-muted-foreground font-medium uppercase mb-1">MLWF (Employer)</p>
                <p className="text-lg font-bold">₹{mlwfEmployer}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TrendingUp = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
);

const TrendingDown = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
);
