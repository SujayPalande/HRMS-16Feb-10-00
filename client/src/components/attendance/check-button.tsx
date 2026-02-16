import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Attendance } from "@shared/schema";
import { LogIn, LogOut, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CheckButtonProps {
  currentAttendance?: Attendance;
}

export function CheckButton({ currentAttendance }: CheckButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [errorDialog, setErrorDialog] = useState({ open: false, title: "", message: "" });
  
  // Check if already checked in but not checked out
  const isCheckedIn = !!currentAttendance?.checkInTime;
  const isCheckedOut = !!currentAttendance?.checkOutTime;
  const canCheckIn = !isCheckedIn || isCheckedOut;
  
  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/check-in", {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch specific user attendance queries
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", { userId: user?.id }] });
      queryClient.refetchQueries({ queryKey: ["/api/attendance", { userId: user?.id }] });
      toast({
        title: "Checked in",
        description: "You have successfully checked in for today.",
      });
    },
    onError: (error: Error) => {
      // Parse and display user-friendly error messages
      let userMessage = "Unable to check in at this time. Please try again.";
      
      try {
        // Extract JSON from error message if it exists
        const errorText = error.message;
        const jsonMatch = errorText.match(/\{.*\}/);
        
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          if (errorData.message === "Already checked in today") {
            userMessage = "You have already checked in for today. You can check out when your work day is complete.";
          } else {
            userMessage = errorData.message || userMessage;
          }
        }
      } catch {
        // If parsing fails, use the original error message
        userMessage = error.message.includes("Already checked in") 
          ? "You have already checked in for today. You can check out when your work day is complete."
          : "Unable to check in at this time. Please try again.";
      }
      
      setErrorDialog({
        open: true,
        title: "Check-in Failed",
        message: userMessage,
      });
    },
  });
  
  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/attendance/check-out", {});
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch specific user attendance queries
      queryClient.invalidateQueries({ queryKey: ["/api/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance", { userId: user?.id }] });
      queryClient.refetchQueries({ queryKey: ["/api/attendance", { userId: user?.id }] });
      toast({
        title: "Checked out",
        description: "You have successfully checked out for today.",
      });
    },
    onError: (error: Error) => {
      // Parse and display user-friendly error messages
      let userMessage = "Unable to check out at this time. Please try again.";
      
      try {
        // Extract JSON from error message if it exists
        const errorText = error.message;
        const jsonMatch = errorText.match(/\{.*\}/);
        
        if (jsonMatch) {
          const errorData = JSON.parse(jsonMatch[0]);
          userMessage = errorData.message || userMessage;
        }
      } catch {
        // If parsing fails, use a generic message
        userMessage = "Unable to check out at this time. Please try again.";
      }
      
      setErrorDialog({
        open: true,
        title: "Check-out Failed",
        message: userMessage,
      });
    },
  });
  
  // Handle check in button click
  const handleCheckIn = () => {
    checkInMutation.mutate();
  };
  
  // Handle check out button click
  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  return (
    <>
      {canCheckIn ? (
        <Button 
          onClick={handleCheckIn}
          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8 py-4 text-lg border-0 rounded-2xl h-auto"
          disabled={checkInMutation.isPending}
        >
          {checkInMutation.isPending ? (
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          ) : (
            <LogIn className="mr-3 h-6 w-6" />
          )}
          Check In
        </Button>
      ) : (
        <Button 
          onClick={handleCheckOut}
          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold px-8 py-4 text-lg border-0 rounded-2xl h-auto"
          disabled={checkOutMutation.isPending || isCheckedOut}
        >
          {checkOutMutation.isPending ? (
            <Loader2 className="mr-3 h-6 w-6 animate-spin" />
          ) : (
            <LogOut className="mr-3 h-6 w-6" />
          )}
          {isCheckedOut ? "Checked Out" : "Check Out"}
        </Button>
      )}

      {/* Error Dialog */}
      <AlertDialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {errorDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialog(prev => ({ ...prev, open: false }))}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
