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
import { Checkbox } from "@/components/ui/checkbox";
import { Award, Plus, Users, MessageSquare, Star, CheckCircle, Clock, Send, Eye, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackRequest {
  id: number;
  employee: string;
  department: string;
  reviewers: string[];
  responsesReceived: number;
  totalReviewers: number;
  status: string;
  feedbackData?: {
    reviewer: string;
    rating: number;
    strengths: string;
    improvements: string;
  }[];
}

export default function FeedbackPage() {
  const { toast } = useToast();
  const [isNewReviewOpen, setIsNewReviewOpen] = useState(false);
  const [isViewResultsOpen, setIsViewResultsOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newReview, setNewReview] = useState({
    employee: "",
    department: "",
    reviewerTypes: [] as string[],
    dueDate: "",
    instructions: ""
  });

  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([
    { 
      id: 1,
      employee: "John Doe", 
      department: "Engineering", 
      reviewers: ["Manager", "Peers", "Direct Reports"], 
      responsesReceived: 8,
      totalReviewers: 10,
      status: "In Progress",
      feedbackData: [
        { reviewer: "Sarah Wilson (Manager)", rating: 4.5, strengths: "Strong technical skills, excellent problem solver", improvements: "Could improve on documentation" },
        { reviewer: "Mike Chen (Peer)", rating: 4.3, strengths: "Great collaborator, always willing to help", improvements: "Sometimes takes on too much work" },
        { reviewer: "Lisa Park (Peer)", rating: 4.6, strengths: "Innovative ideas, thorough code reviews", improvements: "Could communicate more proactively" },
      ]
    },
    { 
      id: 2,
      employee: "Jane Smith", 
      department: "Marketing", 
      reviewers: ["Manager", "Peers"], 
      responsesReceived: 5,
      totalReviewers: 5,
      status: "Completed",
      feedbackData: [
        { reviewer: "Tom Brown (Manager)", rating: 4.8, strengths: "Creative campaigns, strong leadership", improvements: "Time management on large projects" },
        { reviewer: "Alex Kumar (Peer)", rating: 4.5, strengths: "Great team player, excellent communication", improvements: "Could delegate more effectively" },
      ]
    },
    { 
      id: 3,
      employee: "Mike Johnson", 
      department: "Sales", 
      reviewers: ["Manager", "Peers", "Direct Reports"], 
      responsesReceived: 3,
      totalReviewers: 12,
      status: "In Progress"
    },
    { 
      id: 4,
      employee: "Sarah Wilson", 
      department: "HR", 
      reviewers: ["Manager", "Peers"], 
      responsesReceived: 0,
      totalReviewers: 6,
      status: "Not Started"
    },
  ]);

  const feedbackStats = [
    { title: "Active Reviews", value: feedbackRequests.filter(f => f.status === "In Progress").length.toString(), icon: <MessageSquare className="h-5 w-5" /> },
    { title: "Completed", value: feedbackRequests.filter(f => f.status === "Completed").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending Response", value: feedbackRequests.filter(f => f.status === "Not Started").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "Avg Rating", value: "4.3", icon: <Star className="h-5 w-5" />, color: "bg-amber-50 text-amber-600" },
  ];

  const reviewerTypeOptions = ["Manager", "Peers", "Direct Reports", "Cross-functional"];
  const departments = ["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Not Started": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const handleReviewerTypeChange = (type: string, checked: boolean) => {
    if (checked) {
      setNewReview({ ...newReview, reviewerTypes: [...newReview.reviewerTypes, type] });
    } else {
      setNewReview({ ...newReview, reviewerTypes: newReview.reviewerTypes.filter(t => t !== type) });
    }
  };

  const handleCreateReview = () => {
    if (!newReview.employee || !newReview.department || newReview.reviewerTypes.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one reviewer type.",
        variant: "destructive"
      });
      return;
    }

    const review: FeedbackRequest = {
      id: feedbackRequests.length + 1,
      employee: newReview.employee,
      department: newReview.department,
      reviewers: newReview.reviewerTypes,
      responsesReceived: 0,
      totalReviewers: newReview.reviewerTypes.length * 3,
      status: "Not Started"
    };

    setFeedbackRequests([...feedbackRequests, review]);
    setIsNewReviewOpen(false);
    setNewReview({ employee: "", department: "", reviewerTypes: [], dueDate: "", instructions: "" });
    
    toast({
      title: "360 Review Created",
      description: `Feedback review for ${review.employee} has been initiated.`
    });
  };

  const handleViewResults = (feedback: FeedbackRequest) => {
    setSelectedFeedback(feedback);
    setIsViewResultsOpen(true);
  };

  const handleSendReminder = (feedback: FeedbackRequest) => {
    toast({
      title: "Reminder Sent",
      description: `Reminder emails have been sent to pending reviewers for ${feedback.employee}'s 360 feedback.`
    });
  };

  const filteredFeedback = feedbackRequests.filter(feedback => {
    const matchesStatus = filterStatus === "all" || feedback.status === filterStatus;
    const matchesSearch = feedback.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feedback.department.toLowerCase().includes(searchQuery.toLowerCase());
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">360° Feedback</h1>
            <p className="text-slate-500 mt-1">Collect comprehensive feedback from multiple sources</p>
          </div>
          <Button className="gap-2" data-testid="button-new-review" onClick={() => setIsNewReviewOpen(true)}>
            <Plus className="h-4 w-4" />
            New 360° Review
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {feedbackStats.map((stat, index) => (
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-teal-600" />
                  Active 360° Reviews
                </CardTitle>
                <CardDescription>Track feedback collection progress</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-40"
                  data-testid="input-search-feedback"
                />
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full sm:w-36" data-testid="select-filter-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredFeedback.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No feedback reviews found matching your criteria.
                </div>
              ) : (
                filteredFeedback.map((feedback, index) => (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    data-testid={`row-feedback-${index}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-900">{feedback.employee}</h3>
                          <Badge className={getStatusColor(feedback.status)}>{feedback.status}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{feedback.department}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {feedback.reviewers.map((reviewer, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{reviewer}</Badge>
                          ))}
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600">Responses: {feedback.responsesReceived}/{feedback.totalReviewers}</span>
                            <span className="font-medium">{Math.round((feedback.responsesReceived / feedback.totalReviewers) * 100)}%</span>
                          </div>
                          <Progress value={(feedback.responsesReceived / feedback.totalReviewers) * 100} className="h-2" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-view-${index}`} onClick={() => handleViewResults(feedback)}>
                          <Eye className="h-4 w-4 mr-1" />
                          View Results
                        </Button>
                        {feedback.status !== "Completed" && (
                          <Button size="sm" data-testid={`button-remind-${index}`} onClick={() => handleSendReminder(feedback)}>
                            <Bell className="h-4 w-4 mr-1" />
                            Send Reminder
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New 360 Review Dialog */}
      <Dialog open={isNewReviewOpen} onOpenChange={setIsNewReviewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              Create New 360° Review
            </DialogTitle>
            <DialogDescription>Initiate a comprehensive feedback review for an employee.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee Name *</Label>
              <Input
                id="employee"
                placeholder="Enter employee name"
                value={newReview.employee}
                onChange={(e) => setNewReview({ ...newReview, employee: e.target.value })}
                data-testid="input-review-employee"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select value={newReview.department} onValueChange={(val) => setNewReview({ ...newReview, department: val })}>
                <SelectTrigger data-testid="select-review-dept">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Reviewer Types *</Label>
              <div className="grid grid-cols-2 gap-2">
                {reviewerTypeOptions.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={type}
                      checked={newReview.reviewerTypes.includes(type)}
                      onCheckedChange={(checked) => handleReviewerTypeChange(type, checked as boolean)}
                      data-testid={`checkbox-${type.toLowerCase().replace(" ", "-")}`}
                    />
                    <Label htmlFor={type} className="text-sm font-normal cursor-pointer">{type}</Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={newReview.dueDate}
                onChange={(e) => setNewReview({ ...newReview, dueDate: e.target.value })}
                data-testid="input-review-duedate"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions for Reviewers</Label>
              <Textarea
                id="instructions"
                placeholder="Add any specific instructions or focus areas for reviewers..."
                value={newReview.instructions}
                onChange={(e) => setNewReview({ ...newReview, instructions: e.target.value })}
                rows={3}
                data-testid="textarea-review-instructions"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewReviewOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReview} data-testid="button-create-review">
              <Send className="h-4 w-4 mr-1" />
              Create Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Results Dialog */}
      <Dialog open={isViewResultsOpen} onOpenChange={setIsViewResultsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-teal-600" />
              360° Feedback Results - {selectedFeedback?.employee}
            </DialogTitle>
          </DialogHeader>
          
          {selectedFeedback && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedFeedback.employee}</h3>
                  <p className="text-slate-500">{selectedFeedback.department}</p>
                </div>
                <Badge className={getStatusColor(selectedFeedback.status)}>{selectedFeedback.status}</Badge>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Responses</p>
                  <p className="text-2xl font-bold">{selectedFeedback.responsesReceived}/{selectedFeedback.totalReviewers}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Completion</p>
                  <p className="text-2xl font-bold">{Math.round((selectedFeedback.responsesReceived / selectedFeedback.totalReviewers) * 100)}%</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Avg Rating</p>
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    <span className="text-2xl font-bold">
                      {selectedFeedback.feedbackData?.length 
                        ? (selectedFeedback.feedbackData.reduce((acc, f) => acc + f.rating, 0) / selectedFeedback.feedbackData.length).toFixed(1)
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Reviewer Types</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFeedback.reviewers.map((reviewer, i) => (
                    <Badge key={i} variant="outline">{reviewer}</Badge>
                  ))}
                </div>
              </div>
              
              {selectedFeedback.feedbackData && selectedFeedback.feedbackData.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Feedback Responses</h4>
                  <div className="space-y-4">
                    {selectedFeedback.feedbackData.map((feedback, index) => (
                      <div key={index} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{feedback.reviewer}</span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <span className="font-medium">{feedback.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-green-600 font-medium">Strengths: </span>
                            <span className="text-slate-600">{feedback.strengths}</span>
                          </div>
                          <div>
                            <span className="text-orange-600 font-medium">Areas for Improvement: </span>
                            <span className="text-slate-600">{feedback.improvements}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!selectedFeedback.feedbackData || selectedFeedback.feedbackData.length === 0) && (
                <div className="text-center py-8 text-slate-500">
                  No feedback responses received yet.
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewResultsOpen(false)}>Close</Button>
            {selectedFeedback?.status !== "Completed" && (
              <Button onClick={() => { handleSendReminder(selectedFeedback!); setIsViewResultsOpen(false); }}>
                <Bell className="h-4 w-4 mr-1" />
                Send Reminder
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
