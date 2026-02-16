import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Award, Plus, Search, Download, Eye, Send, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME } from "@/lib/pdf-utils";

interface ExperienceLetter {
  id: number;
  employee: string;
  position: string;
  department: string;
  tenure: string;
  lastDay: string;
  status: string;
  joinDate?: string;
}

export default function ExperienceLettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<ExperienceLetter | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    employee: "",
    position: "",
    department: "",
    joinDate: "",
    lastDay: ""
  });

  const [letters, setLetters] = useState<ExperienceLetter[]>([
    { id: 1, employee: "Alex Johnson", position: "Software Engineer", department: "Engineering", tenure: "3 years 2 months", lastDay: "Jan 31, 2024", status: "Generated", joinDate: "Nov 1, 2020" },
    { id: 2, employee: "Emily Davis", position: "Senior Designer", department: "Design", tenure: "2 years 8 months", lastDay: "Jan 25, 2024", status: "Sent", joinDate: "May 15, 2021" },
    { id: 3, employee: "Chris Wilson", position: "Product Manager", department: "Product", tenure: "4 years 5 months", lastDay: "Jan 20, 2024", status: "Sent", joinDate: "Aug 20, 2019" },
    { id: 4, employee: "Rachel Green", position: "Marketing Lead", department: "Marketing", tenure: "2 years 1 month", lastDay: "Feb 15, 2024", status: "Pending", joinDate: "Jan 15, 2022" },
    { id: 5, employee: "James Brown", position: "Sales Manager", department: "Sales", tenure: "5 years 3 months", lastDay: "Feb 28, 2024", status: "Pending", joinDate: "Nov 28, 2018" },
  ]);

  const letterStats = [
    { title: "Total Generated", value: letters.filter(l => l.status !== "Pending").length.toString(), icon: <Award className="h-5 w-5" /> },
    { title: "This Year", value: letters.filter(l => l.lastDay.includes("2024")).length.toString(), icon: <FileText className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    { title: "Sent", value: letters.filter(l => l.status === "Sent").length.toString(), icon: <Send className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending", value: letters.filter(l => l.status === "Pending").length.toString(), icon: <FileText className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
  ];

  const filteredLetters = letters.filter(letter =>
    letter.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    letter.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sent": return "bg-green-100 text-green-700";
      case "Generated": return "bg-blue-100 text-blue-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const generatePDF = (letter: ExperienceLetter) => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "EXPERIENCE CERTIFICATE", subtitle: "To Whom It May Concern" });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("EXP");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, undefined, 68);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    
    const content = `This is to certify that ${letter.employee} was employed with ${COMPANY_NAME} as a ${letter.position} in the ${letter.department} department from ${letter.joinDate} to ${letter.lastDay}.

During their tenure of ${letter.tenure}, ${letter.employee} demonstrated excellent professional skills, dedication, and commitment to their responsibilities.

${letter.employee} performed their duties diligently and was a valuable member of our team. We found their work to be satisfactory and their conduct to be professional at all times.

We wish ${letter.employee} all the best in their future endeavors.

This certificate is issued upon request for employment purposes.`;

    const lines = doc.splitTextToSize(content, 180);
    doc.text(lines, 15, 82);
    
    addHRSignature(doc, 180);
    
    return doc;
  };

  const handleDownload = (letter: ExperienceLetter) => {
    const doc = generatePDF(letter);
    doc.save(`experience_letter_${letter.employee.replace(/\s+/g, '_')}.pdf`);
    toast({
      title: "Downloaded",
      description: `Experience letter for ${letter.employee} downloaded successfully.`
    });
  };

  const handleView = (letter: ExperienceLetter) => {
    setSelectedLetter(letter);
    setShowViewDialog(true);
  };

  const handleSend = (letter: ExperienceLetter) => {
    setLetters(letters.map(l => 
      l.id === letter.id ? { ...l, status: "Sent" } : l
    ));
    toast({
      title: "Letter Sent",
      description: `Experience letter sent to ${letter.employee} successfully.`
    });
  };

  const calculateTenure = (joinDate: string, lastDay: string) => {
    const join = new Date(joinDate);
    const last = new Date(lastDay);
    const years = last.getFullYear() - join.getFullYear();
    const months = last.getMonth() - join.getMonth();
    
    let totalMonths = years * 12 + months;
    const tenureYears = Math.floor(totalMonths / 12);
    const tenureMonths = totalMonths % 12;
    
    if (tenureYears > 0 && tenureMonths > 0) {
      return `${tenureYears} year${tenureYears > 1 ? 's' : ''} ${tenureMonths} month${tenureMonths > 1 ? 's' : ''}`;
    } else if (tenureYears > 0) {
      return `${tenureYears} year${tenureYears > 1 ? 's' : ''}`;
    } else {
      return `${tenureMonths} month${tenureMonths > 1 ? 's' : ''}`;
    }
  };

  const handleGenerate = (letterId?: number) => {
    if (letterId) {
      setLetters(letters.map(l => 
        l.id === letterId ? { ...l, status: "Generated" } : l
      ));
      toast({
        title: "Letter Generated",
        description: "Experience letter generated successfully."
      });
    } else {
      if (!formData.employee || !formData.position || !formData.department || !formData.joinDate || !formData.lastDay) {
        toast({
          title: "Error",
          description: "Please fill in all required fields.",
          variant: "destructive"
        });
        return;
      }
      
      const tenure = calculateTenure(formData.joinDate, formData.lastDay);
      const formattedLastDay = new Date(formData.lastDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const formattedJoinDate = new Date(formData.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      const newLetter: ExperienceLetter = {
        id: letters.length + 1,
        employee: formData.employee,
        position: formData.position,
        department: formData.department,
        tenure: tenure,
        lastDay: formattedLastDay,
        joinDate: formattedJoinDate,
        status: "Generated"
      };
      setLetters([...letters, newLetter]);
      setShowGenerateDialog(false);
      setFormData({ employee: "", position: "", department: "", joinDate: "", lastDay: "" });
      toast({
        title: "Letter Generated",
        description: `Experience letter for ${formData.employee} generated successfully.`
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Experience Letters</h1>
            <p className="text-slate-500 mt-1">Generate experience and relieving letters</p>
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
                  <Award className="h-5 w-5 text-teal-600" />
                  Experience Letters
                </CardTitle>
                <CardDescription>Experience and relieving letters for exiting employees</CardDescription>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Tenure</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Last Day</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLetters.map((letter, index) => (
                    <tr key={letter.id} className="border-b hover:bg-slate-50" data-testid={`row-letter-${index}`}>
                      <td className="py-3 px-4 font-medium">{letter.employee}</td>
                      <td className="py-3 px-4">{letter.position}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.department}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.tenure}</td>
                      <td className="py-3 px-4 text-slate-600">{letter.lastDay}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(letter.status)}>{letter.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {letter.status !== "Pending" ? (
                            <>
                              <Button size="icon" variant="ghost" onClick={() => handleView(letter)} data-testid={`button-view-${index}`}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDownload(letter)} data-testid={`button-download-${index}`}>
                                <Download className="h-4 w-4" />
                              </Button>
                              {letter.status === "Generated" && (
                                <Button size="icon" variant="ghost" onClick={() => handleSend(letter)} data-testid={`button-send-${index}`}>
                                  <Send className="h-4 w-4" />
                                </Button>
                              )}
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
            <DialogTitle>Generate Experience Letter</DialogTitle>
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
              <Label>Position</Label>
              <Input 
                placeholder="Enter position"
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                data-testid="input-position"
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
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Product">Product</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Join Date</Label>
              <Input 
                type="date"
                value={formData.joinDate}
                onChange={(e) => setFormData({...formData, joinDate: e.target.value})}
                data-testid="input-join-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Last Working Day</Label>
              <Input 
                type="date"
                value={formData.lastDay}
                onChange={(e) => setFormData({...formData, lastDay: e.target.value})}
                data-testid="input-last-day"
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
            <DialogTitle>Experience Letter - {selectedLetter?.employee}</DialogTitle>
          </DialogHeader>
          {selectedLetter && (
            <div className="space-y-4 py-4 bg-white p-6 border rounded-lg">
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold">EXPERIENCE CERTIFICATE</h2>
              </div>
              <p className="text-right">Date: {new Date().toLocaleDateString()}</p>
              <p className="font-semibold">TO WHOM IT MAY CONCERN</p>
              <p>
                This is to certify that <strong>{selectedLetter.employee}</strong> was employed with HRConnect as a <strong>{selectedLetter.position}</strong> in the <strong>{selectedLetter.department}</strong> department from <strong>{selectedLetter.joinDate}</strong> to <strong>{selectedLetter.lastDay}</strong>.
              </p>
              <p>
                During their tenure of <strong>{selectedLetter.tenure}</strong>, {selectedLetter.employee} demonstrated excellent professional skills, dedication, and commitment to their responsibilities.
              </p>
              <p>
                {selectedLetter.employee} performed their duties diligently and was a valuable member of our team. We found their work to be satisfactory and their conduct to be professional at all times.
              </p>
              <p>
                We wish {selectedLetter.employee} all the best in their future endeavors.
              </p>
              <p className="text-slate-500 italic">
                This certificate is issued upon request for employment purposes.
              </p>
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
