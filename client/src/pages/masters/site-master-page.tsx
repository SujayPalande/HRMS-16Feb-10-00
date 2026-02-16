import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Plus, Save, X, Edit, Trash2, ShieldCheck, MapPin, Globe, Building2, CreditCard, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SiteMasterPage() {
  const [selectedBranch, setSelectedBranch] = useState<string>("043");
  const [selectedUnit, setSelectedUnit] = useState<string>("0115");
  const [isCreating, setIsCreating] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-slate-700 shadow-2xl relative">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Department / Unit / Site Master</h1>
          <p className="text-slate-400 mt-2 font-medium italic">Global physical infrastructure and operational hierarchy console</p>
        </div>

        <AnimatePresence mode="wait">
          {!isCreating ? (
            <motion.div key="selector" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
              <Card className="border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                <CardHeader className="bg-slate-50 p-8 border-b border-slate-100">
                  <CardTitle className="text-xl font-black uppercase tracking-widest text-slate-800 flex items-center gap-3">
                    <Building2 className="w-6 h-6 text-slate-900" /> Infrastructure Targeting
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Target Branch</Label>
                      <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="043">ASN HR CONSULTANCY (043)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Global Unit Index</Label>
                      <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                        <SelectTrigger className="h-14 rounded-2xl border-slate-200 bg-slate-50 text-lg font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="0115">123456 (0115) [ID-338482]</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button onClick={() => setIsCreating(true)} className="h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl">New Physical Unit</Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-2 font-black uppercase tracking-widest">Update config</Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-2 font-black uppercase tracking-widest">Mirror Structure</Button>
                    <Button variant="secondary" className="h-14 rounded-2xl font-black uppercase tracking-widest">Synchronize</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl font-bold gap-2">
                  <X className="w-5 h-5" /> Back to selector
                </Button>
                <h2 className="text-2xl font-black uppercase tracking-tighter italic">Provisioning New Unit: ASN HR</h2>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-2xl bg-white dark:bg-slate-900 overflow-hidden">
                  <CardHeader className="bg-slate-900 text-white p-6">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-emerald-400" /> Geographic & Identification Protocol
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unit ID Protocol</Label>
                        <Input placeholder="Enter Code" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Naming Authority</Label>
                        <Input placeholder="Official Unit Name" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Physical Address Spectrum</Label>
                      <Input placeholder="Enter Full Physical Location" className="h-12 rounded-xl bg-slate-50 border-slate-100 font-bold" />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">ESI Applicability</Label>
                        <Select defaultValue="yes"><SelectTrigger className="h-12 rounded-xl border-slate-100"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">YES - ACTIVE</SelectItem><SelectItem value="no">NO</SelectItem></SelectContent></Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">PF Governance</Label>
                        <Select defaultValue="yes"><SelectTrigger className="h-12 rounded-xl border-slate-100"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">YES - ACTIVE</SelectItem><SelectItem value="no">NO</SelectItem></SelectContent></Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tax SubCode Mapping</Label>
                        <Select defaultValue="pune"><SelectTrigger className="h-12 rounded-xl border-slate-100"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pune">PUNE CENTRAL</SelectItem></SelectContent></Select>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                      <Button className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-2xl">
                        Commit Unit to Global Registry
                      </Button>
                      <Button variant="outline" onClick={() => setIsCreating(false)} className="flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest">Abort Provisioning</Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card className="border-none shadow-xl bg-indigo-900 text-white overflow-hidden">
                    <CardHeader className="bg-white/10 p-6">
                      <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" /> Deduction Matrix
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {['BASIC', 'DA', 'SPL.ALL', 'HRA', 'CONV.ALL'].map(head => (
                          <div key={head} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                            <span className="text-xs font-black italic">{head}</span>
                            <div className="flex gap-2">
                              <Badge className="bg-blue-500 text-[8px] font-black">ESI</Badge>
                              <Badge className="bg-emerald-500 text-[8px] font-black">PF</Badge>
                              <Badge className="bg-purple-500 text-[8px] font-black">PT</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-6 h-10 border-white/20 text-white hover:bg-white/10 font-bold text-xs uppercase">Edit Deduction Logic</Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
