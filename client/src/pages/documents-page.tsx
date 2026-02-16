import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileArchive, Upload, Search, Download, Eye, FileText, Image, File, User, FolderOpen, X, CheckCircle2, Check, ChevronsUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";

interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: string;
  uploadedAt: string;
  employeeId: number;
  employeeName: string;
}

const documentTypeLabels: Record<string, string> = {
  id_proof: "ID Proof",
  certificate: "Certificate",
  offer_letter: "Offer Letter",
  photo: "Photo",
  bank_document: "Bank Document",
  educational: "Educational",
  experience_letter: "Experience Letter",
  other: "Other",
};

const categoryToTypes: Record<string, string[]> = {
  "ID Proofs": ["id_proof"],
  "Certificates": ["certificate", "educational", "experience_letter"],
  "Offer Letters": ["offer_letter"],
  "Photos": ["photo"],
};

const documentUploadSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  documentType: z.string().min(1, "Please select a document type"),
  documentName: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
});

type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<DocumentRecord | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: employees = [] } = useQuery<UserType[]>({
    queryKey: ['/api/employees'],
  });

  const form = useForm<DocumentUploadForm>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      employeeId: "",
      documentType: "",
      documentName: "",
      description: "",
    },
  });

  const allDocuments = useMemo((): DocumentRecord[] => {
    const docs: DocumentRecord[] = [];
    
    employees.forEach((employee) => {
      if (employee.documents && Array.isArray(employee.documents)) {
        employee.documents.forEach((docString) => {
          try {
            const doc = JSON.parse(docString);
            docs.push({
              id: doc.id || Date.now().toString(),
              name: doc.name || doc.fileName || "Untitled",
              type: doc.type || "other",
              description: doc.description || "",
              fileName: doc.fileName || "unknown",
              fileSize: doc.fileSize || 0,
              mimeType: doc.mimeType || "application/octet-stream",
              data: doc.data || "",
              uploadedAt: doc.uploadedAt || new Date().toISOString(),
              employeeId: employee.id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
            });
          } catch (e) {
            // Skip invalid JSON entries
          }
        });
      }
    });
    
    return docs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }, [employees]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "ID Proofs": 0,
      "Certificates": 0,
      "Offer Letters": 0,
      "Photos": 0,
    };
    
    allDocuments.forEach((doc) => {
      Object.entries(categoryToTypes).forEach(([category, types]) => {
        if (types.includes(doc.type)) {
          counts[category]++;
        }
      });
    });
    
    return counts;
  }, [allDocuments]);

  const filteredDocuments = useMemo(() => {
    let docs = allDocuments;
    
    if (selectedCategory && categoryToTypes[selectedCategory]) {
      docs = docs.filter((doc) => categoryToTypes[selectedCategory].includes(doc.type));
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      docs = docs.filter((doc) =>
        doc.name.toLowerCase().includes(query) ||
        doc.employeeName.toLowerCase().includes(query) ||
        doc.fileName.toLowerCase().includes(query) ||
        (documentTypeLabels[doc.type] || doc.type).toLowerCase().includes(query)
      );
    }
    
    return docs;
  }, [allDocuments, selectedCategory, searchQuery]);

  const documentCategories = [
    { name: "ID Proofs", icon: <FileText className="h-5 w-5" /> },
    { name: "Certificates", icon: <FileArchive className="h-5 w-5" /> },
    { name: "Offer Letters", icon: <File className="h-5 w-5" /> },
    { name: "Photos", icon: <Image className="h-5 w-5" /> },
  ];

  const documentTypes = [
    { value: "id_proof", label: "ID Proof (Aadhaar, PAN, etc.)" },
    { value: "certificate", label: "Certificate" },
    { value: "offer_letter", label: "Offer Letter" },
    { value: "photo", label: "Photo" },
    { value: "bank_document", label: "Bank Document" },
    { value: "educational", label: "Educational Document" },
    { value: "experience_letter", label: "Experience Letter" },
    { value: "other", label: "Other" },
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!form.getValues("documentName")) {
        form.setValue("documentName", file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-CA');
    } catch {
      return dateString;
    }
  };

  const handleDownload = (doc: DocumentRecord) => {
    if (doc.data) {
      const link = document.createElement('a');
      link.href = doc.data;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (doc: DocumentRecord) => {
    setViewDocument(doc);
  };

  const handleCategoryClick = (categoryName: string) => {
    if (selectedCategory === categoryName) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryName);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadForm) => {
      if (!selectedFile) {
        throw new Error("Please select a file to upload");
      }

      setIsUploading(true);

      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const base64Data = await base64Promise;

      const employee = employees.find(e => e.id.toString() === data.employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      const documentEntry = JSON.stringify({
        id: Date.now().toString(),
        name: data.documentName,
        type: data.documentType,
        description: data.description || "",
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        data: base64Data,
        uploadedAt: new Date().toISOString(),
      });

      const existingDocs = employee.documents || [];
      const updatedDocs = [...existingDocs, documentEntry];

      await apiRequest("PATCH", `/api/employees/${data.employeeId}`, {
        documents: updatedDocs,
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Document Uploaded",
        description: "The document has been successfully uploaded and saved.",
      });
      form.reset();
      setSelectedFile(null);
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const onSubmit = (data: DocumentUploadForm) => {
    uploadMutation.mutate(data);
  };

  // Show all employees in the dropdown (not just active ones)
  const allEmployeesList = employees.filter(e => e.firstName && e.lastName);
  const selectedEmployee = allEmployeesList.find(e => e.id.toString() === form.watch("employeeId"));

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Document Management</h1>
            <p className="text-slate-500 mt-1">Manage and organize employee documents</p>
          </div>
          
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg" 
            data-testid="button-upload-document"
          >
            <Upload className="h-4 w-4" />
            Upload Document
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-xl shadow-sm">
                    <Upload className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-900">Upload Document</DialogTitle>
                    <DialogDescription className="text-slate-600 mt-1">
                      Upload a new document for an employee
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border-2 border-slate-200 p-6 space-y-5"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                      <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-2 rounded-lg">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Employee & Document Details</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <FormField
                        control={form.control}
                        name="employeeId"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Select Employee *
                            </FormLabel>
                            <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={employeeSearchOpen}
                                    className={cn(
                                      "h-11 justify-between border-slate-300 hover:border-teal-500",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="select-employee"
                                  >
                                    {selectedEmployee
                                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName}`
                                      : "Type to search employee..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <Command>
                                  <CommandInput 
                                    placeholder="Search employee name..." 
                                    data-testid="input-employee-search"
                                  />
                                  <CommandList>
                                    <CommandEmpty>No employee found.</CommandEmpty>
                                    <CommandGroup>
                                      {allEmployeesList.map((employee) => (
                                        <CommandItem
                                          key={employee.id}
                                          value={`${employee.firstName} ${employee.lastName}`}
                                          onSelect={() => {
                                            form.setValue("employeeId", employee.id.toString());
                                            setEmployeeSearchOpen(false);
                                          }}
                                          data-testid={`option-employee-${employee.id}`}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              field.value === employee.id.toString()
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col">
                                            <span>{employee.firstName} {employee.lastName}</span>
                                            <span className="text-xs text-slate-500">
                                              {employee.employeeId || `EMP${employee.id}`}
                                            </span>
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Document Type *
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger 
                                  className="h-11 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                                  data-testid="select-document-type"
                                >
                                  <SelectValue placeholder="Select document type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {documentTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="documentName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Document Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter document name"
                              className="h-11 border-slate-300 focus:border-teal-500 focus:ring-teal-500"
                              data-testid="input-document-name"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700">
                            Description (Optional)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add a description for this document..."
                              className="min-h-[80px] border-slate-300 focus:border-teal-500 focus:ring-teal-500 resize-none"
                              data-testid="input-description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-r from-slate-50 via-white to-slate-50 rounded-xl border-2 border-slate-200 p-6 space-y-5"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                      <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-2 rounded-lg">
                        <FolderOpen className="w-4 h-4 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900">Upload File</h3>
                    </div>

                    <div className="space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.xls,.xlsx"
                        data-testid="input-file"
                      />

                      <AnimatePresence mode="wait">
                        {!selectedFile ? (
                          <motion.div
                            key="dropzone"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-all duration-200"
                            data-testid="dropzone"
                          >
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center">
                              <Upload className="w-8 h-8 text-slate-500" />
                            </div>
                            <p className="text-slate-700 font-medium mb-1">Click to upload a file</p>
                            <p className="text-sm text-slate-500">
                              Supports: PDF, DOC, DOCX, JPG, PNG, GIF, XLS, XLSX
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Maximum file size: 10MB</p>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="file-preview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-lg">
                                  <FileText className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{selectedFile.name}</p>
                                  <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-teal-600">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="text-sm font-medium">Ready</span>
                                </div>
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleRemoveFile}
                                  className="text-slate-500 hover:text-red-500"
                                  data-testid="button-remove-file"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 h-11 border-slate-300"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className="flex-1 h-11 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
                      data-testid="button-submit-upload"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Document
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
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
                className={cn(
                  "cursor-pointer transition-all duration-200",
                  selectedCategory === category.name 
                    ? "ring-2 ring-teal-500 bg-teal-50" 
                    : "hover-elevate"
                )}
                onClick={() => handleCategoryClick(category.name)}
                data-testid={`card-category-${category.name.toLowerCase().replace(' ', '-')}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className={cn(
                      "p-3 rounded-lg",
                      selectedCategory === category.name ? "bg-teal-100" : "bg-teal-50"
                    )}>
                      <div className="text-teal-600">{category.icon}</div>
                    </div>
                    <Badge variant={selectedCategory === category.name ? "default" : "secondary"}>
                      {categoryCounts[category.name]} files
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{category.name}</h3>
                  {selectedCategory === category.name && (
                    <p className="text-xs text-teal-600 mt-1">Click to clear filter</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle>
                  {selectedCategory ? `${selectedCategory}` : "Recent Documents"}
                </CardTitle>
                <CardDescription>
                  {selectedCategory 
                    ? `Showing ${filteredDocuments.length} documents in ${selectedCategory}`
                    : `${allDocuments.length} documents uploaded across all employees`}
                </CardDescription>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-documents"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No documents found</p>
                  <p className="text-sm mt-1">
                    {selectedCategory 
                      ? `No documents in ${selectedCategory} category`
                      : "Upload your first document to get started"}
                  </p>
                </div>
              ) : (
                filteredDocuments.map((doc, index) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    data-testid={`row-document-${doc.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-white border overflow-hidden flex items-center justify-center flex-shrink-0">
                        {doc.mimeType.startsWith('image/') && doc.data ? (
                          <img 
                            src={doc.data} 
                            alt={doc.name}
                            className="w-full h-full object-cover"
                          />
                        ) : doc.mimeType === 'application/pdf' ? (
                          <div className="bg-red-50 w-full h-full flex items-center justify-center">
                            <FileText className="h-6 w-6 text-red-500" />
                          </div>
                        ) : (
                          <FileText className="h-6 w-6 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{doc.name}</p>
                        <p className="text-sm text-slate-500">
                          {doc.employeeName} | {documentTypeLabels[doc.type] || doc.type} | {formatFileSize(doc.fileSize)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">{formatDate(doc.uploadedAt)}</span>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleView(doc)}
                        data-testid={`button-view-${doc.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleDownload(doc)}
                        data-testid={`button-download-${doc.id}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Document View Modal */}
        <Dialog open={!!viewDocument} onOpenChange={(open) => !open && setViewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-4 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-xl shadow-sm">
                  <Eye className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">
                    {viewDocument?.name || "Document Preview"}
                  </DialogTitle>
                  <DialogDescription className="text-slate-600 mt-1">
                    {viewDocument?.employeeName} | {viewDocument?.type && (documentTypeLabels[viewDocument.type] || viewDocument.type)}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="flex-1 overflow-auto p-4 min-h-[400px]">
              {viewDocument?.mimeType.startsWith('image/') && viewDocument.data ? (
                <div className="flex items-center justify-center h-full">
                  <img 
                    src={viewDocument.data} 
                    alt={viewDocument.name}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : viewDocument?.mimeType === 'application/pdf' && viewDocument.data ? (
                <iframe 
                  src={viewDocument.data} 
                  className="w-full h-[60vh] border rounded-lg"
                  title={viewDocument.name}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <FileText className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-medium">Preview not available for this file type</p>
                  <p className="text-sm mt-1">Click download to view the file</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 flex-shrink-0">
              <Button
                variant="outline"
                onClick={() => setViewDocument(null)}
              >
                Close
              </Button>
              {viewDocument && (
                <Button
                  onClick={() => handleDownload(viewDocument)}
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
