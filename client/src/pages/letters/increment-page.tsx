import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Plus, Search, Download, Eye, IndianRupee, Percent } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME } from "@/lib/pdf-utils";

interface IncrementLetter {
  id: number;
  employee: string;
  department: string;
  currentSalary: number;
  newSalary: number;
  increment: number;
  effectiveDate: string;
  status: string;
}

export default function IncrementLettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncrementLetter | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee: "",
    department: "",
    currentSalary: "",
    increment: "",
    effectiveDate: ""
  });

  const [letters, setLetters] = useState<IncrementLetter[]>([
    { id: 1, employee: "John Doe", department: "Engineering", currentSalary: 1500000, newSalary: 1725000, increment: 15, effectiveDate: "Apr 1, 2024", status: "Generated" },
    { id: 2, employee: "Jane Smith", department: "Marketing", currentSalary: 1200000, newSalary: 1344000, increment: 12, effectiveDate: "Apr 1, 2024", status: "Generated" },
    { id: 3, employee: "Mike Johnson", department: "Sales", currentSalary: 1000000, newSalary: 1120000, increment: 12, effectiveDate: "Apr 1, 2024", status: "Pending" },
    { id: 4, employee: "Sarah Wilson", department: "HR", currentSalary: 900000, newSalary: 990000, increment: 10, effectiveDate: "Apr 1, 2024", status: "Generated" },
    { id: 5, employee: "Tom Brown", department: "Finance", currentSalary: 1100000, newSalary: 1232000, increment: 12, effectiveDate: "Apr 1, 2024", status: "Pending" },
  ]);

  const totalIncrementValue = letters.reduce((sum, l) => sum + (l.newSalary - l.currentSalary), 0);
  const avgIncrement = letters.reduce((sum, l) => sum + l.increment, 0) / letters.length;

  const letterStats = [
    { title: "Total Increments", value: letters.length.toString(), icon: <TrendingUp className="h-5 w-5" /> },
    { title: "Avg Increment", value: `${avgIncrement.toFixed(1)}%`, icon: <Percent className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Total Value", value: `₹${(totalIncrementValue / 100000).toFixed(1)}L`, icon: <IndianRupee className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    { title: "This Quarter", value: letters.length.toString(), icon: <TrendingUp className="h-5 w-5" />, color: "bg-purple-50 text-purple-600" },
  ];

  const filteredLetters = letters.filter(letter =>
    letter.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Generated": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const formatSalary = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    return `₹${amount.toLocaleString()}`;
  };

  const generatePDF = (letter: IncrementLetter) => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "SALARY INCREMENT LETTER", subtitle: "Compensation Revision Notice" });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("INC");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Dear ${letter.employee},`, 15, 82);
    
    const content = `We are pleased to inform you that, based on your performance and contribution to ${COMPANY_NAME}, your salary has been revised with effect from ${letter.effectiveDate}.

Current Annual CTC: Rs. ${letter.currentSalary.toLocaleString()}
Revised Annual CTC: Rs. ${letter.newSalary.toLocaleString()}
Increment Percentage: ${letter.increment}%

This increment reflects our appreciation for your hard work and dedication to the ${letter.department} department. We hope you will continue to contribute to the growth and success of our organization.

Please contact the HR department if you have any questions regarding your revised compensation.

