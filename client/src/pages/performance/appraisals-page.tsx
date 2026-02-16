import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TrendingUp, Calendar, Star, Users, FileText, CheckCircle, Clock, Plus, Edit2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Appraisal {
  id: number;
  employee: string;
  department: string;
  manager: string;
  selfRating: number | null;
  managerRating: number | null;
  status: string;
  goals?: string;
  achievements?: string;
  feedback?: string;
}

export default function AppraisalsPage() {
  const { toast } = useToast();
  const [selectedCycle, setSelectedCycle] = useState("Q4 2023");
  const [isNewCycleOpen, setIsNewCycleOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAppraisal, setSelectedAppraisal] = useState<Appraisal | null>(null);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newCycle, setNewCycle] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: ""
  });

  const [appraisals, setAppraisals] = useState<Appraisal[]>([
    { id: 1, employee: "John Doe", department: "Engineering", manager: "Sarah Wilson", selfRating: 4.5, managerRating: 4.2, status: "Completed", goals: "Complete 3 major features", achievements: "Delivered 4 features ahead of schedule", feedback: "Excellent performance, great team player" },
    { id: 2, employee: "Jane Smith", department: "Marketing", manager: "Mike Johnson", selfRating: 4.0, managerRating: null, status: "Manager Review", goals: "Increase brand awareness by 20%", achievements: "Successfully launched 2 campaigns" },
    { id: 3, employee: "Amit Singh", department: "Sales", manager: "Priya Sharma", selfRating: null, managerRating: null, status: "Self Review", goals: "Achieve 120% of sales target" },
    { id: 4, employee: "Sneha Patel", department: "HR", manager: "Tom Brown", selfRating: 4.3, managerRating: 4.5, status: "Completed", goals: "Reduce hiring time by 30%", achievements: "Implemented new ATS system", feedback: "Outstanding work on process improvement" },
    { id: 5, employee: "Rajesh Kumar", department: "Finance", manager: "Lisa Chen", selfRating: 3.8, managerRating: 4.0, status: "Completed", goals: "Streamline reporting process", achievements: "Automated monthly reports", feedback: "Good progress, room for improvement in communication" },
  ]);

  const appraisalStats = [
    { title: "Total Employees", value: appraisals.length.toString(), icon: <Users className="h-5 w-5" /> },
    { title: "Completed", value: appraisals.filter(a => a.status === "Completed").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending", value: appraisals.filter(a => a.status !== "Completed").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Avg Rating", value: (appraisals.filter(a => a.managerRating).reduce((acc, a) => acc + (a.managerRating || 0), 0) / appraisals.filter(a => a.managerRating).length || 0).toFixed(1), icon: <Star className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
  ];

  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "Manager Review": return "bg-blue-100 text-blue-700";
      case "Self Review": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const renderRating = (rating: number | null) => {
    if (rating === null) return <span className="text-slate-400">-</span>;
    return (
      <span className="flex items-center gap-1">
        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
        {rating.toFixed(1)}
      </span>
    );
  };

  const handleCreateCycle = () => {
    if (!newCycle.name || !newCycle.startDate || !newCycle.endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSelectedCycle(newCycle.name);
    setIsNewCycleOpen(false);
    setNewCycle({ name: "", startDate: "", endDate: "", description: "" });
    
    toast({
      title: "Appraisal Cycle Created",
      description: `"${newCycle.name}" cycle has been created successfully.`
    });
  };

  const handleViewAppraisal = (appraisal: Appraisal) => {
    setSelectedAppraisal(appraisal);
    setIsViewDialogOpen(true);
  };

  const handleUpdateAppraisal = () => {
    if (!selectedAppraisal) return;
    
    setAppraisals(appraisals.map(a => a.id === selectedAppraisal.id ? selectedAppraisal : a));
    
    toast({
      title: "Appraisal Updated",
      description: `Appraisal for ${selectedAppraisal.employee} has been updated.`
    });
  };

  const filteredAppraisals = appraisals.filter(appraisal => {
    const matchesDepartment = filterDepartment === "all" || appraisal.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || appraisal.status === filterStatus;
    const matchesSearch = appraisal.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         appraisal.manager.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDepartment && matchesStatus && matchesSearch;
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Performance Appraisals</h1>
            <p className="text-slate-500 mt-1">Manage employee performance reviews and ratings</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedCycle} onValueChange={setSelectedCycle}>
              <SelectTrigger className="w-32" data-testid="select-cycle">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Q4 2023">Q4 2023</SelectItem>
                <SelectItem value="Q3 2023">Q3 2023</SelectItem>
                <SelectItem value="Q2 2023">Q2 2023</SelectItem>
                <SelectItem value="Q1 2023">Q1 2023</SelectItem>
              </SelectContent>
            </Select>
            <Button className="gap-2" data-testid="button-new-cycle" onClick={() => setIsNewCycleOpen(true)}>
              <Plus className="h-4 w-4" />
              New Appraisal Cycle
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {appraisalStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                      <p className="text-sm text-slate-500">{stat.title}</p>
                    </div>
                  </div>
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
                  <TrendingUp className="h-5 w-5 text-teal-600" />
                  Appraisal Status - {selectedCycle}
                </CardTitle>
                <CardDescription>Employee performance review status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search employee..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-40"
                  data-testid="input-search-appraisal"
                />
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-filter-dept">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Manager Review">Manager Review</SelectItem>
                    <SelectItem value="Self Review">Self Review</SelectItem>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Manager</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Self Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Manager Rating</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppraisals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No appraisals found matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredAppraisals.map((appraisal, index) => (
                      <tr key={appraisal.id} className="border-b hover:bg-slate-50" data-testid={`row-appraisal-${index}`}>
                        <td className="py-3 px-4 font-medium">{appraisal.employee}</td>
                        <td className="py-3 px-4 text-slate-600">{appraisal.department}</td>
                        <td className="py-3 px-4 text-slate-600">{appraisal.manager}</td>
                        <td className="py-3 px-4">{renderRating(appraisal.selfRating)}</td>
                        <td className="py-3 px-4">{renderRating(appraisal.managerRating)}</td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(appraisal.status)}>{appraisal.status}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Button size="sm" variant="outline" className="gap-1" data-testid={`button-view-${index}`} onClick={() => handleViewAppraisal(appraisal)}>
                            <FileText className="h-3 w-3" />
                            View
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

      {/* New Appraisal Cycle Dialog */}
      <Dialog open={isNewCycleOpen} onOpenChange={setIsNewCycleOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-teal-600" />
              Create New Appraisal Cycle
            </DialogTitle>
            <DialogDescription>Set up a new performance appraisal period for your organization.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cycleName">Cycle Name *</Label>
              <Input
                id="cycleName"
                placeholder="e.g., Q1 2024"
                value={newCycle.name}
                onChange={(e) => setNewCycle({ ...newCycle, name: e.target.value })}
                data-testid="input-cycle-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newCycle.startDate}
                  onChange={(e) => setNewCycle({ ...newCycle, startDate: e.target.value })}
                  data-testid="input-cycle-start"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newCycle.endDate}
                  onChange={(e) => setNewCycle({ ...newCycle, endDate: e.target.value })}
                  data-testid="input-cycle-end"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="cycleDesc">Description</Label>
              <Textarea
                id="cycleDesc"
                placeholder="Describe the focus areas for this appraisal cycle..."
                value={newCycle.description}
                onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                rows={3}
                data-testid="textarea-cycle-desc"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewCycleOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateCycle} data-testid="button-save-cycle">Create Cycle</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Appraisal Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Appraisal Details - {selectedAppraisal?.employee}
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppraisal && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedAppraisal.employee}</h3>
                  <p className="text-slate-500">{selectedAppraisal.department} | Manager: {selectedAppraisal.manager}</p>
                </div>
                <Badge className={getStatusColor(selectedAppraisal.status)}>{selectedAppraisal.status}</Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-slate-500 text-sm mb-1">Self Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">{selectedAppraisal.selfRating?.toFixed(1) || "Pending"}</span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg text-center">
                  <p className="text-slate-500 text-sm mb-1">Manager Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">{selectedAppraisal.managerRating?.toFixed(1) || "Pending"}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Goals for the Period</Label>
                  <Textarea
                    value={selectedAppraisal.goals || ""}
                    onChange={(e) => setSelectedAppraisal({ ...selectedAppraisal, goals: e.target.value })}
                    rows={2}
                    placeholder="No goals set"
                    data-testid="textarea-goals"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Key Achievements</Label>
                  <Textarea
                    value={selectedAppraisal.achievements || ""}
                    onChange={(e) => setSelectedAppraisal({ ...selectedAppraisal, achievements: e.target.value })}
                    rows={2}
                    placeholder="No achievements recorded"
                    data-testid="textarea-achievements"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Manager Feedback</Label>
                  <Textarea
                    value={selectedAppraisal.feedback || ""}
                    onChange={(e) => setSelectedAppraisal({ ...selectedAppraisal, feedback: e.target.value })}
                    rows={2}
                    placeholder="No feedback provided"
                    data-testid="textarea-feedback"
                  />
                </div>

                {selectedAppraisal.status !== "Completed" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Self Rating (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={selectedAppraisal.selfRating || ""}
                        onChange={(e) => setSelectedAppraisal({ ...selectedAppraisal, selfRating: parseFloat(e.target.value) || null })}
                        placeholder="Enter rating"
                        data-testid="input-self-rating"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Manager Rating (1-5)</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        step="0.1"
                        value={selectedAppraisal.managerRating || ""}
                        onChange={(e) => setSelectedAppraisal({ ...selectedAppraisal, managerRating: parseFloat(e.target.value) || null })}
                        placeholder="Enter rating"
                        data-testid="input-manager-rating"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={handleUpdateAppraisal} data-testid="button-save-appraisal">
              <Edit2 className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
