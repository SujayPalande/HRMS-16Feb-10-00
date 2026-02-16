import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Search, Filter, LayoutGrid, CheckCircle2, FileUp, Edit2, Download, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RateMasterPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>("043");
  const [isViewingList, setIsViewingList] = useState(false);

  const units = [
    { code: "338482", id: "0115", name: "123456" },
    { code: "307056", id: "006", name: "AR ENTERPRISES" },
    { code: "307722", id: "096", name: "CYBAEM TECH" },
  ];

  return (
    <AppLayout>
      <div className="p-6 max-w-full mx-auto">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-slate-700 shadow-2xl">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">CategoryWise Rate Master</h1>
          <p className="text-slate-400 mt-2 font-medium tracking-tight">Enterprise-grade wage & benefit structural control</p>
        </div>

        <AnimatePresence mode="wait">
          {!isViewingList ? (
            <motion.div
              key="branch-select"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 max-w-2xl mx-auto overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-xl font-black uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="p-3 bg-slate-900 rounded-2xl shadow-lg">
                      <Filter className="w-6 h-6 text-white" />
                    </div>
                    Select Enterprise Branch
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-xs font-black uppercase tracking-widest text-slate-400 block ml-1">Branch Identity</Label>
                    <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                      <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 dark:bg-slate-800/50 text-lg font-bold">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl p-2">
                        <SelectItem value="043">ASN HR CONSULTANCY (043)</SelectItem>
                        <SelectItem value="pune">PUNE STRATEGIC DIVISION</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={() => setIsViewingList(true)}
                    className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-lg shadow-2xl transition-all active:scale-95"
                  >
                    Load Rate Structures
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="rate-list"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setIsViewingList(false)} className="rounded-xl hover:bg-slate-200">
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                      <CardTitle className="text-xl font-bold uppercase tracking-tight">Rate Structure: ASN HR</CardTitle>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Active Wage configurations</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 border-2">
                      <Download className="w-4 h-4 mr-2" /> Download Matrix
                    </Button>
                    <Button className="rounded-xl font-black uppercase text-[10px] tracking-widest h-10 bg-emerald-600 hover:bg-emerald-700 px-6">
                      <FileUp className="w-4 h-4 mr-2" /> Import Revision
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-100/30">
                        <TableRow className="border-none">
                          <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Protocol Code</TableHead>
                          <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">ID</TableHead>
                          <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Unit / Dept / Site Name</TableHead>
                          <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {units.map((unit, idx) => (
                          <TableRow key={unit.id} className={`border-b border-slate-50 dark:border-slate-800/50 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/30 dark:bg-slate-800/10'}`}>
                            <TableCell className="p-5 font-mono font-bold text-slate-400">{unit.code}</TableCell>
                            <TableCell className="p-5 font-mono font-bold text-blue-600 tracking-tighter">{unit.id}</TableCell>
                            <TableCell className="p-5 font-bold uppercase text-slate-700 dark:text-slate-300">{unit.name}</TableCell>
                            <TableCell className="p-5 text-right">
                              <Button variant="secondary" className="rounded-xl font-black uppercase text-[9px] tracking-widest h-8 px-4 bg-slate-100 hover:bg-slate-900 hover:text-white transition-all">
                                <Edit2 className="w-3 h-3 mr-1.5" /> Edit RateMaster
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
