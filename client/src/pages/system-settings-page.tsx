import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Settings, 
  Loader2, 
  Save, 
  Building2,
  Mail,
  Phone,
  ExternalLink,
  Shield
} from "lucide-react";
import { motion } from "framer-motion";

// System settings schema
const systemSettingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  organizationEmail: z.string().email("Valid email is required"),
  timeZone: z.string(),
  dateFormat: z.string(),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    attendance: z.boolean(),
    leave: z.boolean()
  }),
  systemLimits: z.object({
    maxEmployees: z.number().min(1).max(1000),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
    upgradeLink: z.string().url()
  }),
  salaryComponents: z.object({
    basicSalaryPercentage: z.number().min(0).max(100),
    hraPercentage: z.number().min(0).max(100),
    epfPercentage: z.number().min(0).max(100),
    esicPercentage: z.number().min(0).max(100),
    professionalTax: z.number().min(0)
  })
});

type SystemSettingsForm = z.infer<typeof systemSettingsSchema>;

export default function SystemSettingsPage() {
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

  // Fetch system settings
  const { data: systemSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/settings/system"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/settings/system");
      return await res.json();
    }
  });

  const form = useForm<SystemSettingsForm>({
    resolver: zodResolver(systemSettingsSchema),
    defaultValues: systemSettings,
  });

  // Update form when data loads
  React.useEffect(() => {
    if (systemSettings) {
      form.reset(systemSettings);
    }
  }, [systemSettings, form]);

  // Save system settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: SystemSettingsForm) => {
      const res = await apiRequest("PUT", "/api/settings/system", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SystemSettingsForm) => {
    saveSettingsMutation.mutate(data);
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

  return (
    <AppLayout autoHeight>
      <div className="bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-purple-600/20"></div>
          <div className="relative px-6 py-12">
            <div className="max-w-7xl mx-auto">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6"
              >
                <div className="flex items-center space-x-6">
                  <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-4 rounded-2xl shadow-xl">
                    <Settings className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2">
                      System Settings
                    </h1>
                    <p className="text-slate-300 text-lg max-w-2xl">
                      Configure organization settings and system preferences
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card className="shadow-xl border-2 border-slate-200">
              <CardHeader>
                <CardTitle>Organization Configuration</CardTitle>
                <CardDescription>
                  Manage system settings and organization preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Organization Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="organizationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Building2 className="w-4 h-4 mr-2" />
                                Organization Name
                              </FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-organization-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="organizationEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center">
                                <Mail className="w-4 h-4 mr-2" />
                                Organization Email
                              </FormLabel>
                              <FormControl>
                                <Input {...field} type="email" data-testid="input-organization-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="notifications.email"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0">
                              <Label>Email Notifications</Label>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-email-notifications"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="notifications.attendance"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between space-y-0">
                              <Label>Attendance Notifications</Label>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-attendance-notifications"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t">
                      <Button 
                        type="submit" 
                        disabled={saveSettingsMutation.isPending}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        data-testid="button-save-settings"
                      >
                        {saveSettingsMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save Settings
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