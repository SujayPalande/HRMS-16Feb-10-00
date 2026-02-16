import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  Loader2, 
  Save, 
  AlertTriangle,
  Phone,
  ExternalLink,
  Shield,
  Mail
} from "lucide-react";
import { motion } from "framer-motion";

// Employee limits schema
const employeeLimitsSchema = z.object({
  systemLimits: z.object({
    maxEmployees: z.number().min(1).max(1000),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
    upgradeLink: z.string().url()
  })
});

type EmployeeLimitsForm = z.infer<typeof employeeLimitsSchema>;

export default function EmployeeLimitPage() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user is developer
  if (user?.role !== 'developer') {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <Shield className="w-5 h-5 mr-2" />
                Access Denied
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                This area is restricted to developer accounts only.
              </p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Fetch system settings for employee limits
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/system");
      return await res.json();
    }
  });

  // Fetch all employees for count
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  const form = useForm<EmployeeLimitsForm>({
    resolver: zodResolver(employeeLimitsSchema),
    defaultValues: {
      systemLimits: systemSettings?.systemLimits || {
        maxEmployees: 10,
        contactEmail: "",
        contactPhone: "",
        upgradeLink: ""
      }
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (systemSettings?.systemLimits) {
      form.reset({ systemLimits: systemSettings.systemLimits });
    }
  }, [systemSettings, form]);

  // Save employee limits mutation
  const saveLimitsMutation = useMutation({
    mutationFn: async (data: EmployeeLimitsForm) => {
      const fullSettings = { ...systemSettings, ...data };
      const res = await apiRequest("PUT", "/api/settings/system", fullSettings);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "Limits updated",
        description: "Employee limits have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update limits: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EmployeeLimitsForm) => {
    saveLimitsMutation.mutate(data);
  };

  if (isLoadingSettings) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  const currentEmployeeCount = employees.length;
  const maxEmployees = systemSettings?.systemLimits?.maxEmployees || 10;
  const isNearLimit = currentEmployeeCount >= maxEmployees * 0.8;
  const isAtLimit = currentEmployeeCount >= maxEmployees;

  return (
    <AppLayout autoHeight>
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20"></div>
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
              >
                <div className="flex items-center space-x-6">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl shadow-xl">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2">
                      Employee Limits
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl">
                      Manage employee capacity and upgrade options
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Employee Limit Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className={`border-2 ${isAtLimit ? 'border-red-200 bg-red-50' : isNearLimit ? 'border-orange-200 bg-orange-50' : 'border-green-200 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className={`flex items-center ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-orange-700' : 'text-green-700'}`}>
                  <Users className="w-5 h-5 mr-2" />
                  Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-2xl font-bold ${isAtLimit ? 'text-red-700' : isNearLimit ? 'text-orange-700' : 'text-green-700'}`} data-testid="text-employee-count">
                      {currentEmployeeCount} / {maxEmployees}
                    </p>
                    <p className="text-slate-600">Employees registered</p>
                  </div>
                  {(isAtLimit || isNearLimit) && (
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className={`w-5 h-5 ${isAtLimit ? 'text-red-600' : 'text-orange-600'}`} />
                      <span className={`font-medium ${isAtLimit ? 'text-red-700' : 'text-orange-700'}`} data-testid="text-limit-status">
                        {isAtLimit ? 'Limit Reached' : 'Approaching Limit'}
                      </span>
                    </div>
                  )}
                </div>
                <div className={`mt-4 w-full bg-gray-200 rounded-full h-2`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min((currentEmployeeCount / maxEmployees) * 100, 100)}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Limits Configuration Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle>Employee Limit Configuration</CardTitle>
                <CardDescription>
                  Configure maximum employee capacity and upgrade information
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Capacity Settings</h3>
                      <FormField
                        control={form.control}
                        name="systemLimits.maxEmployees"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center">
                              <Users className="w-4 h-4 mr-2" />
                              Maximum Employees
                            </FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                min="1" 
                                max="1000"
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                                data-testid="input-max-employees"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Support & Upgrade Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="systemLimits.contactEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                Support Email
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="email" data-testid="input-support-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="systemLimits.contactPhone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Phone className="w-4 h-4 mr-2" />
                                Support Phone
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="tel" data-testid="input-support-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="systemLimits.upgradeLink"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel className="flex items-center">
                              <ExternalLink className="w-4 h-4 mr-2" />
                              Upgrade URL
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="url" data-testid="input-upgrade-url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={saveLimitsMutation.isPending}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        data-testid="button-save-limits"
                      >
                        {saveLimitsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Update Limits
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}