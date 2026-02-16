import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Send, User, Mail, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema for employee invitation - only requires minimal info
const invitationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface EmployeeInvitationFormProps {
  onSuccess: () => void;
}

export function EmployeeInvitationForm({ onSuccess }: EmployeeInvitationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const invitationMutation = useMutation({
    mutationFn: async (data: InvitationFormData) => {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/employees/invite", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setIsSubmitting(false);
      toast({
        title: "Invitation sent successfully! 📧",
        description: `An invitation has been sent to ${form.getValues().firstName} ${form.getValues().lastName} at ${form.getValues().email}`,
      });
      form.reset();
      onSuccess();
    },
    onError: (error: Error) => {
      setIsSubmitting(false);
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvitationFormData) => {
    invitationMutation.mutate(data);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border-2 border-blue-100 shadow-lg">
        <div className="px-8 py-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-xl shadow-sm">
              <Send className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Send Employee Invitation</h2>
              <p className="text-slate-600 text-lg mt-1">
                Invite a new employee to join your organization
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invitation Form */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-6 rounded-t-2xl border-b-2 border-slate-100">
          <h3 className="text-2xl font-bold text-slate-900 flex items-center">
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-3 rounded-xl mr-4 shadow-sm">
              <User className="w-5 h-5 text-indigo-600" />
            </div>
            Employee Information
          </h3>
          <p className="text-sm text-slate-600 mt-1 ml-12">
            Enter the basic information to send an invitation
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            {/* Name Fields */}
            <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
              <h4 className="text-sm font-bold text-indigo-900 mb-4 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Employee Name
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                        First Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter first name" 
                          className="h-12 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm font-medium transition-all duration-200"
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
                      <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                        Last Name *
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter last name" 
                          className="h-12 border-2 border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-lg text-sm font-medium transition-all duration-200"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h4 className="text-sm font-bold text-green-900 mb-4 flex items-center">
                <Mail className="w-4 h-4 mr-2" />
                Contact Information
              </h4>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-slate-700 mb-2 block">
                      Work Email Address *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="email"
                        placeholder="employee@company.com" 
                        className="h-12 border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 rounded-lg text-sm font-medium transition-all duration-200"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-green-700 mt-2">
                      The invitation email will be sent to this address
                    </p>
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t-2 border-slate-100">
              <Button
                type="button"
                variant="outline"
                className="px-8 py-3 h-12 text-sm font-semibold border-2 border-slate-300 hover:bg-slate-50 transition-all duration-200"
                onClick={() => form.reset()}
                disabled={isSubmitting}
              >
                Clear Form
              </Button>
              
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Information Panel */}
      <div className="bg-yellow-50 rounded-2xl border-2 border-yellow-200 p-6">
        <h4 className="text-lg font-bold text-yellow-900 mb-3">What happens next?</h4>
        <div className="space-y-2 text-sm text-yellow-800">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <p>The employee will receive an invitation email with a secure link</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <p>They can set up their account by choosing a password</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
            <p>Once activated, you can add their complete profile details</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}