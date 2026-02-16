import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Award, Plus, Search, Download, CheckCircle, Clock, AlertCircle, Filter, Eye, Edit, Trash2, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function CertificationsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  const [formData, setFormData] = useState({
    employee: "",
    certification: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    credentialId: ""
  });

  const [certifications, setCertifications] = useState([
    { id: 1, employee: "John Doe", certification: "AWS Solutions Architect", issuer: "Amazon", issueDate: "Jan 2023", expiryDate: "Jan 2026", status: "Active", credentialId: "AWS-SA-12345" },
    { id: 2, employee: "Jane Smith", certification: "Google Analytics", issuer: "Google", issueDate: "Mar 2023", expiryDate: "Mar 2024", status: "Expiring Soon", credentialId: "GA-78901" },
    { id: 3, employee: "Mike Johnson", certification: "PMP", issuer: "PMI", issueDate: "Jun 2022", expiryDate: "Jun 2025", status: "Active", credentialId: "PMP-456789" },
    { id: 4, employee: "Sarah Wilson", certification: "SHRM-CP", issuer: "SHRM", issueDate: "Sep 2021", expiryDate: "Sep 2024", status: "Active", credentialId: "SHRM-123456" },
    { id: 5, employee: "Tom Brown", certification: "CFA Level 1", issuer: "CFA Institute", issueDate: "Dec 2020", expiryDate: "Dec 2023", status: "Expired", credentialId: "CFA-789012" },
  ]);

  const certStats = [
    { title: "Total Certifications", value: certifications.length.toString(), icon: <Award className="h-5 w-5" /> },
    { title: "Active", value: certifications.filter(c => c.status === "Active").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { title: "Expiring Soon", value: certifications.filter(c => c.status === "Expiring Soon").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400" },
    { title: "Expired", value: certifications.filter(c => c.status === "Expired").length.toString(), icon: <AlertCircle className="h-5 w-5" />, color: "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" },
  ];

  const filteredCertifications = certifications.filter(cert => {
    const matchesSearch = cert.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cert.certification.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cert.issuer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || cert.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active": return "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300";
      case "Expiring Soon": return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300";
      case "Expired": return "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleAddCert = () => {
    if (!formData.employee || !formData.certification || !formData.issuer) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const newCert = {
      id: certifications.length + 1,
      employee: formData.employee,
      certification: formData.certification,
      issuer: formData.issuer,
      issueDate: formData.issueDate,
      expiryDate: formData.expiryDate,
      status: "Active",
      credentialId: formData.credentialId
    };
    setCertifications([...certifications, newCert]);
    setShowAddDialog(false);
    resetForm();
    toast({ title: "Success", description: "Certification added successfully" });
  };

  const handleEditCert = () => {
    if (!selectedCert) return;
    const updatedCerts = certifications.map(cert =>
      cert.id === selectedCert.id ? {
        ...cert,
        employee: formData.employee,
        certification: formData.certification,
        issuer: formData.issuer,
        issueDate: formData.issueDate,
        expiryDate: formData.expiryDate,
        credentialId: formData.credentialId
      } : cert
    );
    setCertifications(updatedCerts);
    setShowEditDialog(false);
    resetForm();
    toast({ title: "Success", description: "Certification updated successfully" });
  };

  const handleDeleteCert = () => {
    if (!selectedCert) return;
    setCertifications(certifications.filter(c => c.id !== selectedCert.id));
    setShowDeleteDialog(false);
    setSelectedCert(null);
    toast({ title: "Success", description: "Certification deleted successfully" });
  };

  const handleRenewCert = () => {
    if (!selectedCert) return;
    const updatedCerts = certifications.map(cert =>
      cert.id === selectedCert.id ? { ...cert, status: "Active", expiryDate: formData.expiryDate || cert.expiryDate } : cert
    );
    setCertifications(updatedCerts);
    setShowRenewDialog(false);
    setSelectedCert(null);
    toast({ title: "Success", description: "Certification renewed successfully" });
  };

  const handleDownloadCert = (cert: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Certificate of Completion", 105, 30, { align: "center" });
    doc.setFontSize(14);
    doc.text(`This is to certify that`, 105, 60, { align: "center" });
    doc.setFontSize(18);
    doc.text(cert.employee, 105, 75, { align: "center" });
    doc.setFontSize(14);
    doc.text(`has successfully completed`, 105, 95, { align: "center" });
    doc.setFontSize(16);
    doc.text(cert.certification, 105, 110, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Issued by: ${cert.issuer}`, 105, 135, { align: "center" });
    doc.text(`Issue Date: ${cert.issueDate}`, 105, 145, { align: "center" });
    doc.text(`Expiry Date: ${cert.expiryDate}`, 105, 155, { align: "center" });
    doc.text(`Credential ID: ${cert.credentialId}`, 105, 165, { align: "center" });
    doc.save(`${cert.employee}-${cert.certification}.pdf`);
    toast({ title: "Success", description: "Certificate downloaded" });
  };

  const handleExportAll = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Certifications Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);
    doc.text(`Total Certifications: ${certifications.length}`, 20, 40);

    let yPos = 60;
    filteredCertifications.forEach((cert, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(12);
      doc.text(`${index + 1}. ${cert.employee} - ${cert.certification}`, 20, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text(`   Issuer: ${cert.issuer} | Status: ${cert.status} | Expires: ${cert.expiryDate}`, 20, yPos);
      yPos += 10;
    });

    doc.save("certifications-report.pdf");
    toast({ title: "Success", description: "Report exported successfully" });
  };

  const resetForm = () => {
    setFormData({ employee: "", certification: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "" });
  };

  const openEditDialog = (cert: any) => {
    setSelectedCert(cert);
    setFormData({
      employee: cert.employee,
      certification: cert.certification,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      credentialId: cert.credentialId
    });
    setShowEditDialog(true);
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Certifications</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track employee certifications and renewals</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleExportAll} data-testid="button-export">
              <Download className="h-4 w-4" />
              Export Report
            </Button>
            <Button className="gap-2" data-testid="button-add-cert" onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="h-4 w-4" />
              Add Certification
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {certStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
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
                  Employee Certifications
                </CardTitle>
                <CardDescription>All certifications and their validity status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-slate-700">
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Certification</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Issuer</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Issue Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Expiry Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertifications.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-slate-500">No certifications found</td></tr>
                  ) : (
                    filteredCertifications.map((cert, index) => (
                      <tr key={cert.id} className="border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50" data-testid={`row-cert-${index}`}>
                        <td className="py-3 px-4 font-medium">{cert.employee}</td>
                        <td className="py-3 px-4">{cert.certification}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{cert.issuer}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{cert.issueDate}</td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{cert.expiryDate}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" data-testid={`button-view-${index}`} onClick={() => { setSelectedCert(cert); setShowViewDialog(true); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" data-testid={`button-edit-${index}`} onClick={() => openEditDialog(cert)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" data-testid={`button-download-${index}`} onClick={() => handleDownloadCert(cert)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {(cert.status === "Expired" || cert.status === "Expiring Soon") && (
                              <Button size="icon" variant="ghost" data-testid={`button-renew-${index}`} onClick={() => { setSelectedCert(cert); setShowRenewDialog(true); }}>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" data-testid={`button-delete-${index}`} onClick={() => { setSelectedCert(cert); setShowDeleteDialog(true); }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Certification Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Certification</DialogTitle>
            <DialogDescription>Record a new employee certification</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee Name *</Label>
              <Input value={formData.employee} onChange={(e) => setFormData({...formData, employee: e.target.value})} placeholder="Employee name" data-testid="input-employee" />
            </div>
            <div>
              <Label>Certification *</Label>
              <Input value={formData.certification} onChange={(e) => setFormData({...formData, certification: e.target.value})} placeholder="Certification name" data-testid="input-certification" />
            </div>
            <div>
              <Label>Issuer *</Label>
              <Input value={formData.issuer} onChange={(e) => setFormData({...formData, issuer: e.target.value})} placeholder="Issuing organization" data-testid="input-issuer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} data-testid="input-issue-date" />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} data-testid="input-expiry-date" />
              </div>
            </div>
            <div>
              <Label>Credential ID</Label>
              <Input value={formData.credentialId} onChange={(e) => setFormData({...formData, credentialId: e.target.value})} placeholder="Credential/Certificate ID" data-testid="input-credential-id" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddCert} data-testid="button-submit-cert">Add Certification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Certification Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedCert?.certification}</DialogTitle>
            <DialogDescription>Certification details</DialogDescription>
          </DialogHeader>
          {selectedCert && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{selectedCert.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={getStatusColor(selectedCert.status)}>{selectedCert.status}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Issuer</p>
                  <p className="font-medium">{selectedCert.issuer}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Credential ID</p>
                  <p className="font-medium">{selectedCert.credentialId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Issue Date</p>
                  <p className="font-medium">{selectedCert.issueDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Expiry Date</p>
                  <p className="font-medium">{selectedCert.expiryDate}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            <Button onClick={() => handleDownloadCert(selectedCert)}>Download</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Certification Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Certification</DialogTitle>
            <DialogDescription>Update certification details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee Name *</Label>
              <Input value={formData.employee} onChange={(e) => setFormData({...formData, employee: e.target.value})} data-testid="input-edit-employee" />
            </div>
            <div>
              <Label>Certification *</Label>
              <Input value={formData.certification} onChange={(e) => setFormData({...formData, certification: e.target.value})} data-testid="input-edit-certification" />
            </div>
            <div>
              <Label>Issuer *</Label>
              <Input value={formData.issuer} onChange={(e) => setFormData({...formData, issuer: e.target.value})} data-testid="input-edit-issuer" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input type="date" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Credential ID</Label>
              <Input value={formData.credentialId} onChange={(e) => setFormData({...formData, credentialId: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditCert} data-testid="button-update-cert">Update Certification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Renew Certification Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Renew Certification</DialogTitle>
            <DialogDescription>Renew "{selectedCert?.certification}" for {selectedCert?.employee}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>New Expiry Date</Label>
              <Input type="date" value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} data-testid="input-renew-date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>Cancel</Button>
            <Button onClick={handleRenewCert} data-testid="button-confirm-renew">Renew Certification</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Certification</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedCert?.certification}" for {selectedCert?.employee}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteCert} data-testid="button-confirm-delete">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
