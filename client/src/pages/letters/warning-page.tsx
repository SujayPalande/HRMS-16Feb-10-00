import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertTriangle, Plus, Search, Download, Eye, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME } from "@/lib/pdf-utils";

interface WarningLetter {
  id: number;
  employee: string;
  department: string;
  reason: string;
  type: string;
  issueDate: string;
  status: string;
  details?: string;
}

export default function WarningLettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showIssueDialog, setShowIssueDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<WarningLetter | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee: "",
    department: "",
    reason: "",
    type: "",
    details: ""
  });

  const [letters, setLetters] = useState<WarningLetter[]>([
    { id: 1, employee: "John Smith", department: "Engineering", reason: "Repeated tardiness", type: "First Warning", issueDate: "Jan 15, 2024", status: "Issued", details: "Employee has been late to work more than 5 times in the past month without valid reasons." },
    { id: 2, employee: "Mike Davis", department: "Sales", reason: "Policy violation", type: "First Warning", issueDate: "Jan 10, 2024", status: "Acknowledged", details: "Violation of company policy regarding client data handling." },
    { id: 3, employee: "Sarah Brown", department: "Marketing", reason: "Unprofessional conduct", type: "Final Warning", issueDate: "Dec 20, 2023", status: "Acknowledged", details: "Inappropriate behavior during team meeting and failure to follow protocol." },
    { id: 4, employee: "Tom Wilson", department: "Operations", reason: "Attendance issues", type: "First Warning", issueDate: "Dec 15, 2023", status: "Issued", details: "Multiple unexcused absences during the month of December." },
    { id: 5, employee: "Lisa Chen", department: "Finance", reason: "Performance concerns", type: "First Warning", issueDate: "Nov 28, 2023", status: "Acknowledged", details: "Consistent failure to meet deadlines and quality standards." },
  ]);

  const letterStats = [
    { title: "Total Issued", value: letters.length.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
    { title: "This Year", value: letters.filter(l => l.issueDate.includes("2024")).length.toString(), icon: <FileText className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "First Warning", value: letters.filter(l => l.type === "First Warning").length.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: "bg-orange-50 text-orange-600" },
    { title: "Final Warning", value: letters.filter(l => l.type === "Final Warning").length.toString(), icon: <AlertTriangle className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
  ];

  const filteredLetters = letters.filter(letter =>
    letter.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case "First Warning": return "bg-yellow-100 text-yellow-700";
      case "Final Warning": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Acknowledged": return "bg-green-100 text-green-700";
      case "Issued": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const generatePDF = (letter: WarningLetter) => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: letter.type.toUpperCase(), subtitle: "Disciplinary Action Notice" });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("WRN");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, letter.issueDate, 68);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`To: ${letter.employee}`, 15, 78);
    doc.text(`Department: ${letter.department}`, 15, 85);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Subject: ${letter.type} - ${letter.reason}`, 15, 95);
    doc.setFont("helvetica", "normal");
    
    const content = `Dear ${letter.employee},

This letter serves as a formal ${letter.type.toLowerCase()} regarding your conduct/performance at ${COMPANY_NAME}.

Issue: ${letter.reason}

Details: ${letter.details || "As discussed in our meeting."}

You are hereby advised to take immediate corrective action regarding the above matter. Failure to improve may result in further disciplinary action, up to and including termination of employment.

${letter.type === "Final Warning" ? "This is your final warning. Any further violations will result in immediate termination." : "Please consider this as a formal warning and take necessary steps to rectify the situation."}

You are required to acknowledge receipt of this letter by signing below.`;

    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 105);
    
    addHRSignature(doc, 195);
    
    doc.setFontSize(9);
    doc.text("Employee Signature: ________________________    Date: ________________", 15, 240);
    
    return doc;
  };

  const handleDownload = (letter: WarningLetter) => {
    const doc = generatePDF(letter);
    doc.save(`warning_letter_${letter.employee.replace(/\s+/g, '_')}.pdf`);
    toast({
      title: "Downloaded",
      description: `Warning letter for ${letter.employee} downloaded successfully.`
    });
  };

  const handleView = (letter: WarningLetter) => {
    setSelectedLetter(letter);
    setShowViewDialog(true);
  };

  const handleIssue = () => {
    if (!formData.employee || !formData.department || !formData.reason || !formData.type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const newLetter: WarningLetter = {
      id: letters.length + 1,
      employee: formData.employee,
      department: formData.department,
      reason: formData.reason,
      type: formData.type,
      issueDate: today,
      status: "Issued",
      details: formData.details
    };
    setLetters([...letters, newLetter]);
    setShowIssueDialog(false);
    setFormData({ employee: "", department: "", reason: "", type: "", details: "" });
    toast({
      title: "Warning Issued",
      description: `Warning letter issued to ${formData.employee}.`
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Warning Letters</h1>
            <p className="text-slate-500 mt-1">Issue and manage disciplinary warning letters</p>
          </div>
          <Button className="gap-2" onClick={() => setShowIssueDialog(true)} data-testid="button-issue-warning">
            <Plus className="h-4 w-4" />
            Issue Warning
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {letterStats.map((stat, index) => (
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
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Warning Letters
                </CardTitle>
                <CardDescription>All disciplinary warning letters issued</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employee..."
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Reason</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Issue Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLetters.map((letter, index) => (
                    <tr key={letter.id} className="border-b hover:bg-slate-50" data-testid={`row-letter-${index}`}>
                      <td className="py-3 px-4 font-medium">{letter.employee}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.department}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.reason}</td>
                      <td className="py-3 px-4">
                        <Badge className={getTypeColor(letter.type)}>{letter.type}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{letter.issueDate}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(letter.status)}>{letter.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleView(letter)} data-testid={`button-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDownload(letter)} data-testid={`button-download-${index}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showIssueDialog} onOpenChange={setShowIssueDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Warning Letter</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Employee Name</Label>
              <Input 
                placeholder="Enter employee name"
                value={formData.employee}
                onChange={(e) => setFormData({...formData, employee: e.target.value})}
                data-testid="input-employee-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={formData.department} onValueChange={(v) => setFormData({...formData, department: v})}>
                <SelectTrigger data-testid="select-department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Warning Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue placeholder="Select warning type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="First Warning">First Warning</SelectItem>
                  <SelectItem value="Final Warning">Final Warning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                placeholder="Enter reason for warning"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
                data-testid="input-reason"
              />
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea 
                placeholder="Enter detailed description..."
                value={formData.details}
                onChange={(e) => setFormData({...formData, details: e.target.value})}
                rows={4}
                data-testid="input-details"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIssueDialog(false)}>Cancel</Button>
            <Button onClick={handleIssue} className="bg-red-600 hover:bg-red-700">Issue Warning</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-red-600">{selectedLetter?.type} - {selectedLetter?.employee}</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4 py-4 bg-white p-6 border rounded-lg">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold text-red-600">{selectedLetter.type.toUpperCase()}</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{selectedLetter.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedLetter.department}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Issue Date</p>
                  <p className="font-medium">{selectedLetter.issueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={getStatusColor(selectedLetter.status)}>{selectedLetter.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Reason</p>
                <p className="font-medium">{selectedLetter.reason}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Details</p>
                <p className="text-slate-700">{selectedLetter.details}</p>
              </div>
              {selectedLetter.type === "Final Warning" && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-red-700 font-medium">This is a final warning. Any further violations will result in immediate termination.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedLetter && (
              <Button onClick={() => handleDownload(selectedLetter)}>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
