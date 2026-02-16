import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Download, Eye, FileText, FileArchive, Upload, Award, FileCheck, Search } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Document {
  id: number;
  name: string;
  category: string;
  uploadedDate: string;
  size: string;
}

export default function MyDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { toast } = useToast();

  const [uploadData, setUploadData] = useState({
    name: "",
    category: "",
    file: null as File | null
  });

  const [documents, setDocuments] = useState<Document[]>([
    { id: 1, name: "Form 16 - FY 2022-23", category: "Tax Documents", uploadedDate: "Jun 15, 2023", size: "2.4 MB" },
    { id: 2, name: "Appointment Letter", category: "HR Letters", uploadedDate: "Jan 10, 2022", size: "856 KB" },
    { id: 3, name: "Salary Certificate", category: "HR Letters", uploadedDate: "Dec 5, 2023", size: "520 KB" },
    { id: 4, name: "Form 16 - FY 2021-22", category: "Tax Documents", uploadedDate: "Jun 12, 2022", size: "2.1 MB" },
    { id: 5, name: "AWS Certification", category: "Certificates", uploadedDate: "Mar 20, 2023", size: "1.2 MB" },
    { id: 6, name: "Employee Handbook", category: "Policies", uploadedDate: "Jan 1, 2022", size: "4.5 MB" },
    { id: 7, name: "Leave Policy", category: "Policies", uploadedDate: "Jan 1, 2024", size: "1.1 MB" },
  ]);

  const documentCategories = [
    { name: "Tax Documents", count: documents.filter(d => d.category === "Tax Documents").length, icon: <FileText className="h-5 w-5" /> },
    { name: "HR Letters", count: documents.filter(d => d.category === "HR Letters").length, icon: <FileArchive className="h-5 w-5" /> },
    { name: "Certificates", count: documents.filter(d => d.category === "Certificates").length, icon: <Award className="h-5 w-5" /> },
    { name: "Policies", count: documents.filter(d => d.category === "Policies").length, icon: <FileCheck className="h-5 w-5" /> },
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleView = (doc: Document) => {
    setSelectedDocument(doc);
    setShowViewDialog(true);
  };

  const handleDownload = (doc: Document) => {
    toast({
      title: "Downloaded",
      description: `${doc.name} downloaded successfully.`
    });
  };

  const handleUpload = () => {
    if (!uploadData.name || !uploadData.category || !uploadData.file) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const newDoc: Document = {
      id: documents.length + 1,
      name: uploadData.name,
      category: uploadData.category,
      uploadedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      size: `${(uploadData.file.size / 1024).toFixed(0)} KB`
    };

    setDocuments([...documents, newDoc]);
    setShowUploadDialog(false);
    setUploadData({ name: "", category: "", file: null });
    toast({
      title: "Uploaded",
      description: `${uploadData.name} uploaded successfully.`
    });
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(selectedCategory === category ? "all" : category);
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">My Documents</h1>
            <p className="text-slate-500 mt-1">Access and download your personal documents</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => setShowUploadDialog(true)} data-testid="button-upload">
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {documentCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`hover-elevate cursor-pointer ${selectedCategory === category.name ? 'ring-2 ring-teal-500' : ''}`} 
                onClick={() => handleCategoryClick(category.name)}
                data-testid={`card-category-${index}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-lg bg-teal-50 text-teal-600">
                      {category.icon}
                    </div>
                    <Badge variant="secondary">{category.count} files</Badge>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{category.name}</h3>
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
                  <FileArchive className="h-5 w-5 text-teal-600" />
                  All Documents
                </CardTitle>
                <CardDescription>Your personal and company documents</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40" data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Tax Documents">Tax Documents</SelectItem>
                    <SelectItem value="HR Letters">HR Letters</SelectItem>
                    <SelectItem value="Certificates">Certificates</SelectItem>
                    <SelectItem value="Policies">Policies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDocuments.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  data-testid={`row-document-${index}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-white border">
                      <FileText className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{doc.name}</p>
                      <p className="text-sm text-slate-500">{doc.category} • {doc.uploadedDate} • {doc.size}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleView(doc)} data-testid={`button-view-${index}`}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} data-testid={`button-download-${index}`}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
              {filteredDocuments.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  No documents found matching your criteria.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Document Name</Label>
              <Input 
                placeholder="Enter document name"
                value={uploadData.name}
                onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                data-testid="input-doc-name"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={uploadData.category} onValueChange={(v) => setUploadData({...uploadData, category: v})}>
                <SelectTrigger data-testid="select-doc-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tax Documents">Tax Documents</SelectItem>
                  <SelectItem value="HR Letters">HR Letters</SelectItem>
                  <SelectItem value="Certificates">Certificates</SelectItem>
                  <SelectItem value="Policies">Policies</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input 
                type="file"
                onChange={(e) => setUploadData({...uploadData, file: e.target.files?.[0] || null})}
                data-testid="input-file"
              />
              <p className="text-sm text-slate-500">Supported: PDF, DOC, DOCX, JPG, PNG. Max: 10MB</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
          </DialogHeader>
          {selectedDocument && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-lg bg-slate-100">
                  <FileText className="h-8 w-8 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedDocument.name}</p>
                  <Badge variant="secondary">{selectedDocument.category}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Uploaded Date</p>
                  <p className="font-medium">{selectedDocument.uploadedDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">File Size</p>
                  <p className="font-medium">{selectedDocument.size}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedDocument && (
              <Button onClick={() => handleDownload(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
