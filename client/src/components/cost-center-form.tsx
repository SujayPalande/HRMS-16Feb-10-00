import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCostCenterSchema, type InsertCostCenter } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function CostCenterForm() {
  const { toast } = useToast();
  const form = useForm<InsertCostCenter>({
    resolver: zodResolver(insertCostCenterSchema),
    defaultValues: {
      name: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCostCenter) => {
      const res = await apiRequest("POST", "/api/masters/cost-centers", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/masters/cost-centers"] });
      toast({ title: "Cost center created successfully" });
      form.reset();
    },
  });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader className="bg-primary/5 py-4">
        <CardTitle className="text-lg font-semibold text-primary">Cost Center</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-md font-medium mb-6 border-b pb-2">New CostCenter</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name of the CostCenter</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter cost center name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
