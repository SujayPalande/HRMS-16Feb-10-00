import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Calendar, FileBarChart, Scale, CheckCircle, AlertTriangle, Clock, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ComplianceReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState("January 2024");
  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const months = [
    "January 2025", "December 2024", "November 2024", "October 2024", 
    "September 2024", "August 2024", "July 2024", "June 2024",
    "May 2024", "April 2024", "March 2024", "February 2024", "January 2024",
    "December 2023", "November 2023", "October 2023"
  ];

  const allReports = [
    { name: "PF Monthly Return", type: "ECR", dueDate: "15th of next month", status: "Submitted", lastGenerated: "Jan 10, 2024", month: "January 2024" },
    { name: "ESI Monthly Return", type: "ESI Challan", dueDate: "15th of next month", status: "Pending", lastGenerated: "Dec 12, 2023", month: "January 2024" },
    { name: "Professional Tax", type: "PT Challan", dueDate: "End of month", status: "Submitted", lastGenerated: "Jan 5, 2024", month: "January 2024" },
    { name: "TDS Quarterly Return", type: "24Q", dueDate: "15th of quarter end", status: "Upcoming", lastGenerated: "Oct 15, 2023", month: "January 2024" },
    { name: "Form 16", type: "Annual", dueDate: "June 15", status: "Not Due", lastGenerated: "Jun 10, 2023", month: "January 2024" },
    { name: "MLWF (Maharashtra Labour Welfare Fund)", type: "MLWF", dueDate: "Half-yearly (Jun/Dec)", status: "Submitted", lastGenerated: "Dec 31, 2023", month: "January 2024" },
    { name: "PF Monthly Return", type: "ECR", dueDate: "15th of next month", status: "Submitted", lastGenerated: "Dec 10, 2023", month: "December 2023" },
    { name: "ESI Monthly Return", type: "ESI Challan", dueDate: "15th of next month", status: "Submitted", lastGenerated: "Dec 12, 2023", month: "December 2023" },
    { name: "Professional Tax", type: "PT Challan", dueDate: "End of month", status: "Submitted", lastGenerated: "Dec 28, 2023", month: "December 2023" },
    { name: "TDS Quarterly Return", type: "24Q", dueDate: "15th of quarter end", status: "Submitted", lastGenerated: "Dec 15, 2023", month: "December 2023" },
    { name: "Form 16", type: "Annual", dueDate: "June 15", status: "Not Due", lastGenerated: "Jun 10, 2023", month: "December 2023" },
    { name: "MLWF (Maharashtra Labour Welfare Fund)", type: "MLWF", dueDate: "Half-yearly (Jun/Dec)", status: "Submitted", lastGenerated: "Dec 31, 2023", month: "December 2023" },
    { name: "PF Monthly Return", type: "ECR", dueDate: "15th of next month", status: "Submitted", lastGenerated: "Nov 10, 2023", month: "November 2023" },
    { name: "ESI Monthly Return", type: "ESI Challan", dueDate: "15th of next month", status: "Pending", lastGenerated: "Oct 15, 2023", month: "November 2023" },
    { name: "Professional Tax", type: "PT Challan", dueDate: "End of month", status: "Submitted", lastGenerated: "Nov 28, 2023", month: "November 2023" },
    { name: "TDS Quarterly Return", type: "24Q", dueDate: "15th of quarter end", status: "Not Due", lastGenerated: "Oct 15, 2023", month: "November 2023" },
    { name: "Form 16", type: "Annual", dueDate: "June 15", status: "Not Due", lastGenerated: "Jun 10, 2023", month: "November 2023" },
    { name: "MLWF (Maharashtra Labour Welfare Fund)", type: "MLWF", dueDate: "Half-yearly (Jun/Dec)", status: "Not Due", lastGenerated: "Jun 30, 2023", month: "November 2023" },
  ];

  const reports = useMemo(() => {
    return allReports.filter(r => r.month === selectedMonth);
  }, [selectedMonth]);

  const stats = useMemo(() => {
    const submitted = reports.filter(r => r.status === "Submitted").length;
    const pending = reports.filter(r => r.status === "Pending").length;
    const upcoming = reports.filter(r => r.status === "Upcoming").length;
    return { submitted, pending, upcoming };
  }, [reports]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Submitted": return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Pending": return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "Upcoming": return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Upcoming": return "bg-blue-100 text-blue-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const generateReportPDF = (report: typeof reports[0]) => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
    
    doc.setFillColor(0, 128, 128);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.text(report.name, 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`Type: ${report.type} | Period: ${selectedMonth}`, 105, 25, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 45);
    doc.text(`Due Date: ${report.dueDate}`, 14, 52);
    doc.text(`Status: ${report.status}`, 14, 59);
    
    doc.setFontSize(14);
    doc.text("Organization Details", 14, 75);
    doc.setDrawColor(0, 128, 128);
    doc.line(14, 78, 196, 78);
    
    autoTable(doc, {
      startY: 82,
      head: [],
      body: [
        ['Organization Name', 'HRMS Connect Pvt. Ltd.'],
        ['Establishment Code', 'MHPUN0012345'],
        ['PF Registration No.', 'MH/PUN/12345'],
        ['ESI Registration No.', 'MH/ESI/67890'],
        ['PT Registration No.', 'PT/MH/11111'],
        ['Address', '123 Business Park, Pune, Maharashtra 411001'],
      ],
      theme: 'grid',
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 110 },
      },
    });
    
    const orgEndY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 140;
    
    doc.setFontSize(14);
    doc.text("Contribution Summary", 14, orgEndY + 15);
    doc.line(14, orgEndY + 18, 196, orgEndY + 18);
    
    if (report.type === "ECR") {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['Particulars', 'Employee Share', 'Employer Share', 'Total']],
        body: [
          ['EPF (12% + 3.67%)', '₹1,24,500', '₹1,24,500', '₹2,49,000'],
          ['EPS (8.33%)', '-', '₹86,500', '₹86,500'],
          ['EDLI (0.5%)', '-', '₹5,200', '₹5,200'],
          ['Admin Charges (0.5%)', '-', '₹5,200', '₹5,200'],
          ['Total', '₹1,24,500', '₹2,21,400', '₹3,45,900'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    } else if (report.type === "ESI Challan") {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['Particulars', 'Employee (0.75%)', 'Employer (3.25%)', 'Total']],
        body: [
          ['ESI Contribution', '₹8,625', '₹37,375', '₹46,000'],
          ['No. of Employees', '23', '23', '-'],
          ['Total Wages', '₹11,50,000', '-', '-'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    } else if (report.type === "PT Challan") {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['State', 'No. of Employees', 'PT Amount']],
        body: [
          ['Maharashtra', '85', '₹17,000'],
          ['Karnataka', '32', '₹5,600'],
          ['Gujarat', '28', '₹4,200'],
          ['Total', '145', '₹26,800'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    } else if (report.type === "24Q") {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['Quarter', 'Total Employees', 'Total TDS Deducted']],
        body: [
          ['Q1 (Apr-Jun)', '142', '₹12,45,000'],
          ['Q2 (Jul-Sep)', '148', '₹13,20,000'],
          ['Q3 (Oct-Dec)', '156', '₹14,50,000'],
          ['Total', '-', '₹40,15,000'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    } else if (report.type === "MLWF") {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['Period', 'Employee Contribution (₹25)', 'Employer Contribution (₹75)', 'Total']],
        body: [
          ['June (Half-yearly)', '₹25 per employee', '₹75 per employee', '₹100 per employee'],
          ['December (Half-yearly)', '₹25 per employee', '₹75 per employee', '₹100 per employee'],
          ['Annual Total (per employee)', '₹50', '₹150', '₹200'],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    } else {
      autoTable(doc, {
        startY: orgEndY + 22,
        head: [['Particulars', 'Details']],
        body: [
          ['Report Type', report.type],
          ['Period', selectedMonth],
          ['Due Date', report.dueDate],
          ['Status', report.status],
          ['Last Generated', report.lastGenerated],
        ],
        theme: 'striped',
        headStyles: { fillColor: [0, 128, 128] },
        styles: { fontSize: 10 },
      });
    }
    
    const tableEndY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 200;
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("This is a computer-generated report and does not require a signature.", 105, tableEndY + 20, { align: 'center' });
    doc.text("Please verify all details before submission to the respective authorities.", 105, tableEndY + 27, { align: 'center' });
    
    doc.save(`${report.name.replace(/\s+/g, '_')}_${selectedMonth.replace(/\s+/g, '_')}.pdf`);
  };

  const handleGenerate = async (index: number) => {
    setGeneratingIndex(index);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const report = reports[index];
    generateReportPDF(report);
    
    toast({
      title: "Report Generated",
      description: `${report.name} for ${selectedMonth} has been generated and downloaded.`,
    });
    
    setGeneratingIndex(null);
  };

  const handleDownload = (report: typeof reports[0]) => {
    generateReportPDF(report);
    toast({
      title: "Report Downloaded",
      description: `${report.name} for ${selectedMonth} has been downloaded.`,
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Statutory Compliance Reports</h1>
            <p className="text-slate-500 mt-1">Generate and manage statutory compliance reports</p>
          </div>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-44" data-testid="select-month">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map(month => (
                <SelectItem key={month} value={month}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-700">{stats.submitted}</p>
                  <p className="text-sm text-green-600">Reports Submitted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                  <p className="text-sm text-yellow-600">Pending Submission</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-700">{stats.upcoming}</p>
                  <p className="text-sm text-blue-600">Upcoming Due</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-teal-600" />
              Compliance Reports
            </CardTitle>
            <CardDescription>All statutory reports and their submission status for {selectedMonth}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No reports available for {selectedMonth}
                </div>
              ) : (
                reports.map((report, index) => (
                  <motion.div
                    key={`${report.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    data-testid={`row-report-${index}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-white border">
                        <FileBarChart className="h-5 w-5 text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{report.name}</p>
                        <p className="text-sm text-slate-500">Type: {report.type} | Due: {report.dueDate}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="text-left sm:text-right">
                        <Badge className={getStatusColor(report.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {report.status}
                          </span>
                        </Badge>
                        <p className="text-xs text-slate-500 mt-1">Last: {report.lastGenerated}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1" 
                          onClick={() => handleGenerate(index)}
                          disabled={generatingIndex !== null}
                          data-testid={`button-generate-${index}`}
                        >
                          {generatingIndex === index ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              Generate
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="gap-1" 
                          onClick={() => handleDownload(report)}
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
