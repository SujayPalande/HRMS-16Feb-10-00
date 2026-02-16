import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Landmark, Plus, Save, X, Edit, Trash2, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export default function LWFSubcodePage() {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <AppLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-teal-900 to-emerald-900 -mx-6 -mt-6 px-8 py-10 mb-8 border-b border-teal-700 shadow-2xl">
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic">M.L.W.F. SubCode Master</h1>
          <p className="text-teal-300 mt-2 font-medium">Maharashtra Labour Welfare Fund (Half-yearly: June & December - Employee ₹25, Employer ₹75)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className={`${isCreating ? 'md:col-span-8' : 'md:col-span-12'} space-y-6 transition-all duration-500`}>
            <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
              <CardHeader className="bg-slate-50 dark:bg-slate-800/50 p-6 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <List className="w-5 h-5 text-teal-600" />
                  Registered SubCodes
                </CardTitle>
                {!isCreating && (
                  <Button onClick={() => setIsCreating(true)} className="rounded-xl bg-teal-600 hover:bg-teal-700 font-bold px-6 shadow-lg shadow-teal-500/20">
                    <Plus className="w-4 h-4 mr-2" /> Create New Protocol
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 border-none">
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">MLWF Code</TableHead>
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5">Description</TableHead>
                      <TableHead className="font-black text-[10px] tracking-widest uppercase p-5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-none hover:bg-slate-50 transition-colors">
                      <TableCell className="p-5 font-bold text-teal-700">MAH001</TableCell>
                      <TableCell className="p-5 text-slate-600 font-medium">Maharashtra State Welfare Fund</TableCell>
                      <TableCell className="p-5 text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-teal-50 hover:text-teal-600"><Edit className="w-4 h-4" /></Button>
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
                <CardHeader className="bg-teal-600 p-6">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black uppercase tracking-tighter">New SubCode</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setIsCreating(false)} className="text-white hover:bg-white/20">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-teal-400">Inbound Code</Label>
                    <Input placeholder="e.g. MH-01" className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-teal-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-teal-400">Jurisdiction Description</Label>
                    <Input placeholder="Enter subcode name" className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:ring-teal-500" />
                  </div>
                  <Button className="w-full h-12 rounded-xl bg-teal-500 hover:bg-teal-400 font-black uppercase tracking-widest text-slate-900 mt-4">
                    <Save className="w-5 h-5 mr-2" /> Commit to Master
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