Congratulations on your well-deserved increment!`;

    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 92);
    
    addHRSignature(doc, 195);
    
    return doc;
  };

  const handleDownload = (letter: IncrementLetter) => {
    const doc = generatePDF(letter);
    doc.save(`increment_letter_${letter.employee.replace(/\s+/g, '_')}.pdf`);
    toast({
      title: "Downloaded",
      description: `Increment letter for ${letter.employee} downloaded successfully.`
    });
  };

  const handleView = (letter: IncrementLetter) => {
    setSelectedLetter(letter);
    setShowViewDialog(true);
  };

  const handleGenerate = (letterId?: number) => {
    if (letterId) {
      setLetters(letters.map(l => 
        l.id === letterId ? { ...l, status: "Generated" } : l
      ));
      toast({
        title: "Letter Generated",
        description: "Increment letter generated successfully."
      });
    } else {
      if (!formData.employee || !formData.department || !formData.currentSalary || !formData.increment || !formData.effectiveDate) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
      const currentSalary = parseFloat(formData.currentSalary);
      const incrementPercent = parseFloat(formData.increment);
      const newSalary = currentSalary * (1 + incrementPercent / 100);
      
      const newLetter: IncrementLetter = {
        id: letters.length + 1,
        employee: formData.employee,
        department: formData.department,
        currentSalary: currentSalary,
        newSalary: Math.round(newSalary),
        increment: incrementPercent,
        effectiveDate: formData.effectiveDate,
        status: "Generated"
      };
      setLetters([...letters, newLetter]);
      setShowGenerateDialog(false);
      setFormData({ employee: "", department: "", currentSalary: "", increment: "", effectiveDate: "" });
      toast({
        title: "Letter Generated",
        description: `Increment letter for ${formData.employee} generated successfully.`
      });
    }
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Increment Letters</h1>
            <p className="text-slate-500 mt-1">Generate and manage salary increment letters</p>
          </div>
          <Button className="gap-2" onClick={() => setShowGenerateDialog(true)} data-testid="button-generate-letter">
            <Plus className="h-4 w-4" />
            Generate Letter
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
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600"}`}>
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
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Increment Letters
                </CardTitle>
                <CardDescription>All increment letters and their status</CardDescription>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Current CTC</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">New CTC</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Increment</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Effective</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLetters.map((letter, index) => (
                    <tr key={letter.id} className="border-b hover:bg-slate-50" data-testid={`row-letter-${index}`}>
                      <td className="py-3 px-4 font-medium">{letter.employee}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.department}</td>
                      <td className="py-3 px-4">{formatSalary(letter.currentSalary)}</td>
                      <td className="py-3 px-4 font-medium text-green-600">{formatSalary(letter.newSalary)}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary" className="gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {letter.increment}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{letter.effectiveDate}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(letter.status)}>{letter.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {letter.status === "Generated" ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleView(letter)} data-testid={`button-view-${index}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDownload(letter)} data-testid={`button-download-${index}`}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" onClick={() => handleGenerate(letter.id)} data-testid={`button-generate-${index}`}>Generate</Button>
                          )}
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

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Increment Letter</DialogTitle>
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
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Annual CTC (Rs.)</Label>
              <Input 
                type="number"
                placeholder="Enter current salary"
                value={formData.currentSalary}
                onChange={(e) => setFormData({...formData, currentSalary: e.target.value})}
                data-testid="input-current-salary"
              />
            </div>
            <div className="space-y-2">
              <Label>Increment Percentage (%)</Label>
              <Input 
                type="number"
                placeholder="Enter increment percentage"
                value={formData.increment}
                onChange={(e) => setFormData({...formData, increment: e.target.value})}
                data-testid="input-increment"
              />
            </div>
            <div className="space-y-2">
              <Label>Effective Date</Label>
              <Input 
                type="date"
                value={formData.effectiveDate}
                onChange={(e) => setFormData({...formData, effectiveDate: e.target.value})}
                data-testid="input-effective-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>Cancel</Button>
            <Button onClick={() => handleGenerate()}>Generate Letter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Increment Letter - {selectedLetter?.employee}</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4 py-4 bg-white p-6 border rounded-lg">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">SALARY INCREMENT LETTER</h2>
              </div>
              <p className="text-right">Date: {new Date().toLocaleDateString()}</p>
              <p>Dear {selectedLetter.employee},</p>
              <p>
                We are pleased to inform you that, based on your performance and contribution to the organization, your salary has been revised with effect from <strong>{selectedLetter.effectiveDate}</strong>.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <p>Current Annual CTC: <strong>Rs. {selectedLetter.currentSalary.toLocaleString()}</strong></p>
                <p>Revised Annual CTC: <strong className="text-green-600">Rs. {selectedLetter.newSalary.toLocaleString()}</strong></p>
                <p>Increment Percentage: <strong>{selectedLetter.increment}%</strong></p>
              </div>
              <p>
                This increment reflects our appreciation for your hard work and dedication to the {selectedLetter.department} department. We hope you will continue to contribute to the growth and success of our organization.
              </p>
              <p>
                Please contact the HR department if you have any questions regarding your revised compensation.
              </p>
              <p className="font-medium">Congratulations on your well-deserved increment!</p>
              <div className="pt-8">
                <p>Sincerely,</p>
                <p className="font-semibold mt-4">HR Department</p>
                <p>HRConnect</p>
              </div>
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
