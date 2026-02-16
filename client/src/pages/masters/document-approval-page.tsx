import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileCheck, ShieldCheck } from "lucide-react";

export default function DocumentApprovalPage() {
  return (
    <AppLayout>
      <div className="p-6">
        <div className="bg-gradient-to-r from-slate-50 via-slate-50 to-white -mx-6 -mt-6 px-6 pt-6 pb-6 mb-6 border-b-2 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Document Approval</h1>
              <p className="text-slate-500 mt-1">Manage and approve employee documentation</p>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-4 rounded-xl shadow-sm">
              <FileCheck className="w-8 h-8 text-indigo-700" />
            </div>
          </div>
        </div>
        <Card className="border-2 border-slate-200 shadow-lg">
          <CardHeader className="bg-slate-50/50 border-b-2 border-slate-100">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              Approval Workflow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-slate-600">Document approval management interface will be displayed here.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
