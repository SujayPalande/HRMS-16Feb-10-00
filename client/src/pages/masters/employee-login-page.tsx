import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Users, ShieldCheck, Mail, Smartphone, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

export default function EmployeeLoginPage() {
  const [selectedUnit, setSelectedUnit] = useState<string>("096");

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-blue-700 shadow-2xl">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Employee Login Management</h1>
          <p className="text-blue-300 mt-2 font-medium italic">Identity & access control infrastructure</p>
        </div>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-end gap-4">
            <div className="w-full md:w-64 space-y-2">
              <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Executive Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="h-12 rounded-xl border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="096">CYBAEM TECH (096)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="h-12 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold px-8 shadow-lg shadow-blue-500/20">
              Display Employee Directory
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
          <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-lg font-bold flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Access Control Console
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl font-bold border-2 h-10">
                <Mail className="w-4 h-4 mr-2" /> Email Credentials
              </Button>
              <Button variant="outline" className="rounded-xl font-bold border-2 h-10">
                <Smartphone className="w-4 h-4 mr-2" /> SMS Pulse
              </Button>
              <Button className="rounded-xl font-bold bg-blue-600 h-10 px-6">
                <Save className="w-4 h-4 mr-2" /> Update Authorization
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 border-none">
                    <TableHead className="w-[50px] p-5"><Checkbox /></TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Emp Code</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Name of Member</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Email Configuration</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Mobile Contact</TableHead>
                    <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Auth Protocol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-b border-slate-50 dark:border-slate-800">
                    <TableCell className="p-5"><Checkbox /></TableCell>
                    <TableCell className="p-5 font-mono font-bold text-blue-600">6283</TableCell>
                    <TableCell className="p-5 font-bold">ABHIJEET PRATAP PATIL</TableCell>
                    <TableCell className="p-5 text-slate-500 italic">abhipatil0916@gmail.com</TableCell>
                    <TableCell className="p-5 font-medium">9922935081</TableCell>
                    <TableCell className="p-5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Active Session</span>
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
