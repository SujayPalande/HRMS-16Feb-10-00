import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Target, Plus, TrendingUp, Clock, CheckCircle, AlertCircle, X, Calendar, Users, Edit2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: number;
  title: string;
  kpi: string;
  owner: string;
  progress: number;
  dueDate: string;
  status: string;
  description?: string;
  priority?: string;
}

export default function GoalsPage() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newGoal, setNewGoal] = useState({
    title: "",
    kpi: "",
    owner: "",
    dueDate: "",
    priority: "medium",
    description: ""
  });

  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: "Increase Sales by 20%", kpi: "Revenue Growth", owner: "Sales Team", progress: 75, dueDate: "Mar 31, 2024", status: "On Track", description: "Increase overall sales revenue by 20% through new customer acquisition and upselling to existing customers.", priority: "high" },
    { id: 2, title: "Launch New Product Feature", kpi: "Product Delivery", owner: "Engineering", progress: 45, dueDate: "Feb 28, 2024", status: "At Risk", description: "Develop and launch the new dashboard feature with real-time analytics capabilities.", priority: "high" },
    { id: 3, title: "Improve Customer Satisfaction", kpi: "NPS Score", owner: "Support Team", progress: 90, dueDate: "Jan 31, 2024", status: "Completed", description: "Achieve NPS score of 50+ through improved customer support and faster response times.", priority: "medium" },
    { id: 4, title: "Reduce Operational Costs", kpi: "Cost Reduction", owner: "Operations", progress: 60, dueDate: "Apr 30, 2024", status: "On Track", description: "Reduce operational costs by 15% through process optimization and automation.", priority: "medium" },
    { id: 5, title: "Employee Training Program", kpi: "Training Completion", owner: "HR Team", progress: 30, dueDate: "Mar 15, 2024", status: "Behind", description: "Complete mandatory training for all employees on new compliance regulations.", priority: "low" },
  ]);

  const goalStats = [
    { title: "Total Goals", value: goals.length.toString(), icon: <Target className="h-5 w-5" />, color: "bg-teal-50 text-teal-600" },
    { title: "Completed", value: goals.filter(g => g.status === "Completed").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "In Progress", value: goals.filter(g => g.status === "On Track" || g.status === "At Risk").length.toString(), icon: <TrendingUp className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    { title: "Overdue", value: goals.filter(g => g.status === "Behind").length.toString(), icon: <AlertCircle className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "On Track": return "bg-blue-100 text-blue-700";
      case "At Risk": return "bg-yellow-100 text-yellow-700";
      case "Behind": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "low": return "bg-green-100 text-green-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleAddGoal = () => {
    if (!newGoal.title || !newGoal.kpi || !newGoal.owner || !newGoal.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    const goal: Goal = {
      id: goals.length + 1,
      title: newGoal.title,
      kpi: newGoal.kpi,
      owner: newGoal.owner,
      progress: 0,
      dueDate: new Date(newGoal.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "On Track",
      description: newGoal.description,
      priority: newGoal.priority
    };

    setGoals([...goals, goal]);
    setIsAddDialogOpen(false);
    setNewGoal({ title: "", kpi: "", owner: "", dueDate: "", priority: "medium", description: "" });
    
    toast({
      title: "Goal Created",
      description: `"${goal.title}" has been added successfully.`
    });
  };

  const handleViewDetails = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsEditMode(false);
    setIsViewDialogOpen(true);
  };

  const handleUpdateGoal = () => {
    if (!selectedGoal) return;
    
    setGoals(goals.map(g => g.id === selectedGoal.id ? selectedGoal : g));
    setIsEditMode(false);
    
    toast({
      title: "Goal Updated",
      description: `"${selectedGoal.title}" has been updated successfully.`
    });
  };

  const handleDeleteGoal = (goalId: number) => {
    const goal = goals.find(g => g.id === goalId);
    setGoals(goals.filter(g => g.id !== goalId));
    setIsViewDialogOpen(false);
    
    toast({
      title: "Goal Deleted",
      description: `"${goal?.title}" has been deleted.`
    });
  };

  const filteredGoals = goals.filter(goal => {
    const matchesStatus = filterStatus === "all" || goal.status === filterStatus;
    const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         goal.kpi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Goals & KPIs</h1>
            <p className="text-slate-500 mt-1">Set and track organizational goals and key performance indicators</p>
          </div>
          <Button className="gap-2" data-testid="button-add-goal" onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add New Goal
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {goalStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color}`}>
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-teal-600" />
                  Active Goals
                </CardTitle>
                <CardDescription>Track progress on organizational objectives</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search goals..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-48"
                  data-testid="input-search-goals"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-filter-status">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="On Track">On Track</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Behind">Behind</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredGoals.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No goals found matching your criteria.
                </div>
              ) : (
                filteredGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    data-testid={`row-goal-${index}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900">{goal.title}</h3>
                          <Badge className={getStatusColor(goal.status)}>{goal.status}</Badge>
                          {goal.priority && (
                            <Badge className={getPriorityColor(goal.priority)} variant="outline">
                              {goal.priority.charAt(0).toUpperCase() + goal.priority.slice(1)} Priority
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-3">
                          <span>KPI: {goal.kpi}</span>
                          <span>Owner: {goal.owner}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {goal.dueDate}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Progress</span>
                            <span className="font-medium">{goal.progress}%</span>
                          </div>
                          <Progress value={goal.progress} className="h-2" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" data-testid={`button-view-${index}`} onClick={() => handleViewDetails(goal)}>
                        View Details
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Goal Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              Add New Goal
            </DialogTitle>
            <DialogDescription>Create a new organizational goal or KPI to track.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                placeholder="Enter goal title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                data-testid="input-goal-title"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="kpi">KPI / Metric *</Label>
              <Input
                id="kpi"
                placeholder="e.g., Revenue Growth, Customer Satisfaction"
                value={newGoal.kpi}
                onChange={(e) => setNewGoal({ ...newGoal, kpi: e.target.value })}
                data-testid="input-goal-kpi"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner">Owner *</Label>
                <Input
                  id="owner"
                  placeholder="Team or person"
                  value={newGoal.owner}
                  onChange={(e) => setNewGoal({ ...newGoal, owner: e.target.value })}
                  data-testid="input-goal-owner"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={newGoal.priority} onValueChange={(val) => setNewGoal({ ...newGoal, priority: val })}>
                  <SelectTrigger data-testid="select-goal-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={newGoal.dueDate}
                onChange={(e) => setNewGoal({ ...newGoal, dueDate: e.target.value })}
                data-testid="input-goal-duedate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the goal and success criteria..."
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                rows={3}
                data-testid="textarea-goal-description"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGoal} data-testid="button-save-goal">Create Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View/Edit Goal Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-teal-600" />
              {isEditMode ? "Edit Goal" : "Goal Details"}
            </DialogTitle>
          </DialogHeader>
          
          {selectedGoal && (
            <div className="space-y-4 py-4">
              {isEditMode ? (
                <>
                  <div className="space-y-2">
                    <Label>Goal Title</Label>
                    <Input
                      value={selectedGoal.title}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, title: e.target.value })}
                      data-testid="input-edit-title"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>KPI / Metric</Label>
                    <Input
                      value={selectedGoal.kpi}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, kpi: e.target.value })}
                      data-testid="input-edit-kpi"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Owner</Label>
                      <Input
                        value={selectedGoal.owner}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, owner: e.target.value })}
                        data-testid="input-edit-owner"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Progress (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedGoal.progress}
                        onChange={(e) => setSelectedGoal({ ...selectedGoal, progress: parseInt(e.target.value) || 0 })}
                        data-testid="input-edit-progress"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select 
                      value={selectedGoal.status} 
                      onValueChange={(val) => setSelectedGoal({ ...selectedGoal, status: val })}
                    >
                      <SelectTrigger data-testid="select-edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="On Track">On Track</SelectItem>
                        <SelectItem value="At Risk">At Risk</SelectItem>
                        <SelectItem value="Behind">Behind</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={selectedGoal.description || ""}
                      onChange={(e) => setSelectedGoal({ ...selectedGoal, description: e.target.value })}
                      rows={3}
                      data-testid="textarea-edit-description"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge className={getStatusColor(selectedGoal.status)}>{selectedGoal.status}</Badge>
                    {selectedGoal.priority && (
                      <Badge className={getPriorityColor(selectedGoal.priority)} variant="outline">
                        {selectedGoal.priority.charAt(0).toUpperCase() + selectedGoal.priority.slice(1)} Priority
                      </Badge>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{selectedGoal.title}</h3>
                    {selectedGoal.description && (
                      <p className="text-slate-600 mt-2">{selectedGoal.description}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500">KPI / Metric</p>
                      <p className="font-medium">{selectedGoal.kpi}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500">Owner</p>
                      <p className="font-medium">{selectedGoal.owner}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500">Due Date</p>
                      <p className="font-medium">{selectedGoal.dueDate}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-slate-500">Progress</p>
                      <p className="font-medium">{selectedGoal.progress}%</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Progress</p>
                    <Progress value={selectedGoal.progress} className="h-3" />
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                <Button onClick={handleUpdateGoal} data-testid="button-update-goal">Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteGoal(selectedGoal!.id)} data-testid="button-delete-goal">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setIsEditMode(true)} data-testid="button-edit-goal">
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
