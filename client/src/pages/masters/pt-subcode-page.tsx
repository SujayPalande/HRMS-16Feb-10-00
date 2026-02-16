import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Plus, Save, X, Edit, Trash2, List, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export default function PTSubcodePage() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-purple-700 shadow-2xl">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">Professional Tax SubCode</h1>
          <p className="text-purple-300 mt-2 font-medium tracking-tight">Regional taxation hierarchy & compliance master</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className={`${isCreating ? 'md:col-span-8' : 'md:col-span-12'} space-y-6 transition-all duration-500`}>
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-purple-600" />
                  Taxation Protocols
                </CardTitle>
                {!isCreating && (
                  <Button onClick={() => setIsCreating(true)} className="rounded-xl bg-purple-600 hover:bg-purple-700 font-bold px-6 shadow-lg shadow-purple-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Register New SubCode
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 border-none">
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-slate-400">Principal Code</TableHead>
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-slate-400">PT SubCode</TableHead>
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-slate-400">Jurisdiction</TableHead>
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-right text-slate-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-none hover:bg-purple-50/50 transition-colors">
                      <TableCell className="p-5 font-black text-slate-400 italic">BASE-01</TableCell>
                      <TableCell className="p-5 font-bold text-purple-700">MH-PUNE-01</TableCell>
                      <TableCell className="p-5 text-slate-600 font-bold">Maharashtra / Pune Central</TableCell>
                      <TableCell className="p-5 text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-purple-100 hover:text-purple-600"><Edit className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-red-50 hover:text-red-600"><Trash2 className="w-4 h-4" /></Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {isCreating && (
            <div className="md:col-span-4 transition-all duration-500">
              <Card className="border-none shadow-2xl bg-slate-900 text-white overflow-hidden sticky top-6">
                <CardHeader className="bg-purple-600 p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter italic">Tax config</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="text-white hover:bg-white/20">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Principal tax index</Label>
                    <Input placeholder="Select Code" className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Unique SubCode</Label>
                    <Input placeholder="Enter subcode" className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-purple-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Legislation description</Label>
                    <Input placeholder="Enter name" className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-purple-500" />
                  </div>
                  <Button className="w-full h-12 rounded-xl bg-purple-500 hover:bg-purple-400 font-black uppercase tracking-widest text-slate-900 mt-4">
                    <Save className="w-5 h-5 mr-2" /> Commit Entry
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
