import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useOrganization } from "@/hooks/use-organization";
import { Redirect } from "wouter";
import { UserIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Login form schema
const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const { organizationName } = useOrganization();
  const base = (import.meta.env.BASE_URL ?? "/");

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side - Auth forms */}
      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="mb-4">
              <img src={`${base}images/img.png`} alt="Company logo" className="login-logo mx-auto" />
            </div>
            <h1 className="text-3xl font-bold">{organizationName}</h1>
            <p className="text-slate-500 mt-2">Comprehensive HR Management System</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
              <CardDescription>
                Sign in to access your HR portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...loginForm}>
                <form
                  onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Sign In
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right side - Hero section */}
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-teal-600 p-12 text-white">
        <div className="max-w-lg">
          <h2 className="text-4xl font-bold mb-6">Streamline Your HR Operations</h2>
          <p className="text-lg mb-8">
            {organizationName} is a comprehensive solution for managing employees, tracking attendance,
            handling leave requests, and generating insightful reports.
          </p>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="p-2 bg-teal-500 rounded-md mr-4">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Employee Management</h3>
                <p className="text-teal-100">
                  Maintain complete employee records with role-based access control
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-teal-500 rounded-md mr-4">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Attendance Tracking</h3>
                <p className="text-teal-100">
                  Simplify attendance recording with web-based check-in/check-out
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="p-2 bg-teal-500 rounded-md mr-4">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-xl">Leave Management</h3>
                <p className="text-teal-100">
                  Streamlined workflow for leave requests and approvals
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
