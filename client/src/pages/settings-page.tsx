import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { useTheme } from "next-themes";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, differenceInYears, subYears } from "date-fns";
import { cn } from "@/lib/utils";
import { Department, User } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Settings as SettingsIcon,
  User as UserIcon,
  KeyRound,
  Monitor,
  Sun,
  Moon,
  Save,
  Loader2,
  Database,
  Bell,
  Shield,
  Building2,
  CreditCard,
  CalendarIcon,
  Upload,
  X,
  FileText,
  Eye,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Lock,
} from "lucide-react";

// Change password form schema
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordData = z.infer<typeof changePasswordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { organizationName } = useOrganization();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  // Change password form
  const passwordForm = useForm<ChangePasswordData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (data: ChangePasswordData) =>
      apiRequest("POST", "/api/user/change-password", data),
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      passwordForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password.",
        variant: "destructive",
      });
    },
  });

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Theme changed to ${newTheme}.`,
    });
  };

  const onPasswordSubmit = (data: ChangePasswordData) => {
    changePasswordMutation.mutate(data);
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-2 mb-6">
            <SettingsIcon className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">
              Settings
            </h1>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-0">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <div className="border-b">
                  <TabsList className="grid w-full grid-cols-3 h-14 bg-slate-50">
                    <TabsTrigger
                      value="profile"
                      className="flex items-center space-x-2"
                      data-testid="tab-profile"
                    >
                      <UserIcon className="h-4 w-4" />
                      <span>Profile</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="password"
                      className="flex items-center space-x-2"
                      data-testid="tab-password"
                    >
                      <KeyRound className="h-4 w-4" />
                      <span>Password</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="theme"
                      className="flex items-center space-x-2"
                      data-testid="tab-theme"
                    >
                      <Monitor className="h-4 w-4" />
                      <span>Theme</span>
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Profile Tab - Full Employee Profile Form */}
                <TabsContent value="profile" className="p-0">
                  <EmployeeProfileForm />
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">Change Password</h3>
                      <p className="text-sm text-slate-600">
                        Update your account password.
                      </p>
                    </div>

                    <Form {...passwordForm}>
                      <form
                        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  data-testid="input-current-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  data-testid="input-new-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="password"
                                  data-testid="input-confirm-password"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={changePasswordMutation.isPending}
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                          data-testid="button-change-password"
                        >
                          {changePasswordMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Changing...
                            </>
                          ) : (
                            <>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Change Password
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </TabsContent>

                {/* Theme Tab */}
                <TabsContent value="theme" className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">
                        Theme Preferences
                      </h3>
                      <p className="text-sm text-slate-600">
                        Choose your preferred theme appearance.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${theme === "light" ? "ring-2 ring-indigo-500" : ""}`}
                        onClick={() => handleThemeChange("light")}
                        data-testid="card-theme-light"
                      >
                        <CardContent className="p-4 flex flex-col items-center space-y-2">
                          <Sun className="h-8 w-8 text-yellow-500" />
                          <h4 className="font-semibold">Light</h4>
                          <p className="text-sm text-slate-600 text-center">
                            Clean and bright interface
                          </p>
                          {theme === "light" && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${theme === "dark" ? "ring-2 ring-indigo-500" : ""}`}
                        onClick={() => handleThemeChange("dark")}
                        data-testid="card-theme-dark"
                      >
                        <CardContent className="p-4 flex flex-col items-center space-y-2">
                          <Moon className="h-8 w-8 text-slate-600" />
                          <h4 className="font-semibold">Dark</h4>
                          <p className="text-sm text-slate-600 text-center">
                            Easy on the eyes
                          </p>
                          {theme === "dark" && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </CardContent>
                      </Card>

                      <Card
                        className={`cursor-pointer transition-all hover:shadow-md ${theme === "system" ? "ring-2 ring-indigo-500" : ""}`}
                        onClick={() => handleThemeChange("system")}
                        data-testid="card-theme-system"
                      >
                        <CardContent className="p-4 flex flex-col items-center space-y-2">
                          <Monitor className="h-8 w-8 text-slate-600" />
                          <h4 className="font-semibold">System</h4>
                          <p className="text-sm text-slate-600 text-center">
                            Match system preference
                          </p>
                          {theme === "system" && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}

// Employee Profile Form Component with Multi-Step Design
// Employee Profile Form Component with Multi-Step Design
function EmployeeProfileForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(
    user?.photoUrl || null,
  );

  // Check if user is admin or HR - they can edit everything
  const isAdmin = user?.role === "admin" || user?.role === "hr";

  // Document upload state
  interface UploadedDocument {
    id: string;
    name: string;
    type: string;
    data: string;
    uploadedAt: string;
  }

  const [uploadedDocuments, setUploadedDocuments] = useState<
    UploadedDocument[]
  >([]);
  const [viewingDocument, setViewingDocument] =
    useState<UploadedDocument | null>(null);

  // Fetch departments
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  // Fetch full employee data
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery<User>({
    queryKey: [`/api/employees/${user?.id}`],
    enabled: !!user?.id,
  });

  // Fetch employees for reporting manager dropdown
  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });

  // Form schema
  const formSchema = z.object({
    // Personal Information (Step 1)
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    dateOfBirth: z
      .date()
      .optional()
      .refine(
        (date) => {
          if (!date) return true;
          const age = differenceInYears(new Date(), date);
          return age >= 20;
        },
        {
          message: "Age must be more than 20",
        },
      ),
    gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
    maritalStatus: z
      .enum(["single", "married", "divorced", "widowed", "prefer_not_to_say"])
      .optional(),
    photoUrl: z.string().optional(),

    // Company Details (Step 2) - Read-only for employees
    username: z.string().optional(),
    role: z
      .enum(["admin", "hr", "manager", "employee", "developer"])
      .optional(),
    departmentId: z.number().nullable().optional(),
    position: z.string().optional(),
    joinDate: z.date().optional(),
    workLocation: z.string().optional(),
    reportingTo: z.number().nullable().optional(),
    salary: z.number().optional(),

    // Bank Information (Step 3)
    bankAccountNumber: z.string().optional(),
    bankAccountHolderName: z.string().optional(),
    bankName: z.string().optional(),
    bankIFSCCode: z.string().optional(),
    bankAccountType: z.enum(["savings", "current", "salary"]).optional(),
    aadhaarCard: z.string().optional(),
    panCard: z.string().optional(),
    documents: z.array(z.string()).optional(),
  });

  type FormValues = z.infer<typeof formSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      address: "",
      dateOfBirth: undefined,
      gender: undefined,
      maritalStatus: undefined,
      photoUrl: "",
      username: "",
      role: "employee",
      departmentId: null,
      position: "",
      joinDate: undefined,
      workLocation: "",
      reportingTo: null,
      salary: undefined,
      bankAccountNumber: "",
      bankAccountHolderName: "",
      bankName: "",
      bankIFSCCode: "",
      bankAccountType: undefined,
      aadhaarCard: "",
      panCard: "",
      documents: [],
    },
  });

  // Update form when employee data loads
  useEffect(() => {
    if (employeeData) {
      const parsedDocs = parseExistingDocuments(employeeData.documents);
      setUploadedDocuments(parsedDocs);
      setSelectedPhoto(employeeData.photoUrl || null);

      form.reset({
        firstName: employeeData.firstName || "",
        lastName: employeeData.lastName || "",
        email: employeeData.email || "",
        phoneNumber: employeeData.phoneNumber || "",
        address: employeeData.address || "",
        dateOfBirth: employeeData.dateOfBirth
          ? new Date(employeeData.dateOfBirth)
          : undefined,
        gender: employeeData.gender || undefined,
        maritalStatus: employeeData.maritalStatus || undefined,
        photoUrl: employeeData.photoUrl || "",
        username: employeeData.username || "",
        role: employeeData.role || "employee",
        departmentId: employeeData.departmentId || null,
        position: employeeData.position || "",
        joinDate: employeeData.joinDate
          ? new Date(employeeData.joinDate)
          : undefined,
        workLocation: employeeData.workLocation || "",
        reportingTo: employeeData.reportingTo || null,
        salary: employeeData.salary || undefined,
        bankAccountNumber: employeeData.bankAccountNumber || "",
        bankAccountHolderName: employeeData.bankAccountHolderName || "",
        bankName: employeeData.bankName || "",
        bankIFSCCode: employeeData.bankIFSCCode || "",
        bankAccountType: employeeData.bankAccountType || undefined,
        aadhaarCard: employeeData.aadhaarCard || "",
        panCard: employeeData.panCard || "",
        documents: employeeData.documents || [],
      });
    }
  }, [employeeData, form]);

  // Parse existing documents
  const parseExistingDocuments = (
    docs: string[] | null | undefined,
  ): UploadedDocument[] => {
    if (docs && Array.isArray(docs)) {
      try {
        return docs.map((doc) => {
          if (typeof doc === "string") {
            return JSON.parse(doc);
          }
          return doc;
        });
      } catch (e) {
        console.error("Error parsing documents:", e);
        return [];
      }
    }
    return [];
  };

  // Calculate age from date of birth
  const calculateAge = (birthDate: Date | undefined): number | null => {
    if (!birthDate) return null;
    return differenceInYears(new Date(), birthDate);
  };

  const dateOfBirth = form.watch("dateOfBirth");
  const age = calculateAge(dateOfBirth);

  // Handle photo file selection
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file (JPG, PNG, GIF)",
          variant: "destructive",
        });
        return;
      }

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
        form.setValue("photoUrl", base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setSelectedPhoto(null);
    form.setValue("photoUrl", "");
  };

  // Handle document upload
  const handleDocumentUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
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

        setUploadedDocuments((prev) => {
          const updated = [...prev, newDoc];
          form.setValue(
            "documents" as any,
            updated.map((doc) => JSON.stringify(doc)),
          );
          return updated;
        });

        toast({
          title: "Document uploaded",
          description: `${file.name} has been added successfully`,
        });
      };
      reader.readAsDataURL(file);
    });

    event.target.value = "";
  };

  const removeDocument = (docId: string) => {
    setUploadedDocuments((prev) => {
      const updated = prev.filter((doc) => doc.id !== docId);
      form.setValue(
        "documents" as any,
        updated.map((doc) => JSON.stringify(doc)),
      );
      return updated;
    });
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest("PUT", `/api/employees/${user?.id}`, values);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      // Invalidate all employee-related queries to ensure data syncs between admin and employee views
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] }); // Admin employee list
      queryClient.invalidateQueries({
        queryKey: [`/api/employees/${user?.id}`],
      }); // This employee's data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] }); // Current user data
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (values: FormValues) => {
    // Include documents from state
    const submissionValues = {
      ...values,
      documents: uploadedDocuments.map((doc) => JSON.stringify(doc)),
    };
    updateProfileMutation.mutate(submissionValues);
  };

  // Handle form validation errors - navigate to the step with errors
  const onInvalid = (errors: any) => {
    // Map fields to their steps
    const step1Fields = [
      "firstName",
      "lastName",
      "email",
      "phoneNumber",
      "address",
      "dateOfBirth",
      "gender",
      "maritalStatus",
      "photoUrl",
    ];
    const step2Fields = [
      "username",
      "role",
      "departmentId",
      "position",
      "joinDate",
      "workLocation",
      "reportingTo",
      "salary",
    ];
    const step3Fields = [
      "bankAccountNumber",
      "bankAccountHolderName",
      "bankName",
      "bankIFSCCode",
      "bankAccountType",
      "aadhaarCard",
      "panCard",
      "documents",
    ];

    const errorFields = Object.keys(errors);

    let targetStep = currentStep;
    let errorMessage = "Please fix the following errors: ";
    const errorMessages: string[] = [];

    for (const field of errorFields) {
      if (step1Fields.includes(field)) {
        targetStep = Math.min(targetStep, 1);
        errorMessages.push(errors[field]?.message || field);
      } else if (step2Fields.includes(field)) {
        targetStep = Math.min(targetStep, 2);
        errorMessages.push(errors[field]?.message || field);
      } else if (step3Fields.includes(field)) {
        targetStep = Math.min(targetStep, 3);
        errorMessages.push(errors[field]?.message || field);
      }
    }

    // Show toast with error details
    toast({
      title: "Validation Error",
      description:
        errorMessages.slice(0, 3).join(", ") +
        (errorMessages.length > 3
          ? ` and ${errorMessages.length - 3} more`
          : ""),
      variant: "destructive",
    });

    // Navigate to the step with the first error
    if (targetStep !== currentStep) {
      setCurrentStep(targetStep);
    }
  };

  // Get department name by ID
  const getDepartmentName = (deptId: number | null | undefined) => {
    if (!deptId) return "Not Assigned";
    const dept = departments.find((d) => d.id === deptId);
    return dept?.name || "Not Assigned";
  };

  // Get reporting manager name
  const getReportingManagerName = (managerId: number | null | undefined) => {
    if (!managerId) return "Not Assigned";
    const manager = employees.find((e) => e.id === managerId);
    return manager
      ? `${manager.firstName} ${manager.lastName}`
      : "Not Assigned";
  };

  const stepVariants = {
    initial: { opacity: 0, x: 60, scale: 0.95 },
    in: { opacity: 1, x: 0, scale: 1 },
    out: { opacity: 0, x: -60, scale: 0.95 },
  };

  const stepTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: UserIcon },
    { number: 2, title: "Company Details", icon: Building2 },
    { number: 3, title: "Bank Information", icon: CreditCard },
  ];

  if (isLoadingEmployee) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="ml-2 text-slate-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="form-container flex flex-col">
      {/* Professional Header */}
      <div className="bg-white px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Update Employee Profile
            </h2>
            <p className="text-slate-600 text-sm">
              Manage your personal information and account settings
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-slate-900">
              Step {currentStep} of {totalSteps}
            </div>
            <div className="text-xs text-slate-500">
              {steps[currentStep - 1]?.title}
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="relative">
          <div className="flex items-center justify-between relative z-10">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className="relative">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer",
                      currentStep >= step.number
                        ? "bg-teal-600 border-teal-600 text-white"
                        : currentStep === step.number
                          ? "bg-white border-teal-500 text-teal-600"
                          : "bg-white border-slate-300 text-slate-400",
                    )}
                    onClick={() => setCurrentStep(step.number)}
                  >
                    {step.number === 2 && !isAdmin ? (
                      <Lock className="w-4 h-4" />
                    ) : currentStep > step.number ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <step.icon className="w-4 h-4" />
                    )}
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-xs font-medium",
                      currentStep >= step.number
                        ? "text-teal-700"
                        : "text-slate-500",
                    )}
                  >
                    {step.title}
                    {step.number === 2 && !isAdmin && (
                      <span className="block text-xs text-amber-600">
                        (View Only)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 -z-10 mx-5 rounded-full">
            <div
              className="h-full bg-teal-500 transition-all duration-300 ease-out rounded-full"
              style={{
                width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="space-y-4 overflow-hidden"
        >
          <div className="px-6 py-4 pb-2">
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
                      <p className="text-sm text-slate-600 ml-10">
                        Essential personal details and contact information
                      </p>
                    </div>
                    <div className="p-6 space-y-6">
                      {/* Photo Section */}
                      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="flex-shrink-0">
                            {selectedPhoto ? (
                              <div className="relative group">
                                <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                                  <img
                                    src={selectedPhoto}
                                    alt="Profile photo"
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
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">
                              Professional Photo
                            </h4>
                            <p className="text-sm text-gray-600 mb-3">
                              Upload a clear, professional headshot for your
                              profile
                            </p>
                            <div className="flex justify-center md:justify-start items-center space-x-3">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="photo-upload-settings"
                                data-testid="input-photo-upload"
                              />
                              <label
                                htmlFor="photo-upload-settings"
                                className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 border-0 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                              >
                                {selectedPhoto
                                  ? "Change Photo"
                                  : "Upload Photo"}
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
                              <span className="font-medium">
                                Supported formats:
                              </span>{" "}
                              JPG, PNG, GIF |{" "}
                              <span className="font-medium">Max size:</span> 2MB
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Basic Information Section */}
                      <div className="bg-white rounded-lg border border-gray-200">
                        <div className="bg-gray-50 px-4 py-3 rounded-t-lg border-b border-gray-200">
                          <h4 className="text-md font-semibold text-gray-900">
                            Basic Information
                          </h4>
                          <p className="text-sm text-gray-600">
                            Your personal and contact details
                          </p>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Name Row */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="firstName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    First Name *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter first name"
                                      className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                      data-testid="input-first-name"
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
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Last Name *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Enter last name"
                                      className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                      data-testid="input-last-name"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Email Row */}
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Email Address *
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="Enter email address"
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    data-testid="input-email"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Personal Details Row */}
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <FormField
                              control={form.control}
                              name="gender"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Gender
                                  </FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white"
                                        data-testid="select-gender"
                                      >
                                        <SelectValue placeholder="Select gender" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="male">Male</SelectItem>
                                      <SelectItem value="female">
                                        Female
                                      </SelectItem>
                                      <SelectItem value="other">
                                        Other
                                      </SelectItem>
                                      <SelectItem value="prefer_not_to_say">
                                        Prefer not to say
                                      </SelectItem>
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
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Date of Birth
                                  </FormLabel>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <FormControl>
                                        <Button
                                          variant="outline"
                                          className={cn(
                                            "w-full h-12 pl-3 text-left font-medium border border-gray-300 hover:border-blue-400 rounded-xl transition-all duration-200 bg-white",
                                            !field.value && "text-gray-500",
                                          )}
                                          data-testid="button-dob"
                                        >
                                          {field.value
                                            ? format(
                                                field.value,
                                                "MMM dd, yyyy",
                                              )
                                            : "Select date"}
                                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                      </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent
                                      className="w-auto p-0"
                                      align="start"
                                    >
                                      <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => {
                                          const today = new Date();
                                          const twentyYearsAgo = subYears(
                                            today,
                                            20,
                                          );
                                          return (
                                            date > twentyYearsAgo ||
                                            date < new Date("1900-01-01")
                                          );
                                        }}
                                        yearRange={{ from: 1950, to: 2002 }}
                                        initialFocus
                                      />
                                    </PopoverContent>
                                  </Popover>
                                  <FormMessage />
                                  {age !== null && (
                                    <p className="text-sm text-emerald-600 mt-1 font-medium">
                                      Age: {age} years
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
                                  <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                    Marital Status
                                  </FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger
                                        className="h-12 border border-gray-300 focus:border-blue-500 rounded-xl font-medium transition-all duration-200 bg-white"
                                        data-testid="select-marital-status"
                                      >
                                        <SelectValue placeholder="Select status" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="single">
                                        Single
                                      </SelectItem>
                                      <SelectItem value="married">
                                        Married
                                      </SelectItem>
                                      <SelectItem value="divorced">
                                        Divorced
                                      </SelectItem>
                                      <SelectItem value="widowed">
                                        Widowed
                                      </SelectItem>
                                      <SelectItem value="prefer_not_to_say">
                                        Prefer not to say
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Phone Number Row */}
                          <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Phone Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter phone number"
                                    className="h-12 border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    data-testid="input-phone"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Address Row */}
                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-gray-700 mb-2 block">
                                  Address
                                </FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter full residential address"
                                    className="min-h-[120px] resize-none border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 rounded-xl text-sm font-medium transition-all duration-200 bg-white"
                                    data-testid="input-address"
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

              {/* Step 2: Company Details - Read Only for Employees */}
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
                        {!isAdmin && (
                          <Badge
                            variant="secondary"
                            className="ml-3 bg-amber-100 text-amber-800 border-amber-200"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            View Only
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-slate-600 ml-10">
                        {isAdmin
                          ? "Role, department and employment information"
                          : "These details are managed by HR. Contact your administrator for changes."}
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      {!isAdmin && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <div className="flex items-start gap-3">
                            <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-semibold text-amber-800">
                                Read-Only Section
                              </h4>
                              <p className="text-xs text-amber-700 mt-1">
                                Company details are managed by HR
                                administrators. If you need to update any
                                information in this section, please contact your
                                HR department.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Account Details Section */}
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Account Information
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">
                              Username
                            </label>
                            <Input
                              value={form.watch("username") || ""}
                              readOnly
                              disabled
                              className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">
                              Access Level
                            </label>
                            <Input
                              value={(() => {
                                const role = form.watch("role");
                                if (!role) return "";
                                return (
                                  role.charAt(0).toUpperCase() + role.slice(1)
                                );
                              })()}
                              readOnly
                              disabled
                              className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Department & Position Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Department
                          </label>
                          <Input
                            value={getDepartmentName(
                              form.watch("departmentId"),
                            )}
                            readOnly
                            disabled
                            className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Position / Job Title
                          </label>
                          <Input
                            value={form.watch("position") || "Not Assigned"}
                            readOnly
                            disabled
                            className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Joining & Location Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Date of Joining
                          </label>
                          <Input
                            value={
                              form.watch("joinDate")
                                ? format(
                                    form.watch("joinDate")!,
                                    "MMM dd, yyyy",
                                  )
                                : "Not Set"
                            }
                            readOnly
                            disabled
                            className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700 mb-2 block">
                            Work Location
                          </label>
                          <Input
                            value={form.watch("workLocation") || "Not Assigned"}
                            readOnly
                            disabled
                            className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
                          />
                        </div>
                      </div>

                      {/* Reporting Manager Section */}
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Reporting Manager
                        </label>
                        <Input
                          value={getReportingManagerName(
                            form.watch("reportingTo"),
                          )}
                          readOnly
                          disabled
                          className="h-11 border-2 border-slate-200 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium cursor-not-allowed"
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
                      <p className="text-sm text-slate-600 ml-10">
                        Banking details for salary processing and payroll
                        management
                      </p>
                    </div>
                    <div className="p-6 space-y-4">
                      {/* Account Details Section */}
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                            <path
                              fillRule="evenodd"
                              d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Bank Account Details
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="bankAccountNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                  Bank Account Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter account number"
                                    className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                    data-testid="input-bank-account"
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
                                <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                  Account Holder Name
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter account holder name"
                                    className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                    data-testid="input-account-holder"
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
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                Bank Name
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. State Bank of India"
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  data-testid="input-bank-name"
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
                              <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                IFSC Code
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g. SBIN0001234"
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                  data-testid="input-ifsc"
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
                            <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                              Account Type
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger
                                  className="h-11 border-2 border-slate-200 focus:border-teal-500 rounded-lg font-medium transition-all duration-200"
                                  data-testid="select-account-type"
                                >
                                  <SelectValue placeholder="Select account type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="savings">
                                  Savings Account
                                </SelectItem>
                                <SelectItem value="current">
                                  Current Account
                                </SelectItem>
                                <SelectItem value="salary">
                                  Salary Account
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Identity Documents Section */}
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 8a6 6 0 01-7.743 5.743L10 14l-0.257-0.257A6 6 0 1118 8zM2 8a8 8 0 1116 0A8 8 0 012 8zm8-3a3 3 0 100 6 3 3 0 000-6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Identity Documents
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="aadhaarCard"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                  Aadhaar Card Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter 12-digit Aadhaar number"
                                    className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                    maxLength={12}
                                    data-testid="input-aadhaar"
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
                                <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                                  PAN Card Number
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter 10-character PAN number"
                                    className="h-11 border-2 border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 rounded-lg text-sm font-medium transition-all duration-200"
                                    maxLength={10}
                                    style={{ textTransform: "uppercase" }}
                                    data-testid="input-pan"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value.toUpperCase(),
                                      )
                                    }
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
                          Upload supporting documents such as certificates,
                          contracts, or other relevant files (PDF, images - max
                          5MB each)
                        </p>

                        {/* Upload Button */}
                        <div className="mb-4">
                          <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx"
                            onChange={handleDocumentUpload}
                            className="hidden"
                            id="document-upload-settings"
                            multiple
                            data-testid="input-document-upload"
                          />
                          <label
                            htmlFor="document-upload-settings"
                            className="inline-flex items-center px-4 py-2 text-sm font-semibold bg-white border-2 border-dashed border-slate-300 text-slate-700 hover:border-teal-500 hover:text-teal-700 rounded-lg cursor-pointer transition-all duration-200"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Files to Upload
                          </label>
                        </div>

                        {/* Uploaded Documents List */}
                        {uploadedDocuments.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-slate-700">
                              Uploaded Documents ({uploadedDocuments.length})
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {uploadedDocuments.map((doc) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    {doc.type.startsWith("image/") ? (
                                      <img
                                        src={doc.data}
                                        alt={doc.name}
                                        className="w-8 h-8 object-cover rounded"
                                      />
                                    ) : (
                                      <FileText className="w-6 h-6 text-slate-500 flex-shrink-0" />
                                    )}
                                    <span className="text-sm text-slate-700 truncate">
                                      {doc.name}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setViewingDocument(doc)}
                                      className="text-slate-500 hover:text-blue-600"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeDocument(doc.id)}
                                      className="text-slate-500 hover:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="bg-white px-6 py-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
                data-testid="button-previous-step"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                    data-testid="button-next-step"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Profile
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </form>
      </Form>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{viewingDocument.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewingDocument(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            {viewingDocument.type.startsWith("image/") ? (
              <img
                src={viewingDocument.data}
                alt={viewingDocument.name}
                className="max-w-full"
              />
            ) : viewingDocument.type === "application/pdf" ? (
              <iframe
                src={viewingDocument.data}
                className="w-full h-[70vh]"
                title={viewingDocument.name}
              />
            ) : (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">
                  Preview not available for this file type
                </p>
                <a
                  href={viewingDocument.data}
                  download={viewingDocument.name}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
