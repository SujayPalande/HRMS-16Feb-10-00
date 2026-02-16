import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useOrganization } from "@/hooks/use-organization";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Holiday } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { 
  Plus, 
  Pencil, 
  Trash2,
  CalendarDays,
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Award,
  Star,
  Target,
  Settings,
  Eye,
  Search,
  Filter,
  Crown,
  Sparkles,
  Zap,
  Gift,
  Download
} from "lucide-react";
import { format, isSameMonth, isToday, isPast, isFuture, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, addDays, subDays, getYear } from "date-fns";
import jsPDF from 'jspdf';
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

// Form schema for holiday
const holidayFormSchema = z.object({
  name: z.string().min(1, "Holiday name is required"),
  date: z.date({
    required_error: "Holiday date is required",
  }),
  description: z.string().optional(),
});

type HolidayFormValues = z.infer<typeof holidayFormSchema>;

export default function HolidaysPage() {
  const { toast } = useToast();
  const { organizationName } = useOrganization();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  
  // Fetch all holidays
  const { data: holidays = [], isLoading } = useQuery<Holiday[]>({
    queryKey: ["/api/holidays"],
  });
  
  // Holiday dates for calendar highlighting
  const holidayDates = holidays.map(holiday => new Date(holiday.date));
  
  // Filter holidays for the current month
  const currentMonthHolidays = holidays.filter(holiday => 
    isSameMonth(new Date(holiday.date), selectedDate)
  );
  
  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Group holidays by past, today, and upcoming
  const pastHolidays = sortedHolidays.filter(holiday => 
    isPast(new Date(holiday.date)) && !isToday(new Date(holiday.date))
  );
  
  const todayHoliday = sortedHolidays.find(holiday => 
    isToday(new Date(holiday.date))
  );
  
  const upcomingHolidays = sortedHolidays.filter(holiday => 
    isFuture(new Date(holiday.date))
  );
  
  // Calculate holiday statistics
  const totalHolidays = holidays.length;
  const thisMonth = new Date();
  const nextMonth = addDays(thisMonth, 30);
  
  const upcomingHolidaysCount = holidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return holidayDate >= thisMonth && holidayDate <= nextMonth;
  }).length;
  
  const thisMonthHolidaysCount = holidays.filter(holiday => 
    isSameMonth(new Date(holiday.date), thisMonth)
  ).length;
  
  const pastHolidaysCount = holidays.filter(holiday =>
    isPast(new Date(holiday.date)) && !isToday(new Date(holiday.date))
  ).length;

  // Generate available years (current year + 5 years ahead)
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

  // Filter holidays by selected year
  const holidaysForSelectedYear = holidays.filter(holiday => 
    getYear(new Date(holiday.date)) === parseInt(selectedYear)
  );

  // PDF generation function
  const generateHolidayPDF = () => {
    const doc = new jsPDF();
    const year = selectedYear;
    const sortedYearHolidays = [...holidaysForSelectedYear].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // PDF Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text(`Holiday Calendar ${year}`, 20, 30);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total Holidays: ${sortedYearHolidays.length}`, 20, 45);
    
    // Header line
    doc.setLineWidth(0.5);
    doc.line(20, 50, 190, 50);
    
    let yPosition = 65;
    
    if (sortedYearHolidays.length === 0) {
      doc.setFontSize(14);
      doc.setTextColor(120, 120, 120);
      doc.text('No holidays found for this year.', 20, yPosition);
    } else {
      // Holiday list
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      
      sortedYearHolidays.forEach((holiday, index) => {
        const holidayDate = new Date(holiday.date);
        const dateStr = format(holidayDate, 'EEEE, MMMM d, yyyy');
        
        // Holiday name
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${holiday.name}`, 20, yPosition);
        
        // Holiday date
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(dateStr, 25, yPosition + 6);
        
        // Holiday description if available
        if (holiday.description) {
          doc.setTextColor(120, 120, 120);
          doc.text(holiday.description, 25, yPosition + 12);
          yPosition += 25;
        } else {
          yPosition += 18;
        }
        
        // Add page break if needed
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setTextColor(60, 60, 60);
      });
    }
    
    // Footer
    const pageCount = (doc as any).internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on ${format(new Date(), 'PPP')} - Page ${i} of ${pageCount}`, 20, 285);
      doc.text(`${organizationName} - Holiday Management System`, 130, 285);
    }
    
    // Download the PDF
    doc.save(`Holiday-Calendar-${year}.pdf`);
    
    toast({
      title: "PDF Generated",
      description: `Holiday calendar for ${year} has been downloaded successfully.`,
    });
  };

  
  // Create holiday mutation
  const createHolidayMutation = useMutation({
    mutationFn: async (values: HolidayFormValues) => {
      return await apiRequest("POST", "/api/holidays", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday created",
        description: "The holiday has been added to the calendar.",
      });
      addForm.reset({
        name: "",
        date: new Date(),
        description: "",
      });
      setIsAddOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update holiday mutation
  const updateHolidayMutation = useMutation({
    mutationFn: async ({ id, values }: { id: number, values: HolidayFormValues }) => {
      return await apiRequest("PUT", `/api/holidays/${id}`, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday updated",
        description: "The holiday has been updated successfully.",
      });
      setIsEditOpen(false);
      setSelectedHoliday(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete holiday mutation
  const deleteHolidayMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest("DELETE", `/api/holidays/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/holidays"] });
      toast({
        title: "Holiday deleted",
        description: "The holiday has been removed from the calendar.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add holiday form
  const addForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: "",
      date: new Date(),
      description: "",
    },
  });
  
  // Edit holiday form
  const editForm = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      name: selectedHoliday?.name || "",
      date: selectedHoliday ? new Date(selectedHoliday.date) : new Date(),
      description: selectedHoliday?.description || "",
    },
  });
  
  // Reset edit form when selectedHoliday changes
  useEffect(() => {
    if (selectedHoliday) {
      editForm.reset({
        name: selectedHoliday.name,
        date: new Date(selectedHoliday.date),
        description: selectedHoliday.description || "",
      });
    }
  }, [selectedHoliday, editForm]);
  
  // Handle add form submission
  const onAddSubmit = (values: HolidayFormValues) => {
    createHolidayMutation.mutate(values);
  };
  
  // Handle edit form submission
  const onEditSubmit = (values: HolidayFormValues) => {
    if (selectedHoliday) {
      updateHolidayMutation.mutate({ id: selectedHoliday.id, values });
    }
  };
  
  // Table columns for holidays
  const columns: ColumnDef<Holiday>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.original.date), 'MMM d, yyyy'),
    },
    {
      accessorKey: "name",
      header: "Holiday Name",
      cell: ({ row }) => row.getValue("name"),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => row.getValue("description") || "No description",
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const holiday = row.original;
        
        // Only admin can edit/delete holidays
        if (user?.role !== 'admin') {
          return (
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">View only</span>
            </div>
          );
        }
        
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setSelectedHoliday(holiday);
                setIsEditOpen(true);
              }}
              title="Edit"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-red-500"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this holiday? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        );
      },
    },
  ];

  // Holiday Card Component
  const HolidayCard = ({ holiday, index, variant = 'default' }: { holiday: Holiday; index: number; variant?: 'default' | 'upcoming' | 'today' }) => {
    const holidayDate = new Date(holiday.date);
    const isHolidayToday = isToday(holidayDate);
    const isHolidayPast = isPast(holidayDate) && !isHolidayToday;
    const isHolidayUpcoming = isFuture(holidayDate);
    
    const getHolidayIcon = () => {
      if (isHolidayToday) return <Sparkles className="w-5 h-5" />;
      if (isHolidayUpcoming) return <Star className="w-5 h-5" />;
      return <Gift className="w-5 h-5" />;
    };
    
    const getCardStyles = () => {
      if (variant === 'today') return 'border-amber-300 bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50';
      if (variant === 'upcoming') return 'border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50';
      return 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white';
    };
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card className={cn("group border-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative", getCardStyles())}>
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardContent className="p-4 relative z-10">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "p-2 rounded-xl shadow-md",
                    variant === 'today' ? 'bg-gradient-to-br from-amber-100 to-amber-200' :
                    variant === 'upcoming' ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' :
                    'bg-gradient-to-br from-slate-100 to-slate-200'
                  )}>
                    {getHolidayIcon()}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-900 transition-colors duration-300">
                      {holiday.name}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">
                      {format(holidayDate, 'EEEE, MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setSelectedHoliday(holiday);
                        setIsEditOpen(true);
                      }}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-teal-100"
                    >
                      <Settings className="h-4 w-4 text-teal-600" />
                    </Button>
                  </div>
                )}
              </div>
              
              {holiday.description && (
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <CalendarDays className="w-4 h-4 text-teal-500" />
                  <span className="truncate">{holiday.description}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <Badge 
                  variant={isHolidayToday ? 'default' : isHolidayUpcoming ? 'secondary' : 'outline'} 
                  className={cn(
                    "text-xs font-medium",
                    isHolidayToday ? 'bg-amber-100 text-amber-800' :
                    isHolidayUpcoming ? 'bg-emerald-100 text-emerald-800' :
                    'bg-slate-100 text-slate-800'
                  )}
                >
                  {isHolidayToday ? 'Today' : isHolidayUpcoming ? 'Upcoming' : 'Past'}
                </Badge>
                
                <span className="text-xs text-slate-500">
                  {format(holidayDate, 'MMM d')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Executive Header Section */}
        <div className="bg-gradient-to-r from-slate-50 via-slate-100 to-slate-50 -mx-6 -mt-6 px-6 py-8 border-b-2 border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-4 rounded-2xl shadow-lg">
                <CalendarIcon className="w-8 h-8 text-teal-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  Holiday Calendar
                </h1>
                <p className="text-slate-600 text-lg">
                  Manage company holidays and track upcoming celebrations
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-xl px-4 py-3 shadow-md border border-slate-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-600">Total Holidays</div>
                    <div className="text-2xl font-bold text-slate-900">{totalHolidays}</div>
                  </div>
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 h-auto text-white font-semibold">
                      <Plus className="h-5 w-5 mr-2" />
                      Add Holiday
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[95vh] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
                    {/* Header Section */}
                    <div className="text-center space-y-4 pb-6 border-b border-slate-200">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="bg-gradient-to-br from-teal-100 to-emerald-200 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg"
                      >
                        <Plus className="w-8 h-8 text-teal-700" />
                      </motion.div>
                      
                      <div>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                          Add New Holiday
                        </DialogTitle>
                        <p className="text-slate-600 text-base mt-2">
                          Create a new company holiday for the calendar
                        </p>
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-[70vh] mt-6">
                      <Form {...addForm}>
                        <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-8">
                          {/* Holiday Details Section */}
                          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
                            <CardContent className="p-8">
                              <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 p-3 rounded-xl shadow-md">
                                    <Gift className="w-6 h-6 text-amber-700" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900">Holiday Information</h3>
                                    <p className="text-slate-600">Enter the basic details for the holiday</p>
                                  </div>
                                </div>
                                
                                <FormField
                                  control={addForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-base font-semibold text-slate-800">Holiday Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Enter holiday name (e.g., Christmas Day, Independence Day)" 
                                          {...field} 
                                          className="h-12 text-base border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm"
                                        />
                                      </FormControl>
                                      <FormMessage className="text-red-600 font-medium" />
                                    </FormItem>
                                  )}
                                />
                                
                                <FormField
                                  control={addForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-base font-semibold text-slate-800">Description</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          placeholder="Add a description for this holiday (e.g., Federal holiday, Religious celebration, Company event)" 
                                          className="resize-none text-base min-h-[100px] border-2 border-slate-200 hover:border-teal-300 focus:border-teal-500 transition-all duration-200 bg-white shadow-sm p-4"
                                          {...field} 
                                        />
                                      </FormControl>
                                      <FormMessage className="text-red-600 font-medium" />
                                      <p className="text-sm text-slate-500 mt-2">
                                        {field.value?.length || 0} characters
                                      </p>
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>

                          {/* Date Selection Section */}
                          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
                            <CardContent className="p-8">
                              <div className="space-y-6">
                                <div className="flex items-center space-x-3 mb-6">
                                  <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-xl shadow-md">
                                    <CalendarIcon className="w-6 h-6 text-teal-700" />
                                  </div>
                                  <div>
                                    <h3 className="text-xl font-bold text-slate-900">Date Selection</h3>
                                    <p className="text-slate-600">Choose the date for this holiday</p>
                                  </div>
                                </div>
                                
                                <FormField
                                  control={addForm.control}
                                  name="date"
                                  render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                      <FormLabel className="text-base font-semibold text-slate-800 mb-4">Holiday Date *</FormLabel>
                                      <div className="flex justify-center">
                                        <Calendar
                                          mode="single"
                                          selected={field.value}
                                          onSelect={field.onChange}
                                          className="rounded-xl border-2 border-slate-200 shadow-lg bg-white"
                                          classNames={{
                                            months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                            month: "space-y-4",
                                            caption: "flex justify-center pt-1 relative items-center",
                                            caption_label: "text-lg font-bold",
                                            nav: "space-x-1 flex items-center",
                                            nav_button: "h-8 w-8 bg-transparent p-0 opacity-50 hover:opacity-100 border border-slate-200 hover:bg-slate-100 rounded-md",
                                            nav_button_previous: "absolute left-1",
                                            nav_button_next: "absolute right-1",
                                            table: "w-full border-collapse space-y-1",
                                            head_row: "flex",
                                            head_cell: "text-slate-500 rounded-md w-10 font-medium text-sm",
                                            row: "flex w-full mt-2",
                                            cell: "text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                            day: "h-10 w-10 p-0 font-medium hover:bg-teal-100 hover:text-teal-900 rounded-md transition-colors",
                                            day_selected: "bg-teal-600 text-white hover:bg-teal-700 hover:text-white focus:bg-teal-600 focus:text-white rounded-md",
                                            day_today: "bg-slate-100 text-slate-900 font-bold",
                                            day_outside: "text-slate-400 opacity-50",
                                            day_disabled: "text-slate-400 opacity-50 cursor-not-allowed",
                                            day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
                                            day_hidden: "invisible",
                                          }}
                                        />
                                      </div>
                                      <FormMessage className="text-red-600 font-medium mt-2" />
                                      
                                      {field.value && (
                                        <motion.div 
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          transition={{ duration: 0.3 }}
                                          className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-4 rounded-xl border-2 border-emerald-200 shadow-md mt-4"
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 p-2 rounded-lg">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                                              </div>
                                              <div>
                                                <p className="text-base font-semibold text-emerald-900">
                                                  Selected Date: {format(field.value, 'EEEE, MMMM d, yyyy')}
                                                </p>
                                                <p className="text-sm text-emerald-700">
                                                  Holiday will be added to the company calendar
                                                </p>
                                              </div>
                                            </div>
                                            <Badge 
                                              variant="secondary" 
                                              className="bg-emerald-100 text-emerald-800 border-emerald-300 text-sm px-3 py-1 font-semibold"
                                            >
                                              {format(field.value, 'MMM d')}
                                            </Badge>
                                          </div>
                                        </motion.div>
                                      )}
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </CardContent>
                          </Card>
                          
                          {/* Action Buttons */}
                          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-white via-slate-50 to-white">
                            <CardContent className="p-8">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                                <div className="flex items-center space-x-3">
                                  <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-3 rounded-xl">
                                    <CheckCircle2 className="w-6 h-6 text-slate-700" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-bold text-slate-900">Review & Create</h3>
                                    <p className="text-slate-600">Confirm your holiday details and add to calendar</p>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col-reverse lg:flex-row gap-4">
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    onClick={() => setIsAddOpen(false)}
                                    className="h-12 px-8 text-base font-semibold border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    type="submit"
                                    className="h-12 px-8 text-base font-semibold bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                                    disabled={createHolidayMutation.isPending}
                                  >
                                    {createHolidayMutation.isPending && (
                                      <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    )}
                                    Create Holiday
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </form>
                      </Form>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-700 mb-1">Total Holidays</div>
                    <div className="text-3xl font-bold text-blue-900">{totalHolidays}</div>
                    <div className="text-xs text-blue-600 mt-1">Company holidays</div>
                  </div>
                  <div className="bg-blue-500 p-3 rounded-xl">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-emerald-700 mb-1">This Month</div>
                    <div className="text-3xl font-bold text-emerald-900">{thisMonthHolidaysCount}</div>
                    <div className="text-xs text-emerald-600 mt-1">Holidays this month</div>
                  </div>
                  <div className="bg-emerald-500 p-3 rounded-xl">
                    <CalendarDays className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-amber-700 mb-1">Upcoming</div>
                    <div className="text-3xl font-bold text-amber-900">{upcomingHolidaysCount}</div>
                    <div className="text-xs text-amber-600 mt-1">Next 30 days</div>
                  </div>
                  <div className="bg-amber-500 p-3 rounded-xl">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-700 mb-1">Past Events</div>
                    <div className="text-3xl font-bold text-purple-900">{pastHolidaysCount}</div>
                    <div className="text-xs text-purple-600 mt-1">Completed holidays</div>
                  </div>
                  <div className="bg-purple-500 p-3 rounded-xl">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
              <CardHeader className="pb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-3 rounded-xl shadow-md">
                    <CalendarIcon className="w-6 h-6 text-teal-700" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Interactive Calendar</CardTitle>
                    <p className="text-slate-600 text-sm mt-1">View holidays throughout the year</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Year Selector and PDF Download */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <CalendarIcon className="w-4 h-4 text-slate-600" />
                      <Label className="text-sm font-medium text-slate-700">Select Year:</Label>
                    </div>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableYears.map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="bg-teal-100 text-teal-800">
                      {holidaysForSelectedYear.length} holidays
                    </Badge>
                  </div>
                  <Button
                    onClick={generateHolidayPDF}
                    size="sm"
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    className="rounded-xl border-2 border-slate-200 shadow-lg bg-white"
                    modifiers={{
                      holiday: holidayDates
                    }}
                    modifiersStyles={{
                      holiday: {
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        fontWeight: '700',
                        borderRadius: '8px'
                      }
                    }}
                    showOutsideDays={false}
                  />
                </div>
                
                {/* Current month holidays */}
                {currentMonthHolidays.length > 0 && (
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <CalendarDays className="w-5 h-5 text-teal-600" />
                      <h3 className="text-lg font-bold text-slate-900">
                        Holidays in {format(selectedDate, 'MMMM yyyy')}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {currentMonthHolidays.map((holiday, index) => (
                        <div key={holiday.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center space-x-3">
                            <div className="bg-gradient-to-br from-teal-100 to-teal-200 p-2 rounded-lg">
                              <Gift className="w-4 h-4 text-teal-700" />
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900">{holiday.name}</span>
                              {holiday.description && (
                                <p className="text-sm text-slate-600">{holiday.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-slate-700">
                              {format(new Date(holiday.date), 'MMM d')}
                            </span>
                            <div className="text-xs text-slate-500">
                              {format(new Date(holiday.date), 'EEEE')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Holiday Lists Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="space-y-6"
          >
            {/* Today's Holiday */}
            {todayHoliday && (
              <Card className="border-2 border-amber-300 shadow-lg bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-lg font-bold text-amber-900">Today's Holiday</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <HolidayCard holiday={todayHoliday} index={0} variant="today" />
                </CardContent>
              </Card>
            )}
            
            {/* Upcoming Holidays */}
            <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-lg font-bold text-slate-900">Upcoming Holidays</CardTitle>
                  </div>
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                    {upcomingHolidays.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingHolidays.length > 0 ? (
                  upcomingHolidays.slice(0, 3).map((holiday, index) => (
                    <HolidayCard key={holiday.id} holiday={holiday} index={index} variant="upcoming" />
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No upcoming holidays</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Past Holidays */}
            {pastHolidays.length > 0 && (
              <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-slate-600" />
                      <CardTitle className="text-lg font-bold text-slate-900">Recent Past</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-slate-100 text-slate-700">
                      {pastHolidays.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pastHolidays.slice(-2).reverse().map((holiday, index) => (
                    <HolidayCard key={holiday.id} holiday={holiday} index={index} />
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>

        {/* All Holidays Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <Card className="border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white via-slate-50 to-white">
            <CardHeader className="pb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 p-3 rounded-xl shadow-md">
                    <BarChart3 className="w-6 h-6 text-indigo-700" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">All Holidays</CardTitle>
                    <p className="text-slate-600 text-sm mt-1">Complete list of company holidays</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 text-base px-3 py-1">
                  {holidays.length} Total
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={columns} 
                data={holidays} 
                searchColumn="name"
                searchPlaceholder="Search holidays..."
              />
            </CardContent>
          </Card>
        </motion.div>
        
        {/* Edit holiday dialog */}
        {selectedHoliday && (
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Holiday</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 px-1">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Holiday Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter holiday name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date</FormLabel>
                        <div className="w-full flex justify-center">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            className="rounded-md border w-fit"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add description" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsEditOpen(false)}
                      className="w-full sm:w-auto"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto"
                      disabled={updateHolidayMutation.isPending}
                    >
                      {updateHolidayMutation.isPending && (
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      )}
                      Update Holiday
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}