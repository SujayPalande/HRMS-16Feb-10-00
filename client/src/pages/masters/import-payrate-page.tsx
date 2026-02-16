import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, FileUp, Table as TableIcon, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { motion } from "framer-motion";

export default function ImportPayRatePage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("096");

  const rates = [
    { code: "6283", name: "ABHIJEET PRATAP PATIL", basic: 8350, hra: 418, conv: 1670, wash: 6262, gross: 2136.26 },
    { code: "4905", name: "ABHISHEK VIVEKRAO PANDE", basic: 14584, hra: 729, conv: 2917, wash: 10937, gross: 3500.00 },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-emerald-700 shadow-2xl">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Import Employee PayRate</h1>
          <p className="text-emerald-300 mt-2 font-medium italic">High-precision salary structure synchronization</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50">
                <CardTitle className="text-lg font-bold">Synchronization</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Target Unit</Label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="rounded-xl h-12">
                      <SelectValue placeholder="Select Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="096">CYBAEM TECH (096)</SelectItem>
                      <SelectItem value="043">ASN HR (043)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-6 border-2 border-dashed rounded-2xl flex flex-col items-center gap-4">
                  <FileUp className="w-8 h-8 text-emerald-600" />
                  <Button className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold">Upload Rates</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                  Payment Architecture
                </CardTitle>
                <Button variant="outline" className="rounded-xl font-bold border-2">
                  <Download className="w-4 h-4 mr-2" />
                  Export Master
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-100/50 dark:bg-slate-800/50 border-none">
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6">Emp Code</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6">Name</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6 text-right">Basic</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6 text-right">HRA</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6 text-right">Conv</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6 text-right">Wash</TableHead>
                        <TableHead className="font-black text-[10px] tracking-widest uppercase py-5 px-6 text-right">Proposed CTC</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rates.map(r => (
                        <TableRow key={r.code} className="border-b border-slate-50 dark:border-slate-800">
                          <TableCell className="py-4 px-6 font-mono font-bold text-emerald-600">{r.code}</TableCell>
                          <TableCell className="py-4 px-6 font-bold">{r.name}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{r.basic.toFixed(2)}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{r.hra.toFixed(2)}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{r.conv.toFixed(2)}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-medium">₹{r.wash.toFixed(2)}</TableCell>
                          <TableCell className="py-4 px-6 text-right font-black text-emerald-700">₹{r.gross.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
