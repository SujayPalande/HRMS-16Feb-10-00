import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileArchive, Upload, Search, Eye, Download, CheckCircle, Clock, AlertCircle, FileText, Image, XCircle, Edit, Loader2, Save, Trash2, File } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  candidate: string;
  documentType: string;
  fileName: string;
  fileSize: string;
  submittedDate: string;
  status: "Verified" | "Under Review" | "Pending" | "Rejected" | "Not Started";
  notes: string;
  fileData?: string;
}

export default function RecruitmentDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const requiredDocs = [
    { name: "Aadhar Card", description: "Government ID proof", mandatory: true },
    { name: "PAN Card", description: "Tax identification", mandatory: true },
    { name: "Passport Photo", description: "Recent photograph", mandatory: true },
    { name: "Educational Certificates", description: "Highest qualification", mandatory: true },
    { name: "Previous Employment Letter", description: "Experience certificate", mandatory: false },
    { name: "Bank Details", description: "Salary account", mandatory: true },
    { name: "Address Proof", description: "Current residence", mandatory: true },
    { name: "Medical Certificate", description: "Fitness certificate", mandatory: false },
  ];

  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, candidate: "Sneha Patel", documentType: "Aadhar Card", fileName: "sneha_aadhar.pdf", fileSize: "1.2 MB", submittedDate: "Jan 25, 2024", status: "Verified", notes: "Document verified successfully." },
    { id: 2, candidate: "Sneha Patel", documentType: "PAN Card", fileName: "sneha_pan.pdf", fileSize: "856 KB", submittedDate: "Jan 25, 2024", status: "Verified", notes: "PAN verification complete." },
    { id: 3, candidate: "Rajesh Kumar", documentType: "Aadhar Card", fileName: "rajesh_aadhar.pdf", fileSize: "1.5 MB", submittedDate: "Jan 26, 2024", status: "Under Review", notes: "Document under verification process." },
    { id: 4, candidate: "Rajesh Kumar", documentType: "Passport Photo", fileName: "rajesh_photo.jpg", fileSize: "450 KB", submittedDate: "Jan 26, 2024", status: "Verified", notes: "Photo meets requirements." },
    { id: 5, candidate: "Priya Sharma", documentType: "Educational Certificates", fileName: "priya_degree.pdf", fileSize: "2.1 MB", submittedDate: "Jan 27, 2024", status: "Under Review", notes: "Awaiting verification." },
    { id: 6, candidate: "Amit Singh", documentType: "Bank Details", fileName: "amit_bank.pdf", fileSize: "520 KB", submittedDate: "Jan 28, 2024", status: "Rejected", notes: "Document is unclear. Please resubmit." },
  ]);

  const [pendingDocuments, setPendingDocuments] = useState([
    { id: 101, candidate: "Rajesh Kumar", document: "PAN Card", submittedDate: "-", status: "Pending" },
    { id: 102, candidate: "Rajesh Kumar", document: "Medical Certificate", submittedDate: "-", status: "Pending" },
    { id: 103, candidate: "Priya Sharma", document: "Previous Employment Letter", submittedDate: "-", status: "Pending" },
    { id: 104, candidate: "Priya Sharma", document: "Address Proof", submittedDate: "-", status: "Pending" },
    { id: 105, candidate: "Amit Singh", document: "All Documents", submittedDate: "-", status: "Not Started" },
  ]);

  const [uploadFormData, setUploadFormData] = useState({
    candidate: "",
    documentType: "",
    notes: "",
  });

  const resetUploadForm = () => {
    setUploadFormData({
      candidate: "",
      documentType: "",
      notes: "",
    });
    setSelectedFile(null);
  };

  const documentStats = useMemo(() => {
    const verified = documents.filter(d => d.status === "Verified").length;
    const underReview = documents.filter(d => d.status === "Under Review").length;
    const pending = pendingDocuments.filter(d => d.status === "Pending").length;
    const rejected = documents.filter(d => d.status === "Rejected").length;
    
    return { verified, underReview, pending, rejected };
  }, [documents, pendingDocuments]);

  const filteredDocuments = useMemo(() => {
    if (!searchQuery.trim()) return documents;
    const query = searchQuery.toLowerCase();
    return documents.filter(
      doc => 
        doc.candidate.toLowerCase().includes(query) ||
        doc.documentType.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query)
    );
  }, [documents, searchQuery]);

  const filteredPendingDocs = useMemo(() => {
    if (!searchQuery.trim()) return pendingDocuments;
    const query = searchQuery.toLowerCase();
    return pendingDocuments.filter(
      doc => 
        doc.candidate.toLowerCase().includes(query) ||
        doc.document.toLowerCase().includes(query)
    );
  }, [pendingDocuments, searchQuery]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified": return "bg-green-100 text-green-700";
      case "Under Review": return "bg-blue-100 text-blue-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Rejected": return "bg-red-100 text-red-700";
      case "Not Started": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadFormData.candidate || !uploadFormData.documentType || !selectedFile) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    let fileData = "";
    try {
      fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    } catch {
      toast({
        title: "Upload Failed",
        description: "Failed to read the file. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const newDocument: Document = {
      id: Date.now(),
      candidate: uploadFormData.candidate,
      documentType: uploadFormData.documentType,
      fileName: selectedFile.name,
      fileSize: selectedFile.size >= 1024 * 1024 
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(selectedFile.size / 1024).toFixed(1)} KB`,
      submittedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      status: "Under Review",
      notes: uploadFormData.notes || "Document submitted for verification.",
      fileData: fileData,
    };

    setDocuments(prev => [...prev, newDocument]);
    
    setPendingDocuments(prev => prev.filter(
      p => !(p.candidate === uploadFormData.candidate && p.document === uploadFormData.documentType)
    ));

    resetUploadForm();
    setShowUploadDialog(false);
    setIsSubmitting(false);

    toast({
      title: "Document Uploaded",
      description: `${newDocument.fileName} has been uploaded successfully.`,
    });
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleEditDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setUploadFormData({
      candidate: doc.candidate,
      documentType: doc.documentType,
      notes: doc.notes,
    });
    setShowEditDialog(true);
  };

  const handleUpdateDocument = async () => {
    if (!selectedDocument) return;

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    setDocuments(prev => prev.map(doc => 
      doc.id === selectedDocument.id 
        ? {
            ...doc,
            notes: uploadFormData.notes,
          }
        : doc
    ));

    setShowEditDialog(false);
    setIsSubmitting(false);
    resetUploadForm();

    toast({
      title: "Document Updated",
      description: "Document details have been updated successfully.",
    });
  };

  const handleDownloadDocument = (doc: Document) => {
    if (doc.fileData) {
      const a = document.createElement('a');
      a.href = doc.fileData;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const blob = new Blob([`Document Information\n\nFile: ${doc.fileName}\nCandidate: ${doc.candidate}\nDocument Type: ${doc.documentType}\nSubmitted: ${doc.submittedDate}\nStatus: ${doc.status}\n\nNotes: ${doc.notes}\n\n(Original file not available - this is a placeholder)`], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName.replace(/\.[^/.]+$/, '') + '_info.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    toast({
      title: "Document Downloaded",
      description: `${doc.fileName} has been downloaded.`,
    });
  };

  const handleVerifyDocument = async (doc: Document) => {
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: "Verified" as const, notes: "Document verified successfully." } : d
    ));

    toast({
      title: "Document Verified",
      description: `${doc.documentType} for ${doc.candidate} has been verified.`,
    });
  };

  const handleRejectDocument = async (doc: Document) => {
    setDocuments(prev => prev.map(d => 
      d.id === doc.id ? { ...d, status: "Rejected" as const, notes: "Document rejected. Please resubmit with clearer copy." } : d
    ));

    toast({
      title: "Document Rejected",
      description: `${doc.documentType} for ${doc.candidate} has been rejected.`,
      variant: "destructive",
    });
  };

  const handleDeleteDocument = async (doc: Document) => {
    setDocuments(prev => prev.filter(d => d.id !== doc.id));

    setPendingDocuments(prev => [...prev, {
      id: Date.now(),
      candidate: doc.candidate,
      document: doc.documentType,
      submittedDate: "-",
      status: "Pending",
    }]);

    toast({
      title: "Document Deleted",
      description: `${doc.fileName} has been removed.`,
    });
  };

  const uniqueCandidates = useMemo(() => {
    const candidates = new Set([
      ...documents.map(d => d.candidate),
      ...pendingDocuments.map(d => d.candidate),
    ]);
    return Array.from(candidates);
  }, [documents, pendingDocuments]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Document Portal</h1>
            <p className="text-slate-500 mt-1">Manage joining documents for new employees</p>
          </div>
          <div className="flex gap-3">
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
            <Button className="gap-2" onClick={() => { resetUploadForm(); setShowUploadDialog(true); }} data-testid="button-upload-document">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{documentStats.verified}</p>
                    <p className="text-xs text-slate-500">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{documentStats.underReview}</p>
                    <p className="text-xs text-slate-500">Under Review</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50 text-yellow-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{documentStats.pending}</p>
                    <p className="text-xs text-slate-500">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-50 text-red-600">
                    <XCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{documentStats.rejected}</p>
                    <p className="text-xs text-slate-500">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-teal-600" />
                Required Documents
              </CardTitle>
              <CardDescription>Checklist for new joinees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {requiredDocs.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                    data-testid={`row-required-doc-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="font-medium text-sm">{doc.name}</p>
                        <p className="text-xs text-slate-500">{doc.description}</p>
                      </div>
                    </div>
                    {doc.mandatory && (
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Document Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="submitted">
                <TabsList>
                  <TabsTrigger value="submitted" data-testid="tab-submitted">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submitted ({filteredDocuments.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" data-testid="tab-pending">
                    <Clock className="h-4 w-4 mr-2" />
                    Pending ({filteredPendingDocs.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="submitted" className="mt-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredDocuments.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No documents found
                      </div>
                    ) : (
                      filteredDocuments.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                          data-testid={`row-submitted-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-white">
                              {doc.fileName.endsWith('.jpg') || doc.fileName.endsWith('.png') ? (
                                <Image className="h-4 w-4 text-blue-500" />
                              ) : (
                                <File className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{doc.candidate}</p>
                              <p className="text-sm text-slate-500">{doc.documentType} - {doc.submittedDate}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                            <Button size="icon" variant="ghost" onClick={() => handleViewDocument(doc)} data-testid={`button-view-doc-${index}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDownloadDocument(doc)} data-testid={`button-download-doc-${index}`}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="pending" className="mt-4">
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {filteredPendingDocs.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">
                        No pending documents
                      </div>
                    ) : (
                      filteredPendingDocs.map((doc, index) => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50"
                          data-testid={`row-pending-${index}`}
                        >
                          <div>
                            <p className="font-medium">{doc.candidate}</p>
                            <p className="text-sm text-slate-500">{doc.document}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(doc.status)}>{doc.status}</Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setUploadFormData({ candidate: doc.candidate, documentType: doc.document, notes: "" });
                                setShowUploadDialog(true);
                              }}
                              data-testid={`button-upload-pending-${index}`}
                            >
                              <Upload className="h-3 w-3 mr-1" />
                              Upload
                            </Button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-teal-600" />
              Upload Document
            </DialogTitle>
            <DialogDescription>Upload a document for verification</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="candidate">Candidate Name *</Label>
              <Select value={uploadFormData.candidate} onValueChange={(value) => setUploadFormData(prev => ({ ...prev, candidate: value }))}>
                <SelectTrigger data-testid="select-candidate">
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueCandidates.map(candidate => (
                    <SelectItem key={candidate} value={candidate}>{candidate}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type *</Label>
              <Select value={uploadFormData.documentType} onValueChange={(value) => setUploadFormData(prev => ({ ...prev, documentType: value }))}>
                <SelectTrigger data-testid="select-document-type">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {requiredDocs.map(doc => (
                    <SelectItem key={doc.name} value={doc.name}>{doc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="file">Select File *</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-teal-500 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                  data-testid="input-file"
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <File className="h-8 w-8 text-teal-600" />
                    <div className="text-left">
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to select a file</p>
                    <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                  </>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this document..."
                value={uploadFormData.notes}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                data-testid="textarea-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)} data-testid="button-cancel-upload">
              Cancel
            </Button>
            <Button onClick={handleUploadDocument} disabled={isSubmitting} data-testid="button-submit-upload">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-teal-600" />
              Document Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-slate-100">
                    <File className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedDocument.fileName}</h3>
                    <p className="text-sm text-slate-500">{selectedDocument.fileSize}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(selectedDocument.status)}>{selectedDocument.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Candidate</p>
                  <p className="font-medium">{selectedDocument.candidate}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-xs text-slate-500">Document Type</p>
                  <p className="font-medium">{selectedDocument.documentType}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg col-span-2">
                  <p className="text-xs text-slate-500">Submitted Date</p>
                  <p className="font-medium">{selectedDocument.submittedDate}</p>
                </div>
              </div>
              
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">Notes</p>
                <p className="text-sm">{selectedDocument.notes}</p>
              </div>
              
              <div className="flex justify-between pt-4 border-t">
                <div className="flex gap-2">
                  {selectedDocument.status === "Under Review" && (
                    <>
                      <Button size="sm" onClick={() => handleVerifyDocument(selectedDocument)} className="bg-green-600 hover:bg-green-700" data-testid="button-verify">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Verify
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleRejectDocument(selectedDocument)} data-testid="button-reject">
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleEditDocument(selectedDocument)} data-testid="button-edit-doc">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" onClick={() => handleDownloadDocument(selectedDocument)} data-testid="button-download-doc">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteDocument(selectedDocument)} className="text-red-600 hover:text-red-700" data-testid="button-delete-doc">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-teal-600" />
              Edit Document
            </DialogTitle>
            <DialogDescription>Update document details</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-xs text-slate-500">File Name</p>
              <p className="font-medium">{selectedDocument?.fileName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Candidate</p>
                <p className="font-medium">{selectedDocument?.candidate}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500">Document Type</p>
                <p className="font-medium">{selectedDocument?.documentType}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={uploadFormData.notes}
                onChange={(e) => setUploadFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                data-testid="textarea-edit-notes"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button onClick={handleUpdateDocument} disabled={isSubmitting} data-testid="button-submit-edit">
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
