import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileSignature, Plus, Search, Send, Eye, Download, CheckCircle, Clock, XCircle, Edit, Loader2, X, Save, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addCompanyHeader, addWatermark, addHRSignature, addFooter, addDocumentDate, generateReferenceNumber, addReferenceNumber, COMPANY_NAME, COMPANY_ADDRESS } from "@/lib/pdf-utils";

interface OfferLetter {
  id: number;
  candidate: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  ctc: number;
  joiningDate: string;
  sentDate: string;
  status: "Accepted" | "Pending" | "Declined";
  offerDetails: string;
  reportingTo: string;
  location: string;
}

export default function OfferLettersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<OfferLetter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [offers, setOffers] = useState<OfferLetter[]>([
    { id: 1, candidate: "Rajesh Kumar", email: "rajesh.kumar@email.com", phone: "+91 9876543210", position: "Senior Developer", department: "Engineering", ctc: 1800000, joiningDate: "Feb 01, 2024", sentDate: "Jan 15, 2024", status: "Accepted", offerDetails: "Full-time position with standard benefits package including health insurance, PF, and annual bonus.", reportingTo: "Tech Lead", location: "Mumbai" },
    { id: 2, candidate: "Priya Sharma", email: "priya.sharma@email.com", phone: "+91 9876543211", position: "Marketing Manager", department: "Marketing", ctc: 1200000, joiningDate: "Feb 15, 2024", sentDate: "Jan 18, 2024", status: "Pending", offerDetails: "Full-time position with marketing leadership responsibilities and team management.", reportingTo: "Marketing Director", location: "Bangalore" },
    { id: 3, candidate: "Amit Singh", email: "amit.singh@email.com", phone: "+91 9876543212", position: "Sales Executive", department: "Sales", ctc: 800000, joiningDate: "Feb 20, 2024", sentDate: "Jan 20, 2024", status: "Pending", offerDetails: "Full-time sales role with performance-based incentives and travel allowance.", reportingTo: "Sales Manager", location: "Delhi" },
    { id: 4, candidate: "Sneha Patel", email: "sneha.patel@email.com", phone: "+91 9876543213", position: "HR Executive", department: "HR", ctc: 700000, joiningDate: "Feb 10, 2024", sentDate: "Jan 22, 2024", status: "Accepted", offerDetails: "Full-time HR role supporting recruitment, onboarding, and employee relations.", reportingTo: "HR Manager", location: "Mumbai" },
    { id: 5, candidate: "Vikram Malhotra", email: "vikram.m@email.com", phone: "+91 9876543214", position: "Finance Analyst", department: "Finance", ctc: 1000000, joiningDate: "Feb 05, 2024", sentDate: "Jan 10, 2024", status: "Declined", offerDetails: "Full-time finance role with budgeting and reporting responsibilities.", reportingTo: "Finance Manager", location: "Pune" },
  ]);

  const [formData, setFormData] = useState({
    candidate: "",
    email: "",
    phone: "",
    position: "",
    department: "",
    ctc: "",
    joiningDate: "",
    offerDetails: "",
    reportingTo: "",
    location: "",
  });

  const resetFormData = () => {
    setFormData({
      candidate: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      ctc: "",
      joiningDate: "",
      offerDetails: "",
      reportingTo: "",
      location: "",
    });
  };

  const offerStats = useMemo(() => {
    const totalOffers = offers.length;
    const accepted = offers.filter(o => o.status === "Accepted").length;
    const pending = offers.filter(o => o.status === "Pending").length;
    const declined = offers.filter(o => o.status === "Declined").length;
    
    return [
      { title: "Total Offers", value: totalOffers.toString(), icon: <FileSignature className="h-5 w-5" /> },
      { title: "Accepted", value: accepted.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "text-green-600 bg-green-50" },
      { title: "Pending", value: pending.toString(), icon: <Clock className="h-5 w-5" />, color: "text-yellow-600 bg-yellow-50" },
      { title: "Declined", value: declined.toString(), icon: <XCircle className="h-5 w-5" />, color: "text-red-600 bg-red-50" },
    ];
  }, [offers]);

  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offers;
    const query = searchQuery.toLowerCase();
    return offers.filter(
      offer => 
        offer.candidate.toLowerCase().includes(query) ||
        offer.position.toLowerCase().includes(query) ||
        offer.department.toLowerCase().includes(query)
    );
  }, [offers, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Declined": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const generateOfferLetterPDF = (offer: OfferLetter) => {
    const doc = new jsPDF();
    
    addWatermark(doc);
    addCompanyHeader(doc, { title: "OFFER LETTER", subtitle: "Employment Offer" });
    addFooter(doc);
    
    const refNumber = generateReferenceNumber("OFR");
    addReferenceNumber(doc, refNumber, 68);
    addDocumentDate(doc, offer.sentDate, 68);
    
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(`Dear ${offer.candidate},`, 15, 82);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const introText = `We are pleased to offer you the position of ${offer.position} in the ${offer.department} department at ${COMPANY_NAME}. After careful consideration of your qualifications and experience, we believe you would be a valuable addition to our team.`;
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 15, 92);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Position Details:", 15, 115);
    
    autoTable(doc, {
      startY: 120,
      head: [],
      body: [
        ['Position', offer.position],
        ['Department', offer.department],
        ['Location', offer.location],
        ['Reporting To', offer.reportingTo],
        ['Annual CTC', `Rs. ${offer.ctc.toLocaleString()}/-`],
        ['Expected Joining Date', offer.joiningDate],
      ],
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50, fillColor: [240, 240, 240] },
        1: { cellWidth: 120 },
      },
    });
    
    const tableEndY = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 180;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Additional Details:", 15, tableEndY + 12);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const detailsText = doc.splitTextToSize(offer.offerDetails, 180);
    doc.text(detailsText, 15, tableEndY + 20);
    
    doc.setFontSize(9);
    doc.text("This offer is subject to successful background verification and document verification.", 15, tableEndY + 35);
    doc.text("Please confirm your acceptance by signing and returning this letter.", 15, tableEndY + 42);
    
    doc.setFont("helvetica", "bold");
    doc.text("We look forward to having you on our team!", 15, tableEndY + 54);
    
    addHRSignature(doc, tableEndY + 65);
    
    doc.save(`Offer_Letter_${offer.candidate.replace(/\s+/g, '_')}.pdf`);
  };

  const handleCreateOffer = async () => {
    const ctcValue = parseInt(formData.ctc) || 0;
    
    if (!formData.candidate.trim() || !formData.email.trim() || !formData.position.trim() || !formData.department || ctcValue <= 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields. CTC must be a positive number.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const newOffer: OfferLetter = {
      id: Date.now(),
      candidate: formData.candidate.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      position: formData.position.trim(),
      department: formData.department,
      ctc: ctcValue,
      joiningDate: formData.joiningDate || "TBD",
      sentDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: "Pending",
      offerDetails: formData.offerDetails.trim() || "Full-time position with standard benefits package.",
      reportingTo: formData.reportingTo.trim() || "TBD",
      location: formData.location.trim() || "TBD",
    };

    setOffers(prev => [...prev, newOffer]);
    resetFormData();
    setShowCreateDialog(false);
    setIsSubmitting(false);

    toast({
      title: "Offer Letter Created",
      description: `Offer letter for ${newOffer.candidate} has been created successfully.`,
    });
  };

  const handleUpdateOffer = async () => {
    if (!selectedOffer) return;

    const ctcValue = parseInt(formData.ctc) || selectedOffer.ctc;
    
    if (!formData.candidate.trim() || !formData.email.trim() || !formData.position.trim() || !formData.department) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    setOffers(prev => prev.map(offer => 
      offer.id === selectedOffer.id 
        ? {
            ...offer,
            candidate: formData.candidate.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            position: formData.position.trim(),
            department: formData.department,
            ctc: ctcValue > 0 ? ctcValue : offer.ctc,
            joiningDate: formData.joiningDate || offer.joiningDate,
            offerDetails: formData.offerDetails.trim() || offer.offerDetails,
            reportingTo: formData.reportingTo.trim() || offer.reportingTo,
            location: formData.location.trim() || offer.location,
          }
        : offer
    ));

    setShowEditDialog(false);
    setIsSubmitting(false);
    resetFormData();

    toast({
      title: "Offer Letter Updated",
      description: `Offer letter for ${formData.candidate || selectedOffer.candidate} has been updated successfully.`,
    });
  };

  const handleViewOffer = (offer: OfferLetter) => {
    setSelectedOffer(offer);
    setShowViewDialog(true);
  };

  const handleEditOffer = (offer: OfferLetter) => {
    setSelectedOffer(offer);
    setFormData({
      candidate: offer.candidate,
      email: offer.email,
      phone: offer.phone,
      position: offer.position,
      department: offer.department,
      ctc: offer.ctc.toString(),
      joiningDate: offer.joiningDate,
      offerDetails: offer.offerDetails,
      reportingTo: offer.reportingTo,
      location: offer.location,
    });
    setShowEditDialog(true);
  };

  const handleDownloadOffer = (offer: OfferLetter) => {
    generateOfferLetterPDF(offer);
    toast({
      title: "Offer Letter Downloaded",
      description: `Offer letter for ${offer.candidate} has been downloaded.`,
    });
  };

  const handleResendOffer = async (offer: OfferLetter) => {
    toast({
      title: "Offer Letter Resent",
      description: `Offer letter has been resent to ${offer.email}.`,
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Offer Letters</h1>
            <p className="text-slate-500 mt-1">Create and manage offer letters for candidates</p>
          </div>
          <Button className="gap-2" onClick={() => { resetFormData(); setShowCreateDialog(true); }} data-testid="button-create-offer">
            <Plus className="h-4 w-4" />
            Create Offer Letter
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {offerStats.map((stat, index) => (
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
                <CardTitle>Offer Letters</CardTitle>
                <CardDescription>All offer letters and their status</CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search candidate..."
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Candidate</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Position</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">CTC</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Sent Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOffers.map((offer, index) => (
                    <tr key={offer.id} className="border-b hover:bg-slate-50" data-testid={`row-offer-${index}`}>
                      <td className="py-3 px-4 font-medium">{offer.candidate}</td>
                      <td className="py-3 px-4 text-slate-600">{offer.position}</td>
                      <td className="py-3 px-4 text-slate-600">{offer.department}</td>
                      <td className="py-3 px-4 font-medium">Rs.{(offer.ctc / 100000).toFixed(1)} LPA</td>
                      <td className="py-3 px-4 text-slate-600">{offer.sentDate}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(offer.status)}>{offer.status}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => handleViewOffer(offer)} data-testid={`button-view-${index}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEditOffer(offer)} data-testid={`button-edit-${index}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDownloadOffer(offer)} data-testid={`button-download-${index}`}>
                            <Download className="h-4 w-4" />
                          </Button>
                          {offer.status === "Pending" && (
                            <Button size="icon" variant="ghost" onClick={() => handleResendOffer(offer)} data-testid={`button-resend-${index}`}>
                              <Send className="h-4 w-4" />
                            </Button>
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

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-teal-600" />
              Create Offer Letter
            </DialogTitle>
            <DialogDescription>Fill in the candidate details to create a new offer letter</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidate Name *</Label>
              <Input
                id="candidate"
                placeholder="Enter full name"
                value={formData.candidate}
                onChange={(e) => setFormData(prev => ({ ...prev, candidate: e.target.value }))}
                data-testid="input-candidate-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="candidate@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="input-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                placeholder="e.g., Senior Developer"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                data-testid="input-position"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
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
              <Label htmlFor="ctc">Annual CTC (Rs.) *</Label>
              <Input
                id="ctc"
                type="number"
                placeholder="e.g., 1200000"
                value={formData.ctc}
                onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                data-testid="input-ctc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="joiningDate">Expected Joining Date</Label>
              <Input
                id="joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                data-testid="input-joining-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reportingTo">Reporting To</Label>
              <Input
                id="reportingTo"
                placeholder="e.g., Tech Lead"
                value={formData.reportingTo}
                onChange={(e) => setFormData(prev => ({ ...prev, reportingTo: e.target.value }))}
                data-testid="input-reporting-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g., Mumbai"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-location"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="offerDetails">Additional Offer Details</Label>
              <Textarea
                id="offerDetails"
                placeholder="Enter any additional details about the offer..."
                value={formData.offerDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, offerDetails: e.target.value }))}
                rows={3}
                data-testid="textarea-offer-details"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button onClick={handleCreateOffer} disabled={isSubmitting} data-testid="button-submit-create">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Offer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              Offer Letter Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedOffer && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{selectedOffer.candidate}</h3>
                  <p className="text-slate-500">{selectedOffer.email}</p>
                </div>
                <Badge className={getStatusColor(selectedOffer.status)}>{selectedOffer.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Position</p>
                  <p className="font-medium">{selectedOffer.position}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Department</p>
                  <p className="font-medium">{selectedOffer.department}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Annual CTC</p>
                  <p className="font-medium">Rs. {selectedOffer.ctc.toLocaleString()}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Joining Date</p>
                  <p className="font-medium">{selectedOffer.joiningDate}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium">{selectedOffer.location}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">Reporting To</p>
                  <p className="font-medium">{selectedOffer.reportingTo}</p>
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500 mb-2">Offer Details</p>
                <p className="text-slate-700">{selectedOffer.offerDetails}</p>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-sm text-slate-500">Sent on: {selectedOffer.sentDate}</p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleEditOffer(selectedOffer)} data-testid="button-edit-from-view">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button onClick={() => handleDownloadOffer(selectedOffer)} data-testid="button-download-from-view">
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-600" />
              Edit Offer Letter
            </DialogTitle>
            <DialogDescription>Update the offer letter details</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-candidate">Candidate Name</Label>
              <Input
                id="edit-candidate"
                value={formData.candidate}
                onChange={(e) => setFormData(prev => ({ ...prev, candidate: e.target.value }))}
                data-testid="input-edit-candidate"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                data-testid="input-edit-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                data-testid="input-edit-phone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-position">Position</Label>
              <Input
                id="edit-position"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                data-testid="input-edit-position"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-department">Department</Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger data-testid="select-edit-department">
                  <SelectValue />
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
              <Label htmlFor="edit-ctc">Annual CTC (Rs.)</Label>
              <Input
                id="edit-ctc"
                type="number"
                value={formData.ctc}
                onChange={(e) => setFormData(prev => ({ ...prev, ctc: e.target.value }))}
                data-testid="input-edit-ctc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-joiningDate">Expected Joining Date</Label>
              <Input
                id="edit-joiningDate"
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                data-testid="input-edit-joining-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-reportingTo">Reporting To</Label>
              <Input
                id="edit-reportingTo"
                value={formData.reportingTo}
                onChange={(e) => setFormData(prev => ({ ...prev, reportingTo: e.target.value }))}
                data-testid="input-edit-reporting-to"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                data-testid="input-edit-location"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-offerDetails">Additional Offer Details</Label>
              <Textarea
                id="edit-offerDetails"
                value={formData.offerDetails}
                onChange={(e) => setFormData(prev => ({ ...prev, offerDetails: e.target.value }))}
                rows={3}
                data-testid="textarea-edit-offer-details"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdateOffer} disabled={isSubmitting} data-testid="button-submit-edit">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
