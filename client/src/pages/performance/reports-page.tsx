import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BarChart3, Download, Calendar, TrendingUp, Users, Star, Award, FileText, PieChart, Target, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DepartmentPerformance {
  department: string;
  avgRating: number;
  goalCompletion: number;
  employees: number;
  topPerformer?: string;
  totalGoals?: number;
  completedGoals?: number;
}

export default function PerformanceReportsPage() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("2023");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentPerformance | null>(null);

  const reportCards = [
    { title: "Department Performance", description: "Compare performance across departments", icon: <Users className="h-6 w-6" />, type: "department" },
    { title: "Rating Distribution", description: "Distribution of performance ratings", icon: <Star className="h-6 w-6" />, type: "rating" },
    { title: "Goal Achievement", description: "Track goal completion rates", icon: <TrendingUp className="h-6 w-6" />, type: "goals" },
    { title: "Top Performers", description: "Identify high-performing employees", icon: <Award className="h-6 w-6" />, type: "performers" },
  ];

  const departmentPerformance: DepartmentPerformance[] = [
    { department: "Engineering", avgRating: 4.3, goalCompletion: 85, employees: 45, topPerformer: "John Doe", totalGoals: 12, completedGoals: 10 },
    { department: "Marketing", avgRating: 4.1, goalCompletion: 78, employees: 22, topPerformer: "Jane Smith", totalGoals: 8, completedGoals: 6 },
    { department: "Sales", avgRating: 4.5, goalCompletion: 92, employees: 35, topPerformer: "Amit Singh", totalGoals: 15, completedGoals: 14 },
    { department: "HR", avgRating: 4.2, goalCompletion: 88, employees: 12, topPerformer: "Sneha Patel", totalGoals: 6, completedGoals: 5 },
    { department: "Finance", avgRating: 4.0, goalCompletion: 82, employees: 18, topPerformer: "Rajesh Kumar", totalGoals: 9, completedGoals: 7 },
  ];

  const periods = ["2023", "2022", "2021", "2020"];
  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];

  const handleExport = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 128, 128);
    doc.text("Performance Report", 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Period: ${selectedPeriod}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 40);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Department Performance Summary", 14, 55);
    
    const tableData = filteredPerformance.map(dept => [
      dept.department,
      dept.employees.toString(),
      dept.avgRating.toFixed(1),
      `${dept.goalCompletion}%`,
      dept.topPerformer || "N/A"
    ]);
    
    autoTable(doc, {
      startY: 60,
      head: [["Department", "Employees", "Avg Rating", "Goal Completion", "Top Performer"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 128, 128] },
      styles: { fontSize: 10 }
    });
    
    const summaryY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Summary Statistics", 14, summaryY);
    
    const totalEmployees = filteredPerformance.reduce((acc, d) => acc + d.employees, 0);
    const avgRating = (filteredPerformance.reduce((acc, d) => acc + d.avgRating, 0) / filteredPerformance.length).toFixed(2);
    const avgGoalCompletion = (filteredPerformance.reduce((acc, d) => acc + d.goalCompletion, 0) / filteredPerformance.length).toFixed(1);
    
    doc.setFontSize(11);
    doc.setTextColor(60);
    doc.text(`Total Employees: ${totalEmployees}`, 14, summaryY + 10);
    doc.text(`Average Rating: ${avgRating}`, 14, summaryY + 18);
    doc.text(`Average Goal Completion: ${avgGoalCompletion}%`, 14, summaryY + 26);
    
    doc.save(`performance-report-${selectedPeriod}.pdf`);
    
    toast({
      title: "Report Exported",
      description: `Performance report for ${selectedPeriod} has been downloaded.`
    });
  };

  const handleViewDetails = (dept: DepartmentPerformance) => {
    setSelectedDepartment(dept);
    setIsViewDetailsOpen(true);
  };

  const handleReportCardClick = (type: string) => {
    toast({
      title: "Report Selected",
      description: `Opening ${type} report view...`
    });
  };

  const filteredPerformance = departmentPerformance.filter(dept => {
    const matchesDepartment = filterDepartment === "all" || dept.department === filterDepartment;
    const matchesSearch = dept.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (dept.topPerformer?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesDepartment && matchesSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Performance Reports</h1>
            <p className="text-slate-500 mt-1">Analytics and insights on employee performance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-28" data-testid="select-period">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period} value={period}>{period}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" data-testid="button-export" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reportCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className="hover-elevate cursor-pointer" 
                data-testid={`card-report-${index}`}
                onClick={() => handleReportCardClick(card.type)}
              >
                <CardContent className="p-6">
                  <div className="p-3 rounded-lg bg-teal-50 text-teal-600 w-fit mb-4">
                    {card.icon}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-500">{card.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-teal-600" />
                  Department Performance Summary
                </CardTitle>
                <CardDescription>Performance metrics by department for {selectedPeriod}</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-40"
                  data-testid="input-search-report"
                />
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-filter-dept">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employees</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Avg Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Goal Completion</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerformance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        No departments found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPerformance.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-slate-50" data-testid={`row-dept-${index}`}>
                        <td className="py-3 px-4 font-medium">{dept.department}</td>
                        <td className="py-3 px-4 text-slate-600">{dept.employees}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            {dept.avgRating.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={dept.goalCompletion >= 85 ? "default" : "secondary"}>
                            {dept.goalCompletion}%
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" data-testid={`button-view-${index}`} onClick={() => handleViewDetails(dept)}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-teal-600" />
              {selectedDepartment?.department} Performance Details
            </DialogTitle>
            <DialogDescription>Detailed performance metrics for {selectedPeriod}</DialogDescription>
          </DialogHeader>
          
          {selectedDepartment && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <Users className="h-6 w-6 text-teal-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedDepartment.employees}</p>
                  <p className="text-sm text-slate-500">Total Employees</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <Star className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedDepartment.avgRating.toFixed(1)}</p>
                  <p className="text-sm text-slate-500">Average Rating</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{selectedDepartment.goalCompletion}%</p>
                  <p className="text-sm text-slate-500">Goal Completion</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <p className="text-lg font-bold">{selectedDepartment.topPerformer}</p>
                  <p className="text-sm text-slate-500">Top Performer</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Goal Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed Goals</span>
                    <span className="font-medium">{selectedDepartment.completedGoals}/{selectedDepartment.totalGoals}</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-teal-600 rounded-full transition-all" 
                      style={{ width: `${(selectedDepartment.completedGoals || 0) / (selectedDepartment.totalGoals || 1) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Performance Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Exceeds Expectations</span>
                    <Badge className="bg-green-100 text-green-700">30%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">Meets Expectations</span>
                    <Badge className="bg-blue-100 text-blue-700">55%</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Needs Improvement</span>
                    <Badge className="bg-yellow-100 text-yellow-700">15%</Badge>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDetailsOpen(false)}>Close</Button>
            <Button onClick={() => {
              handleExport();
              setIsViewDetailsOpen(false);
            }}>
              <Download className="h-4 w-4 mr-1" />
              Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
