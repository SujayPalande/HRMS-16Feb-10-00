import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Search, Filter, LayoutGrid, CheckCircle2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export default function MissingDetailsPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>("043");
  const [selectedHead, setSelectedHead] = useState<string>("esi");

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-orange-900 to-amber-900 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-orange-700 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] opacity-10"></div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter relative z-10">Missing Details Compliance</h1>
          <p className="text-orange-200 mt-2 font-medium italic relative z-10">Gap analysis & data integrity control</p>
        </div>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-end gap-6">
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Strategic Branch</Label>
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="043">ASN HR CONSULTANCY</SelectItem>
                  <SelectItem value="pune">PUNE DIVISION</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Compliance Head</Label>
              <Select value={selectedHead} onValueChange={setSelectedHead}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="esi">ESI Number Validation</SelectItem>
                  <SelectItem value="uan">UAN Registration</SelectItem>
                  <SelectItem value="bank">Bank Account Mapping</SelectItem>
                  <SelectItem value="pan">PAN Documentation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12 rounded-xl bg-orange-600 hover:bg-orange-700 font-bold px-10 shadow-lg shadow-orange-500/20">
              Scan For Discrepancies
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Discrepancy Log: {selectedHead.toUpperCase()}
            </CardTitle>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl font-bold h-10">Download Discrepancy List</Button>
              <Button className="rounded-xl font-bold bg-slate-900 text-white h-10 px-6">
                <FileUp className="w-4 h-4 mr-2" /> Bulk Rectify
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-none">
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Member ID</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Emp Code</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Full Name</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Department Unit</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Discrepancy Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-slate-50 dark:border-slate-800 hover:bg-orange-50/30 transition-colors">
                    <TableCell className="p-5 font-mono text-slate-400">1739599</TableCell>
                    <TableCell className="p-5 font-bold text-orange-700">5653</TableCell>
                    <TableCell className="p-5 font-bold">AMARJEET S</TableCell>
                    <TableCell className="p-5 text-slate-600 font-medium tracking-tight">AR ENTERPRISES</TableCell>
                    <TableCell className="p-5">
                      <div className="bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-flex items-center gap-1.5 border border-orange-200">
                        <AlertTriangle className="w-3 h-3" /> Missing Data
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
