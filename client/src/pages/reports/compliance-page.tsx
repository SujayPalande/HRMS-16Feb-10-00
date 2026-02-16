import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Scale, Download, CheckCircle, Clock, AlertTriangle, FileBarChart, Calendar, Search, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME } from "@/lib/pdf-utils";

interface ComplianceItem {
  id: number;
  name: string;
  frequency: string;
  lastFiled: string;
  nextDue: string;
  status: string;
  description?: string;
  authority?: string;
  penalty?: string;
}

export default function ComplianceReportsPage() {
  const currentYearValue = new Date().getFullYear();
  const yearsList = Array.from({ length: 6 }, (_, i) => `${currentYearValue - 5 + i}-${(currentYearValue - 4 + i).toString().slice(-2)}`);
  const [selectedYear, setSelectedYear] = useState(yearsList[5]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ComplianceItem | null>(null);
  const { toast } = useToast();

  const complianceStats = [
    { title: "Compliant", value: "18", icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending", value: "3", icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Overdue", value: "1", icon: <AlertTriangle className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
    { title: "Total Filings", value: "22", icon: <FileBarChart className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
  ];

  const complianceItems: ComplianceItem[] = [
    { id: 1, name: "PF Monthly Return", frequency: "Monthly", lastFiled: "Jan 15, 2024", nextDue: "Feb 15, 2024", status: "Compliant", description: "Monthly Provident Fund returns to be filed with EPFO", authority: "EPFO", penalty: "Rs. 5,000 per day delay" },
    { id: 2, name: "ESI Monthly Return", frequency: "Monthly", lastFiled: "Jan 12, 2024", nextDue: "Feb 11, 2024", status: "Compliant", description: "Monthly ESI contribution returns", authority: "ESIC", penalty: "Rs. 2,500 per day delay" },
    { id: 3, name: "Professional Tax", frequency: "Monthly", lastFiled: "Jan 5, 2024", nextDue: "Feb 5, 2024", status: "Pending", description: "Monthly Professional Tax deduction and payment", authority: "State Government", penalty: "Interest @ 1.25% per month" },
    { id: 4, name: "TDS Quarterly Return", frequency: "Quarterly", lastFiled: "Oct 15, 2023", nextDue: "Jan 15, 2024", status: "Overdue", description: "Quarterly TDS returns (Form 24Q, 26Q)", authority: "Income Tax Department", penalty: "Rs. 200 per day" },
    { id: 5, name: "Form 16 Issuance", frequency: "Annual", lastFiled: "Jun 10, 2023", nextDue: "Jun 15, 2024", status: "Compliant", description: "Annual Form 16 to be issued to employees", authority: "Income Tax Department", penalty: "Rs. 100 per day per employee" },
    { id: 6, name: "Labour Welfare Fund", frequency: "Bi-Annual", lastFiled: "Dec 31, 2023", nextDue: "Jun 30, 2024", status: "Compliant", description: "Bi-annual Labour Welfare Fund contribution", authority: "Labour Department", penalty: "Rs. 1,000 + interest" },
    { id: 7, name: "Gratuity Return", frequency: "Annual", lastFiled: "Dec 15, 2023", nextDue: "Dec 15, 2024", status: "Compliant", description: "Annual gratuity fund returns", authority: "Labour Commissioner", penalty: "Variable based on default" },
    { id: 8, name: "Annual Returns", frequency: "Annual", lastFiled: "Jan 31, 2023", nextDue: "Jan 31, 2024", status: "Pending", description: "Annual returns under Shops & Establishments Act", authority: "Labour Department", penalty: "Rs. 5,000 + prosecution" },
  ];

  const filteredItems = complianceItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.frequency.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Compliant": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Overdue": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Compliant": return <CheckCircle className="h-4 w-4" />;
      case "Pending": return <Clock className="h-4 w-4" />;
      case "Overdue": return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleView = (item: ComplianceItem) => {
    setSelectedItem(item);
    setShowViewDialog(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "COMPLIANCE REPORT", subtitle: `Fiscal Year: ${selectedYear}` });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("CMP");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Summary:", 15, 80);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Compliant: 18 items", 25, 88);
    doc.text("Pending: 3 items", 25, 96);
    doc.text("Overdue: 1 item", 25, 104);
    doc.text("Total Filings: 22", 25, 112);
    
    doc.setFont("helvetica", "bold");
    doc.text("Compliance Status:", 15, 125);
    
    let yPos = 135;
    doc.setFontSize(9);
    doc.text("Compliance Item", 15, yPos);
    doc.text("Frequency", 75, yPos);
    doc.text("Last Filed", 110, yPos);
    doc.text("Next Due", 145, yPos);
    doc.text("Status", 180, yPos);
    
    doc.setFont("helvetica", "normal");
    yPos += 8;
    filteredItems.forEach((item) => {
      doc.text(item.name, 15, yPos);
      doc.text(item.frequency, 75, yPos);
      doc.text(item.lastFiled, 110, yPos);
      doc.text(item.nextDue, 145, yPos);
      doc.text(item.status, 180, yPos);
      yPos += 7;
    });
    
    addHRSignature(doc, yPos + 25);
    
    doc.save(`compliance_report_FY_${selectedYear}.pdf`);
    
    toast({
      title: "PDF Exported",
      description: `Compliance report for FY ${selectedYear} downloaded successfully.`
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Compliance Reports</h1>
            <p className="text-slate-500 mt-1">Track statutory compliance status</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-32 h-9 font-bold shadow-sm" data-testid="select-year">
                <Calendar className="h-4 w-4 mr-2 text-teal-600" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearsList.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2 h-9 font-bold shadow-sm" onClick={handleExportPDF} data-testid="button-export">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {complianceStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-teal-600" />
                  Compliance Status - FY {selectedYear}
                </CardTitle>
                <CardDescription>All statutory filings and their status</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search compliance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Compliance Item</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Frequency</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Last Filed</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Next Due</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} className="border-b hover:bg-slate-50" data-testid={`row-compliance-${index}`}>
                      <td className="py-3 px-4 font-medium">{item.name}</td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{item.frequency}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{item.lastFiled}</td>
                      <td className="py-3 px-4 text-slate-600">{item.nextDue}</td>
                      <td className="py-3 px-4">
                        <Badge className={`${getStatusColor(item.status)} gap-1`}>
                          {getStatusIcon(item.status)}
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" variant="outline" onClick={() => handleView(item)} data-testid={`button-view-${index}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedItem.status)}>
                  {getStatusIcon(selectedItem.status)}
                  <span className="ml-1">{selectedItem.status}</span>
                </Badge>
                <Badge variant="outline">{selectedItem.frequency}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Last Filed</p>
                  <p className="font-medium">{selectedItem.lastFiled}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Next Due</p>
                  <p className="font-medium">{selectedItem.nextDue}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="text-slate-700">{selectedItem.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Filing Authority</p>
                <p className="font-medium">{selectedItem.authority}</p>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Penalty for Non-Compliance</p>
                <p className="text-red-700">{selectedItem.penalty}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
