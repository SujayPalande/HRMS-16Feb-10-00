import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCategoryMasterSchema, type InsertCategoryMaster } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CategoryMasterForm() {
  const { toast } = useToast();
  const form = useForm<InsertCategoryMaster>({
    resolver: zodResolver(insertCategoryMasterSchema),
    defaultValues: {
      categoryDescription: "",
      class: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertCategoryMaster) => {
      const res = await apiRequest("POST", "/api/masters/categories", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/masters/categories"] });
      toast({ title: "Category created successfully" });
      form.reset();
    },
  });

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader className="bg-primary/5 py-4">
        <CardTitle className="text-lg font-semibold text-primary">Category Master</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <h3 className="text-md font-medium mb-6 border-b pb-2">New Category</h3>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoryDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SemiSkilled">SemiSkilled</SelectItem>
                        <SelectItem value="Skilled">Skilled</SelectItem>
                        <SelectItem value="UnSkilled">UnSkilled</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Worker">Worker</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
