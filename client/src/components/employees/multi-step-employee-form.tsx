import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Department } from "@shared/schema";
import { Loader2, ChevronLeft, ChevronRight, CalendarIcon, User as UserIcon, Building2, CreditCard, Upload, X, FileText, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format, differenceInYears, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { ContactPopup } from "@/components/ui/contact-popup";

interface MultiStepEmployeeFormProps {
  employee?: User;
  departments: Department[];
  onSuccess: () => void;
}

export function MultiStepEmployeeForm({ employee, departments, onSuccess }: MultiStepEmployeeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!employee;
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(employee?.photoUrl || null);
  const [showContactPopup, setShowContactPopup] = useState(false);
  const [employeeLimitError, setEmployeeLimitError] = useState<any>(null);
  
  // Document upload state
  interface UploadedDocument {
    id: string;
    name: string;
    type: string;
    data: string;
    uploadedAt: string;
  }
  
  // Parse existing documents from employee data
  const parseExistingDocuments = (docs: string[] | null | undefined): UploadedDocument[] => {
    if (docs && Array.isArray(docs)) {
      try {
        return docs.map(doc => {
          // Handle both stringified JSON and already parsed objects
          if (typeof doc === 'string') {
            return JSON.parse(doc);
          }
          return doc;
        });
      } catch (e) {
        console.error('Error parsing documents:', e);
        return [];
      }
    }
    return [];
  };
  
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>(() => parseExistingDocuments(employee?.documents));
  
  // Update documents when employee prop changes (e.g., when form is reopened with fresh data)
  useEffect(() => {
    if (employee?.documents) {
      const parsedDocs = parseExistingDocuments(employee.documents);
      setUploadedDocuments(parsedDocs);
    }
  }, [employee?.id, employee?.documents]);
  const [viewingDocument, setViewingDocument] = useState<UploadedDocument | null>(null);
  // Fetch employees for reporting manager dropdown
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/employees");
        const data = await response.json();
        return data as User[];
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        return [];
      }
    },
  });
  
  // Create dynamic form schema based on editing state
  const formSchema = z.object({
    // Personal Information (Step 1)
    employeeId: z.string().optional(),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z.date().optional().refine((date) => {
      if (!date) return true; // Optional field
      const age = differenceInYears(new Date(), date);
      return age >= 20;
    }, {
      message: "Age must be more than 20"
    }),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    maritalStatus: z.enum(['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say']).optional(),
    photoUrl: z.string().optional(),
    
    // Company Details (Step 2)
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: isEditing 
      ? z.string().optional()
      : z.string().min(6, "Password must be at least 6 characters"),
    role: z.enum(['admin', 'hr', 'manager', 'employee', 'developer']),
    departmentId: z.number().nullable(),
    position: z.string().optional(),
    joinDate: z.date().optional(),
    workLocation: z.string().optional(),
    reportingTo: z.number().nullable(),
    salary: z.number().min(1, "Salary must be greater than 0").optional(),
    
    // Bank Information (Step 3)
    bankAccountNumber: z.string().optional(),
    bankAccountHolderName: z.string().optional(),
    bankName: z.string().optional(),
    bankIFSCCode: z.string().optional(),
    bankAccountType: z.enum(['savings', 'current', 'salary']).optional(),
    aadhaarCard: z.string().optional(),
    panCard: z.string().optional(),
    documents: z.array(z.string()).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: employee?.id?.toString() || "",
      firstName: employee?.firstName || "",
      lastName: employee?.lastName || "",
      email: employee?.email || "",
      phoneNumber: employee?.phoneNumber || "",
      address: employee?.address || "",
      dateOfBirth: employee?.dateOfBirth ? new Date(employee.dateOfBirth) : undefined,
      gender: employee?.gender || undefined,
      maritalStatus: employee?.maritalStatus || undefined,
      photoUrl: employee?.photoUrl || "",
      username: employee?.username || "",
      password: isEditing ? "" : "",
      role: employee?.role || "employee",
      departmentId: employee?.departmentId || null,
      position: employee?.position || "",
      joinDate: employee?.joinDate ? new Date(employee.joinDate) : undefined,
      workLocation: employee?.workLocation || "",
      reportingTo: employee?.reportingTo || null,
      salary: employee?.salary || undefined,
      bankAccountNumber: employee?.bankAccountNumber || "",
      bankAccountHolderName: employee?.bankAccountHolderName || "",
      bankName: employee?.bankName || "",
      bankIFSCCode: employee?.bankIFSCCode || "",
      bankAccountType: employee?.bankAccountType || undefined,
      aadhaarCard: employee?.aadhaarCard || "",
      panCard: employee?.panCard || "",
      documents: employee?.documents || [],
    },
  });

  // Calculate age from date of birth
  const calculateAge = (birthDate: Date | undefined): number | null => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), birthDate);
  };

  // Watch the date of birth to calculate age
  const dateOfBirth = form.watch("dateOfBirth");
  const age = calculateAge(dateOfBirth);

  // Handle photo file selection and conversion to base64
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 2MB",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setSelectedPhoto(base64);
        form.setValue('photoUrl', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    form.setValue('photoUrl', '');
  };

  // Handle document file selection and conversion to base64
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      // Validate file size (max 5MB per document)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 5MB limit`,
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newDoc: UploadedDocument = {
          id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: file.name,
          type: file.type,
          data: base64,
          uploadedAt: new Date().toISOString(),
        };
        
        setUploadedDocuments(prev => {
          const updated = [...prev, newDoc];
          // Update form with serialized documents
          form.setValue('documents' as any, updated.map(doc => JSON.stringify(doc)));
          return updated;
        });
        
        toast({
          title: "Document uploaded",
          description: `${file.name} has been added successfully`,
        });
      };
      reader.readAsDataURL(file);
    });
    
    // Reset the input
    event.target.value = '';
  };

  // Remove a document
  const removeDocument = (docId: string) => {
    setUploadedDocuments(prev => {
      const updated = prev.filter(doc => doc.id !== docId);
      form.setValue('documents' as any, updated.map(doc => JSON.stringify(doc)));
      return updated;
    });
  };

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return null; // Will show thumbnail
    return <FileText className="w-6 h-6 text-slate-500" />;
  };

  // Create or update employee mutation
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEditing) {
        // For editing, remove password if it's empty
        if (!values.password) {
          const { password, ...dataWithoutPassword } = values;
          return await apiRequest(
            "PUT", 
            `/api/employees/${employee.id}`, 
            dataWithoutPassword
          );
        } else {
          return await apiRequest(
            "PUT", 
            `/api/employees/${employee.id}`, 
            values
          );
        }
      } else {
        return await apiRequest("POST", "/api/register", values);
      }
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Employee updated" : "Employee created",
        description: isEditing 
          ? "Employee information has been updated successfully." 
          : "New employee has been created successfully.",
      });
      // Invalidate employees query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      onSuccess();
    },
    onError: (error: any) => {
      
      // Check if this is an employee limit error (status 429)
      if (error.status === 429 || error.message?.includes('Employee limit reached')) {
        setEmployeeLimitError({
          currentCount: error.currentCount || 10,
          maxEmployees: error.maxEmployees || 10,
          contactInfo: error.contactInfo || {
            email: "support@hrconnect.com",
            phone: "+1-234-567-8900",
            upgradeLink: "https://hrconnect.com/upgrade"
          }
        });
        setShowContactPopup(true);
        return;
      }
      
      // Default error handling
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the employee",
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isValid = await form.trigger(fieldsToValidate);
    
    if (isValid && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      // Smooth scroll to top when moving to next step
      setTimeout(() => {
        const container = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.form-container')?.closest('[data-radix-dialog-content]') ||
                          document.querySelector('[data-radix-dialog-content]');
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Fallback to window scroll
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Smooth scroll to top when moving to previous step
      setTimeout(() => {
        const container = document.querySelector('[role="dialog"]') || 
                          document.querySelector('.form-container')?.closest('[data-radix-dialog-content]') ||
                          document.querySelector('[data-radix-dialog-content]');
        if (container) {
          container.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Fallback to window scroll
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 150);
    }
  };

  const onSubmit = (values: FormValues) => {
    // Only allow submission on the final step
    if (currentStep === totalSteps) {
      // Ensure documents from state are included in the submission
      const submissionValues = {
        ...values,
        documents: uploadedDocuments.map(doc => JSON.stringify(doc)),
      };
      mutation.mutate(submissionValues);
    } else {
      // If not on final step, go to next step instead
      nextStep();
    }
  };

  const getFieldsForStep = (step: number): (keyof FormValues)[] => {
    switch (step) {
      case 1:
        return ['employeeId', 'firstName', 'lastName', 'email'];
      case 2:
        // For editing, password is optional, so don't validate it
        return isEditing ? ['username', 'role'] : ['username', 'password', 'role'];
      case 3:
        // Final step - validate all required fields for form submission
        return isEditing ? [] : [];
      default:
        return [];
    }
  };

  const stepVariants = {
    initial: { opacity: 0, x: 60, scale: 0.95 },
    in: { opacity: 1, x: 0, scale: 1 },
    out: { opacity: 0, x: -60, scale: 0.95 }
  };

  const stepTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: UserIcon },
    { number: 2, title: "Company Details", icon: Building2 },
    { number: 3, title: "Bank Information", icon: CreditCard },
  ];

  return (
    <div className="form-container h-full max-h-[90vh] flex flex-col">
      {/* Compact Professional Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {isEditing ? "Update Employee Profile" : "Create New Employee"}
            </h2>
            <p className="text-slate-600 text-sm">
              {isEditing 
                ? "Modify employee information and account settings" 
                : "Complete all steps to onboard a new team member"}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">Step {currentStep} of {totalSteps}</div>
            <div className="text-xs text-slate-500">{steps[currentStep - 1]?.title}</div>
          </div>
        </div>
        
        {/* Simplified Progress Steps */}
        <div className="relative">
          <div className="flex items-center justify-between relative z-10">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className="relative">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300",
                    currentStep >= step.number
                      ? "bg-teal-600 border-teal-600 text-white"
                      : currentStep === step.number
                      ? "bg-white border-teal-500 text-teal-600"
                      : "bg-white border-slate-300 text-slate-400"
                  )}>
                    {currentStep > step.number ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div className={cn(
                    "text-xs font-medium",
                    currentStep >= step.number ? "text-teal-700" : "text-slate-500"
                  )}>
                    {step.title}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 -z-10 mx-5 rounded-full">
            <div 
              className="h-full bg-teal-500 transition-all duration-300 ease-out rounded-full"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0 pb-2">
        <Form {...form}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit(onSubmit)(e);
            }}
            onKeyDown={(e) => {
              // Prevent form submission on Enter key unless on final step
              if (e.key === 'Enter' && currentStep < totalSteps) {
                e.preventDefault();
                nextStep();
              }
            }}
            className="space-y-4"
          >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial="initial"
                animate="in"
                exit="out"
                variants={stepVariants}
                transition={stepTransition}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 px-6 py-3 rounded-t-xl border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <div className="bg-teal-100 p-2 rounded-lg mr-3">
                        <UserIcon className="w-4 h-4 text-teal-700" />
                      </div>
                      Personal Information
                    </h3>
                    <p className="text-sm text-slate-600 ml-10">Essential personal details and contact information</p>
                  </div>
                  <div className="p-6 space-y-6">
                    {/* Professional Photo Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-shrink-0">
                          {selectedPhoto ? (
                            <div className="relative group">
                              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                <img 
                                  src={selectedPhoto} 
                                  alt="Employee photo" 
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="absolute inset-0 rounded-2xl bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={removePhoto}
                                  className="opacity-0 group-hover:opacity-100 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-200 shadow-lg"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer group">
                              <Upload className="w-8 h-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">Professional Photo</h4>
                          <p className="text-sm text-gray-600 mb-3">Upload a clear, professional headshot for your employee profile</p>
                          <div className="flex justify-center md:justify-start items-center space-x-3">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoChange}
                              className="hidden"
                              id="photo-upload"
                            />
                            <label
                              htmlFor="photo-upload"
                              className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                              {selectedPhoto ? 'Change Photo' : 'Upload Photo'}
                            </label>
                            {selectedPhoto && (
                              <button
                                type="button"
                                onClick={removePhoto}
                                className="px-4 py-3 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-3">
                            <span className="font-medium">Supported formats:</span> JPG, PNG, GIF • <span className="font-medium">Max size:</span> 2MB
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Basic Information Section */}
                    <div className="bg-white rounded-lg border border-gray-200">
                      <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b border-gray-200">
                        <h4 className="text-md font-semibold text-gray-900">Basic Information</h4>
                        <p className="text-sm text-gray-600">Essential personal and professional details</p>
                      </div>
                      <div className="p-4 space-y-4">
                        
                        {/* Employee ID & Email Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Employee ID {isEditing && <span className="text-xs text-gray-500 font-normal">(Auto-assigned)</span>}
                                </FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder={isEditing ? "Auto-assigned Employee ID" : "Enter employee ID (e.g., EMP001)"} 
                                    className={`h-12 border rounded-xl text-sm font-medium transition-all duration-200 ${
                                      isEditing 
                                        ? "bg-gray-100 border-gray-300 text-gray-700 cursor-not-allowed" 
                                        : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                                    }`}
                                    readOnly={isEditing}
                                    disabled={isEditing}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                                {isEditing && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Employee IDs are automatically assigned and cannot be changed
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Email Address *</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="Enter professional email address" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Name Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">First Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter first name" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Last Name *</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter last name" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Personal Details Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Gender</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white">
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Date of Birth</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full h-12 pl-3 text-left font-medium border border-gray-300 hover:border-blue-400 rounded-xl transition-all duration-200 bg-white",
                                          !field.value && "text-gray-500"
                                        )}
                                      >
                                        {field.value ? format(field.value, "MMM dd, yyyy") : "Select date"}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => {
                                        const today = new Date();
                                        const twentyYearsAgo = subYears(today, 20);
                                        return date > twentyYearsAgo || date < new Date("1900-01-01");
                                      }}
                                      yearRange={{ from: 1950, to: 2002 }}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                                {age !== null && (
                                  <p className="text-sm text-emerald-600 mt-1 font-medium">
                                    ✓ Age: {age} years
                                  </p>
                                )}
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="maritalStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Marital Status</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                  <FormControl>
                                    <SelectTrigger className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white">
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                    <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Professional Details Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="joinDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Date of Joining</FormLabel>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <FormControl>
                                      <Button
                                        variant="outline"
                                        className={cn(
                                          "w-full h-12 pl-3 text-left font-medium border border-gray-300 hover:border-blue-400 rounded-xl transition-all duration-200 bg-white",
                                          !field.value && "text-gray-500"
                                        )}
                                      >
                                        {field.value ? format(field.value, "MMM dd, yyyy") : "Select joining date"}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                      </Button>
                                    </FormControl>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={field.value}
                                      onSelect={field.onChange}
                                      disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="position"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Designation</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter job title/designation" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Department & Work Location Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="departmentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Department</FormLabel>
                                <Select 
                                  value={field.value?.toString() || "none"} 
                                  onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white">
                                      <SelectValue placeholder="Select department" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Department</SelectItem>
                                    {departments.map((department) => (
                                      <SelectItem key={department.id} value={department.id.toString()}>
                                        {department.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="workLocation"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Work Location</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter work location (e.g., Mumbai Office)" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Reporting Manager & Phone Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="reportingTo"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Reporting To</FormLabel>
                                <Select 
                                  value={field.value?.toString() || "none"} 
                                  onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                                >
                                  <FormControl>
                                    <SelectTrigger className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white">
                                      <SelectValue placeholder="Select reporting manager" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Reporting Manager</SelectItem>
                                    {(employees || []).filter(emp => emp.id !== employee?.id).map((emp) => (
                                      <SelectItem key={emp.id} value={emp.id.toString()}>
                                        {emp.firstName} {emp.lastName} ({emp.position || emp.role})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter phone number" 
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Address Row */}
                        <FormField
                          control={form.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">Address</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Enter full residential address" 
                                  className="min-h-[120px] resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Company Details */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial="initial"
                animate="in"
                exit="out"
                variants={stepVariants}
                transition={stepTransition}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 px-6 py-3 rounded-t-xl border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <div className="bg-teal-100 p-2 rounded-lg mr-3">
                        <Building2 className="w-4 h-4 text-teal-700" />
                      </div>
                      Company Details
                    </h3>
                    <p className="text-sm text-slate-600 ml-10">Role, department and employment information</p>
                  </div>
                  <div className="p-6 space-y-4">

                    {/* Account Credentials Section */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Login Credentials
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Username *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter unique username" 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                {isEditing ? "New Password (optional)" : "Password *"}
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder={isEditing ? "Leave blank to keep current" : "Enter secure password"} 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Role & Department Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Access Level *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="h-11 border-2 border-slate-200 focus:border-teal-500 rounded-lg font-medium transition-all duration-200">
                                  <SelectValue placeholder="Select access level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="admin">Admin - Full System Access</SelectItem>
                                <SelectItem value="hr">HR - Human Resources Management</SelectItem>
                                <SelectItem value="manager">Manager - Team Management</SelectItem>
                                <SelectItem value="employee">Employee - Standard Access</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Department</FormLabel>
                            <Select 
                              value={field.value?.toString() || "none"} 
                              onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 border-2 border-slate-200 focus:border-teal-500 rounded-lg font-medium transition-all duration-200">
                                  <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">No Department Assigned</SelectItem>
                                {departments.map((department) => (
                                  <SelectItem key={department.id} value={department.id.toString()}>
                                    {department.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Position & Joining Details */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="position"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Job Title/Position</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. Senior Software Engineer" 
                                className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="joinDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Date of Joining</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-11 pl-3 text-left font-medium border-2 border-slate-200 hover:border-teal-400 rounded-lg transition-all duration-200",
                                      !field.value && "text-slate-500"
                                    )}
                                  >
                                    {field.value ? format(field.value, "PPP") : "Select joining date"}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date > new Date()}
                                  yearRange={{ from: 2022, to: new Date().getFullYear() + 2 }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Salary Section */}
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <FormField
                        control={form.control}
                        name="salary"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-bold text-green-900 mb-2 block flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                              </svg>
                              Annual Salary (₹)
                            </FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="e.g. 850000" 
                                className="h-11 border-2 border-green-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                            <p className="text-xs text-green-700 mt-1">Enter annual salary in Indian Rupees</p>
                          </FormItem>
                        )}
                      />
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Bank Information */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial="initial"
                animate="in"
                exit="out"
                variants={stepVariants}
                transition={stepTransition}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="bg-slate-50 px-6 py-3 rounded-t-xl border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                      <div className="bg-teal-100 p-2 rounded-lg mr-3">
                        <CreditCard className="w-4 h-4 text-teal-700" />
                      </div>
                      Bank Information
                    </h3>
                    <p className="text-sm text-slate-600 ml-10">Banking details for salary processing and payroll management</p>
                  </div>
                  <div className="p-6 space-y-4">

                    {/* Account Details Section */}
                    <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                      <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"/>
                          <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"/>
                        </svg>
                        Bank Account Details
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bankAccountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Bank Account Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter account number" 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="bankAccountHolderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Account Holder Name</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter account holder name" 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Bank Details Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Bank Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. State Bank of India" 
                                className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bankIFSCCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">IFSC Code</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. SBIN0001234" 
                                className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Account Type Section */}
                    <FormField
                      control={form.control}
                      name="bankAccountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Account Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="h-11 border-2 border-slate-200 focus:border-teal-500 rounded-lg font-medium transition-all duration-200">
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings">Savings Account</SelectItem>
                              <SelectItem value="current">Current Account</SelectItem>
                              <SelectItem value="salary">Salary Account</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Identity Documents Section */}
                    <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                      <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a8 8 0 1116 0A8 8 0 012 8zm8-3a3 3 0 100 6 3 3 0 000-6z" clipRule="evenodd"/>
                        </svg>
                        Identity Documents
                      </h4>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="aadhaarCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">Aadhaar Card Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter 12-digit Aadhaar number" 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  maxLength={12}
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="panCard"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">PAN Card Number</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter 10-character PAN number" 
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  maxLength={10}
                                  style={{ textTransform: 'uppercase' }}
                                  {...field} 
                                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Document Upload Section */}
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                        <Upload className="w-4 h-4 mr-2 text-slate-600" />
                        Upload Documents
                      </h4>
                      <p className="text-xs text-slate-600 mb-4">
                        Upload supporting documents such as certificates, contracts, or other relevant files (PDF, images - max 5MB each)
                      </p>
                      
                      {/* Upload Button */}
                      <div className="mb-4">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                          onChange={handleDocumentUpload}
                          className="hidden"
                          id="document-upload"
                          multiple
                          data-testid="input-document-upload"
                        />
                        <label
                          htmlFor="document-upload"
                          className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg cursor-pointer transition-all duration-200"
                          data-testid="button-upload-document"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Files
                        </label>
                      </div>
                      
                      {/* Uploaded Documents Grid */}
                      {uploadedDocuments.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {uploadedDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="relative group w-20 h-20 rounded-lg border-2 border-slate-200 bg-white overflow-hidden cursor-pointer hover:border-teal-400 transition-all duration-200 shadow-sm"
                              onClick={() => setViewingDocument(doc)}
                              data-testid={`document-thumbnail-${doc.id}`}
                            >
                              {/* Document Preview */}
                              {doc.type.startsWith('image/') ? (
                                <img
                                  src={doc.data}
                                  alt={doc.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 p-2">
                                  <FileText className="w-6 h-6 text-slate-500 mb-1" />
                                  <span className="text-[10px] text-slate-500 text-center truncate w-full px-1">
                                    {doc.name.split('.').pop()?.toUpperCase()}
                                  </span>
                                </div>
                              )}
                              
                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                              
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeDocument(doc.id);
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-sm"
                                data-testid={`button-remove-document-${doc.id}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                              
                              {/* Document Name Tooltip */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 p-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <span className="text-[9px] text-white truncate block text-center">
                                  {doc.name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {uploadedDocuments.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-white">
                          <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">No documents uploaded yet</p>
                        </div>
                      )}
                    </div>

                    {/* Info Note */}
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="flex">
                        <svg className="flex-shrink-0 w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                        </svg>
                        <div className="ml-3">
                          <h4 className="text-sm font-semibold text-blue-900">Important Information</h4>
                          <p className="text-sm text-blue-800 mt-1">
                            Bank details are used for salary payments and are kept confidential. Ensure all information is accurate to avoid payment delays.
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </Form>
      </div>
      
      {/* Form Navigation - Fixed at bottom */}
      <div className="bg-white border-t border-slate-200 px-6 py-5 flex-shrink-0 mt-2">
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-3 space-y-3 space-y-reverse sm:space-y-0">
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSuccess}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log(`Next button clicked on step ${currentStep}`);
                  nextStep();
                }}
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                type="submit"
                className="w-full sm:w-auto bg-teal-600 hover:bg-teal-700"
                disabled={mutation.isPending}
                onClick={(e) => {
                  console.log('Submit button clicked', { currentStep, totalSteps, isEditing });
                  const formData = new FormData();
                  const values = form.getValues();
                  Object.entries(values).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                      formData.append(key, String(value));
                    }
                  });
                  form.handleSubmit(onSubmit)(e);
                }}
              >
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Update Employee" : "Create Employee"}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Contact Popup for Employee Limit */}
      {employeeLimitError && (
        <ContactPopup
          isOpen={showContactPopup}
          onClose={() => setShowContactPopup(false)}
          currentCount={employeeLimitError.currentCount}
          maxEmployees={employeeLimitError.maxEmployees}
          contactInfo={employeeLimitError.contactInfo}
        />
      )}
      
      {/* Document Viewer Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FileText className="w-5 h-5 text-teal-600" />
              {viewingDocument?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-slate-100 rounded-lg p-4 min-h-[400px]">
            {viewingDocument && (
              <>
                {viewingDocument.type.startsWith('image/') ? (
                  <img
                    src={viewingDocument.data}
                    alt={viewingDocument.name}
                    className="max-w-full h-auto mx-auto rounded-lg shadow-lg"
                    data-testid="document-viewer-image"
                  />
                ) : viewingDocument.type === 'application/pdf' ? (
                  <iframe
                    src={viewingDocument.data}
                    className="w-full h-[600px] rounded-lg border border-slate-200"
                    title={viewingDocument.name}
                    data-testid="document-viewer-pdf"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-12">
                    <FileText className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="text-slate-600 font-medium mb-2">{viewingDocument.name}</p>
                    <p className="text-sm text-slate-500 mb-4">
                      Preview not available for this file type
                    </p>
                    <a
                      href={viewingDocument.data}
                      download={viewingDocument.name}
                      className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                      data-testid="button-download-document"
                    >
                      <Upload className="w-4 h-4 mr-2 rotate-180" />
                      Download File
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="flex-shrink-0 pt-4 flex justify-between items-center border-t border-slate-200 mt-4">
            <div className="text-xs text-slate-500">
              Uploaded: {viewingDocument ? new Date(viewingDocument.uploadedAt).toLocaleDateString() : ''}
            </div>
            <div className="flex gap-2">
              {viewingDocument && (
                <a
                  href={viewingDocument.data}
                  download={viewingDocument.name}
                  className="inline-flex items-center px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  data-testid="button-download-document-footer"
                >
                  <Upload className="w-4 h-4 mr-2 rotate-180" />
                  Download
                </a>
              )}
              <Button
                variant="outline"
                onClick={() => setViewingDocument(null)}
                data-testid="button-close-document-viewer"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}