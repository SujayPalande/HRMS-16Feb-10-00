import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCompanyMasterSchema, type InsertCompanyMaster } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function CompanyMasterForm() {
  const { toast } = useToast();
  const form = useForm<InsertCompanyMaster>({
    resolver: zodResolver(insertCompanyMasterSchema),
    defaultValues: {
      companyCode: "",
      companyName: "",
      address: "",
      state: "",
      pinCode: "",
      regdNo: "",
      pfcCode: "",
      esicCode: "",
      panNo: "",
      tanNo: "",
      gstNo: "",
      email: "",
      natureOfBusiness: "",
      esiEmployeeContribution: "0.75",
      esiEmployerContribution: "3.25",
      pfEmployerContribution: "12.00",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCompanyMaster) => {
      const res = await apiRequest("POST", "/api/masters/companies", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/masters/companies"] });
      toast({ title: "Company master updated successfully" });
    },
  });

  return (
    <Card className="w-full shadow-sm">
      <CardHeader className="bg-primary/5 py-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold text-primary">Company Master</CardTitle>
          <Button onClick={form.handleSubmit((data) => mutation.mutate(data))} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            UPDATE
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyCode"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>Company Code</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>Name of the Company</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-start gap-4 space-y-0">
                      <FormLabel className="pt-2">Address</FormLabel>
                      <FormControl className="col-span-2">
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          {...field} 
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>State</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pinCode"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>PinCode</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="regdNo"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>Regd No as per Factory Act</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage className="col-start-2 col-span-2" />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="esiEmployeeContribution"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-2 items-center gap-2 space-y-0">
                        <FormLabel className="text-xs">E.S.I Employee Contribution</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input className="text-right" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <span className="text-sm">%</span>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="esiEmployerContribution"
                    render={({ field }) => (
                      <FormItem className="grid grid-cols-2 items-center gap-2 space-y-0">
                        <FormLabel className="text-xs">E.S.I Employer Contribution</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input className="text-right" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <span className="text-sm">%</span>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="pfEmployerContribution"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>P.F Employer Contribution</FormLabel>
                      <div className="col-span-2 flex items-center gap-2">
                        <FormControl>
                          <Input className="text-right" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <span className="text-sm">%</span>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="panNo"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>PAN No.</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tanNo"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>TAN No.</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstNo"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>GST No.</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="grid grid-cols-3 items-center gap-4 space-y-0">
                      <FormLabel>Email ID</FormLabel>
                      <FormControl className="col-span-2">
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
