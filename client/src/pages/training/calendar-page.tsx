import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Clock, Users, MapPin, Video, Search, Filter, Eye, Edit, Trash2, X, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TrainingCalendarPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "In-Person",
    location: "",
    capacity: "",
    description: "",
    instructor: ""
  });

  const [trainingSessions, setTrainingSessions] = useState([
    { id: 1, title: "Leadership Skills Workshop", date: "Feb 5, 2024", time: "10:00 AM - 4:00 PM", type: "In-Person", location: "Conference Room A", enrolled: 25, capacity: 30, instructor: "Dr. Sarah Johnson", description: "Comprehensive leadership skills training for managers" },
    { id: 2, title: "Advanced Excel Training", date: "Feb 8, 2024", time: "2:00 PM - 5:00 PM", type: "Online", location: "Zoom", enrolled: 45, capacity: 50, instructor: "Mike Chen", description: "Master advanced Excel formulas and automation" },
    { id: 3, title: "Project Management Fundamentals", date: "Feb 12, 2024", time: "9:00 AM - 1:00 PM", type: "In-Person", location: "Training Hall", enrolled: 18, capacity: 20, instructor: "Emily Davis", description: "Learn core project management principles and tools" },
    { id: 4, title: "Communication Skills", date: "Feb 15, 2024", time: "11:00 AM - 3:00 PM", type: "Online", location: "MS Teams", enrolled: 32, capacity: 40, instructor: "Robert Wilson", description: "Enhance verbal and written communication abilities" },
    { id: 5, title: "Data Analytics Basics", date: "Feb 20, 2024", time: "10:00 AM - 5:00 PM", type: "In-Person", location: "IT Lab", enrolled: 15, capacity: 15, instructor: "Anna Lee", description: "Introduction to data analysis and visualization" },
  ]);

  const trainingStats = [
    { title: "Upcoming Sessions", value: trainingSessions.length.toString(), icon: <Calendar className="h-5 w-5" /> },
    { title: "This Month", value: trainingSessions.filter(s => s.date.includes("Feb")).length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
    { title: "Total Enrolled", value: trainingSessions.reduce((sum, s) => sum + s.enrolled, 0).toString(), icon: <Users className="h-5 w-5" />, color: "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" },
    { title: "Online Sessions", value: trainingSessions.filter(s => s.type === "Online").length.toString(), icon: <Video className="h-5 w-5" />, color: "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
  ];

  const filteredSessions = trainingSessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          session.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || session.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleAddSession = () => {
    if (!formData.title || !formData.date || !formData.capacity) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const newSession = {
      id: trainingSessions.length + 1,
      title: formData.title,
      date: formData.date,
      time: `${formData.startTime} - ${formData.endTime}`,
      type: formData.type,
      location: formData.location,
      enrolled: 0,
      capacity: parseInt(formData.capacity),
      instructor: formData.instructor,
      description: formData.description
    };
    setTrainingSessions([...trainingSessions, newSession]);
    setShowAddDialog(false);
    resetForm();
    toast({ title: "Success", description: "Training session scheduled successfully" });
  };

  const handleEditSession = () => {
    if (!selectedSession) return;
    const updatedSessions = trainingSessions.map(session =>
      session.id === selectedSession.id ? {
        ...session,
        title: formData.title,
        date: formData.date,
        time: `${formData.startTime} - ${formData.endTime}`,
        type: formData.type,
        location: formData.location,
        capacity: parseInt(formData.capacity),
        instructor: formData.instructor,
        description: formData.description
      } : session
    );
    setTrainingSessions(updatedSessions);
    setShowEditDialog(false);
    resetForm();
    toast({ title: "Success", description: "Training session updated successfully" });
  };

  const handleDeleteSession = () => {
    if (!selectedSession) return;
    setTrainingSessions(trainingSessions.filter(s => s.id !== selectedSession.id));
    setShowDeleteDialog(false);
    setSelectedSession(null);
    toast({ title: "Success", description: "Training session deleted successfully" });
  };

  const handleEnroll = (session: any) => {
    const updatedSessions = trainingSessions.map(s =>
      s.id === session.id ? { ...s, enrolled: s.enrolled + 1 } : s
    );
    setTrainingSessions(updatedSessions);
    toast({ title: "Success", description: `Successfully enrolled in ${session.title}` });
  };

  const resetForm = () => {
    setFormData({ title: "", date: "", startTime: "", endTime: "", type: "In-Person", location: "", capacity: "", description: "", instructor: "" });
  };

  const openEditDialog = (session: any) => {
    setSelectedSession(session);
    const [startTime, endTime] = session.time.split(" - ");
    setFormData({
      title: session.title,
      date: session.date,
      startTime: startTime || "",
      endTime: endTime || "",
      type: session.type,
      location: session.location,
      capacity: session.capacity.toString(),
      description: session.description || "",
      instructor: session.instructor || ""
    });
    setShowEditDialog(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Training Calendar</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage upcoming training sessions</p>
          </div>
          <Button className="gap-2" data-testid="button-add-training" onClick={() => { resetForm(); setShowAddDialog(true); }}>
            <Plus className="h-4 w-4" />
            Schedule Training
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {trainingStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-stat-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${stat.color || "bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400"}`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{stat.title}</p>
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
                  <Calendar className="h-5 w-5 text-teal-600" />
                  Upcoming Training Sessions
                </CardTitle>
                <CardDescription>Scheduled training programs</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search sessions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-type-filter">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No training sessions found</div>
              ) : (
                filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    data-testid={`row-session-${index}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{session.title}</h3>
                          <Badge variant={session.type === "Online" ? "secondary" : "default"}>
                            {session.type === "Online" ? <Video className="h-3 w-3 mr-1" /> : <MapPin className="h-3 w-3 mr-1" />}
                            {session.type}
                          </Badge>
                          {session.enrolled >= session.capacity && (
                            <Badge variant="destructive">Full</Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {session.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {session.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {session.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {session.enrolled}/{session.capacity} enrolled
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" data-testid={`button-view-${index}`} onClick={() => { setSelectedSession(session); setShowViewDialog(true); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-${index}`} onClick={() => openEditDialog(session)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-${index}`} onClick={() => { setSelectedSession(session); setShowDeleteDialog(true); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {session.enrolled < session.capacity && (
                          <Button size="sm" data-testid={`button-enroll-${index}`} onClick={() => handleEnroll(session)}>
                            Enroll
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

      {/* Add Training Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Training</DialogTitle>
            <DialogDescription>Create a new training session</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Training title" data-testid="input-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} data-testid="input-date" />
              </div>
              <div>
                <Label>Capacity *</Label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} placeholder="30" data-testid="input-capacity" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} data-testid="input-start-time" />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} data-testid="input-end-time" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger data-testid="select-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="Conference Room / Zoom" data-testid="input-location" />
              </div>
            </div>
            <div>
              <Label>Instructor</Label>
              <Input value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} placeholder="Instructor name" data-testid="input-instructor" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Training description..." data-testid="input-description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSession} data-testid="button-submit-training">Schedule Training</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Training Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedSession?.title}</DialogTitle>
            <DialogDescription>Training session details</DialogDescription>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Date</p>
                  <p className="font-medium">{selectedSession.date}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Time</p>
                  <p className="font-medium">{selectedSession.time}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Type</p>
                  <Badge variant={selectedSession.type === "Online" ? "secondary" : "default"}>{selectedSession.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Location</p>
                  <p className="font-medium">{selectedSession.location}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Instructor</p>
                  <p className="font-medium">{selectedSession.instructor}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Enrollment</p>
                  <p className="font-medium">{selectedSession.enrolled}/{selectedSession.capacity}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Description</p>
                <p className="font-medium">{selectedSession.description}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Training Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Training Session</DialogTitle>
            <DialogDescription>Update training details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title *</Label>
              <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} data-testid="input-edit-title" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} data-testid="input-edit-date" />
              </div>
              <div>
                <Label>Capacity *</Label>
                <Input type="number" value={formData.capacity} onChange={(e) => setFormData({...formData, capacity: e.target.value})} data-testid="input-edit-capacity" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="In-Person">In-Person</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Location</Label>
                <Input value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Instructor</Label>
              <Input value={formData.instructor} onChange={(e) => setFormData({...formData, instructor: e.target.value})} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditSession} data-testid="button-update-training">Update Training</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Training Session</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{selectedSession?.title}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSession} data-testid="button-confirm-delete">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
