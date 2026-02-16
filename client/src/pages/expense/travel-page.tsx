import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Truck, Plus, MapPin, Calendar, Clock, CheckCircle, Eye, Search, X, FileText, Plane, Hotel, Car } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TravelRequest {
  id: number;
  employee: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  status: "Pending" | "Approved" | "Rejected";
  travelMode?: string;
  accommodation?: string;
  estimatedBudget?: number;
  notes?: string;
}

export default function TravelRequestsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [travelRequests, setTravelRequests] = useState<TravelRequest[]>([
    { id: 1, employee: "John Doe", destination: "Mumbai → Delhi", purpose: "Client Meeting", startDate: "Feb 5, 2024", endDate: "Feb 7, 2024", status: "Approved", travelMode: "Flight", accommodation: "Hotel Taj", estimatedBudget: 45000, notes: "Important client presentation" },
    { id: 2, employee: "Jane Smith", destination: "Bangalore → Chennai", purpose: "Training Workshop", startDate: "Feb 10, 2024", endDate: "Feb 12, 2024", status: "Pending", travelMode: "Train", accommodation: "Guest House", estimatedBudget: 25000, notes: "Technical training session" },
    { id: 3, employee: "Mike Johnson", destination: "Pune → Hyderabad", purpose: "Sales Conference", startDate: "Feb 15, 2024", endDate: "Feb 18, 2024", status: "Approved", travelMode: "Flight", accommodation: "Hotel Marriott", estimatedBudget: 55000, notes: "Annual sales meet" },
    { id: 4, employee: "Sarah Wilson", destination: "Delhi → Kolkata", purpose: "HR Summit", startDate: "Feb 20, 2024", endDate: "Feb 22, 2024", status: "Pending", travelMode: "Flight", accommodation: "Hotel ITC", estimatedBudget: 40000, notes: "HR conference" },
    { id: 5, employee: "Tom Brown", destination: "Mumbai → Goa", purpose: "Team Offsite", startDate: "Feb 25, 2024", endDate: "Feb 28, 2024", status: "Pending", travelMode: "Bus", accommodation: "Resort", estimatedBudget: 35000, notes: "Team building activities" },
  ]);

  const [newRequest, setNewRequest] = useState({
    employee: "",
    fromCity: "",
    toCity: "",
    purpose: "",
    startDate: "",
    endDate: "",
    travelMode: "",
    accommodation: "",
    estimatedBudget: "",
    notes: ""
  });

  const travelStats = [
    { title: "Total Requests", value: travelRequests.length.toString(), icon: <Truck className="h-5 w-5" /> },
    { title: "Approved", value: travelRequests.filter(r => r.status === "Approved").length.toString(), icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Pending", value: travelRequests.filter(r => r.status === "Pending").length.toString(), icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "This Month", value: travelRequests.length.toString(), icon: <Calendar className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved": return "bg-green-100 text-green-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      case "Rejected": return "bg-red-100 text-red-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const filteredRequests = travelRequests.filter(request => {
    const matchesSearch = request.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.purpose.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || request.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNewRequest = () => {
    if (!newRequest.employee || !newRequest.fromCity || !newRequest.toCity || !newRequest.purpose || !newRequest.startDate || !newRequest.endDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    
    if (new Date(newRequest.endDate) < new Date(newRequest.startDate)) {
      toast({ title: "Error", description: "End date cannot be before start date", variant: "destructive" });
      return;
    }
    
    const request: TravelRequest = {
      id: travelRequests.length + 1,
      employee: newRequest.employee,
      destination: `${newRequest.fromCity} → ${newRequest.toCity}`,
      purpose: newRequest.purpose,
      startDate: new Date(newRequest.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      endDate: new Date(newRequest.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "Pending",
      travelMode: newRequest.travelMode,
      accommodation: newRequest.accommodation,
      estimatedBudget: parseFloat(newRequest.estimatedBudget) || 0,
      notes: newRequest.notes
    };
    
    setTravelRequests([request, ...travelRequests]);
    setNewRequest({ employee: "", fromCity: "", toCity: "", purpose: "", startDate: "", endDate: "", travelMode: "", accommodation: "", estimatedBudget: "", notes: "" });
    setIsNewRequestOpen(false);
    toast({ title: "Success", description: "New travel request submitted successfully" });
  };

  const handleApprove = (request: TravelRequest) => {
    setTravelRequests(travelRequests.map(r => r.id === request.id ? { ...r, status: "Approved" as const } : r));
    toast({ title: "Approved", description: `Travel request for ${request.employee} has been approved` });
  };

  const handleReject = (request: TravelRequest) => {
    setSelectedRequest(request);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  };

  const confirmReject = () => {
    if (selectedRequest) {
      if (!rejectReason.trim()) {
        toast({ title: "Error", description: "Please provide a reason for rejection", variant: "destructive" });
        return;
      }
      setTravelRequests(travelRequests.map(r => r.id === selectedRequest.id ? { ...r, status: "Rejected" as const, notes: `Rejected: ${rejectReason}` } : r));
      toast({ title: "Rejected", description: `Travel request has been rejected. Reason: ${rejectReason}`, variant: "destructive" });
      setIsRejectDialogOpen(false);
      setRejectReason("");
      setSelectedRequest(null);
    }
  };

  const handleRejectDialogClose = (open: boolean) => {
    if (!open) {
      setRejectReason("");
      setSelectedRequest(null);
    }
    setIsRejectDialogOpen(open);
  };

  const handleView = (request: TravelRequest) => {
    setSelectedRequest(request);
    setIsViewOpen(true);
  };

  const getTravelModeIcon = (mode?: string) => {
    switch (mode?.toLowerCase()) {
      case "flight": return <Plane className="h-4 w-4" />;
      case "train": return <Truck className="h-4 w-4" />;
      case "bus": return <Car className="h-4 w-4" />;
      default: return <Truck className="h-4 w-4" />;
    }
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Travel Requests</h1>
            <p className="text-slate-500 mt-1">Manage business travel requests and approvals</p>
          </div>
          <Button className="gap-2" onClick={() => setIsNewRequestOpen(true)} data-testid="button-new-request">
            <Plus className="h-4 w-4" />
            New Travel Request
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {travelStats.map((stat, index) => (
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
                  <Truck className="h-5 w-5 text-teal-600" />
                  Travel Requests
                </CardTitle>
                <CardDescription>All travel requests and their approval status</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input 
                    placeholder="Search requests..." 
                    className="pl-10 w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    data-testid="input-search"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32" data-testid="select-status-filter">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRequests.map((request, index) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  data-testid={`row-request-${index}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{request.employee}</h3>
                        <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {request.destination}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {request.startDate} - {request.endDate}
                        </span>
                        {request.travelMode && (
                          <span className="flex items-center gap-1">
                            {getTravelModeIcon(request.travelMode)}
                            {request.travelMode}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-2">Purpose: {request.purpose}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1" onClick={() => handleView(request)} data-testid={`button-view-${index}`}>
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      {request.status === "Pending" && (
                        <>
                          <Button size="sm" onClick={() => handleApprove(request)} data-testid={`button-approve-${index}`}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(request)} data-testid={`button-reject-${index}`}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="text-center py-8 text-slate-500">No travel requests found</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Travel Request Dialog */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5 text-teal-600" />
              New Travel Request
            </DialogTitle>
            <DialogDescription>Fill in the details to submit a travel request</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Employee Name *</Label>
              <Input 
                id="employee" 
                placeholder="Enter employee name"
                value={newRequest.employee}
                onChange={(e) => setNewRequest({...newRequest, employee: e.target.value})}
                data-testid="input-employee"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromCity">From City *</Label>
                <Input 
                  id="fromCity" 
                  placeholder="Departure city"
                  value={newRequest.fromCity}
                  onChange={(e) => setNewRequest({...newRequest, fromCity: e.target.value})}
                  data-testid="input-from-city"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="toCity">To City *</Label>
                <Input 
                  id="toCity" 
                  placeholder="Destination city"
                  value={newRequest.toCity}
                  onChange={(e) => setNewRequest({...newRequest, toCity: e.target.value})}
                  data-testid="input-to-city"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Travel *</Label>
              <Input 
                id="purpose" 
                placeholder="e.g., Client Meeting, Training, Conference"
                value={newRequest.purpose}
                onChange={(e) => setNewRequest({...newRequest, purpose: e.target.value})}
                data-testid="input-purpose"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input 
                  id="startDate" 
                  type="date"
                  value={newRequest.startDate}
                  onChange={(e) => setNewRequest({...newRequest, startDate: e.target.value})}
                  data-testid="input-start-date"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date *</Label>
                <Input 
                  id="endDate" 
                  type="date"
                  value={newRequest.endDate}
                  onChange={(e) => setNewRequest({...newRequest, endDate: e.target.value})}
                  data-testid="input-end-date"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="travelMode">Travel Mode</Label>
                <Select value={newRequest.travelMode} onValueChange={(v) => setNewRequest({...newRequest, travelMode: v})}>
                  <SelectTrigger data-testid="select-travel-mode">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Flight">Flight</SelectItem>
                    <SelectItem value="Train">Train</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedBudget">Estimated Budget (₹)</Label>
                <Input 
                  id="estimatedBudget" 
                  type="number"
                  placeholder="0.00"
                  value={newRequest.estimatedBudget}
                  onChange={(e) => setNewRequest({...newRequest, estimatedBudget: e.target.value})}
                  data-testid="input-budget"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accommodation">Accommodation Details</Label>
              <Input 
                id="accommodation" 
                placeholder="Hotel name or type"
                value={newRequest.accommodation}
                onChange={(e) => setNewRequest({...newRequest, accommodation: e.target.value})}
                data-testid="input-accommodation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea 
                id="notes" 
                placeholder="Any additional information or special requirements"
                value={newRequest.notes}
                onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                data-testid="input-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>Cancel</Button>
            <Button onClick={handleNewRequest} data-testid="button-submit-request">Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal-600" />
              Travel Request Details
            </DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Employee</p>
                  <p className="font-medium">{selectedRequest.employee}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Status</p>
                  <Badge className={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Destination</p>
                <p className="font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {selectedRequest.destination}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Purpose</p>
                <p className="font-medium">{selectedRequest.purpose}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Start Date</p>
                  <p className="font-medium">{selectedRequest.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">End Date</p>
                  <p className="font-medium">{selectedRequest.endDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {selectedRequest.travelMode && (
                  <div>
                    <p className="text-sm text-slate-500">Travel Mode</p>
                    <p className="font-medium flex items-center gap-1">
                      {getTravelModeIcon(selectedRequest.travelMode)}
                      {selectedRequest.travelMode}
                    </p>
                  </div>
                )}
                {selectedRequest.estimatedBudget && (
                  <div>
                    <p className="text-sm text-slate-500">Estimated Budget</p>
                    <p className="font-bold text-lg">₹{selectedRequest.estimatedBudget.toLocaleString()}</p>
                  </div>
                )}
              </div>
              {selectedRequest.accommodation && (
                <div>
                  <p className="text-sm text-slate-500">Accommodation</p>
                  <p className="font-medium flex items-center gap-1">
                    <Hotel className="h-4 w-4" />
                    {selectedRequest.accommodation}
                  </p>
                </div>
              )}
              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="text-slate-700">{selectedRequest.notes}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
            {selectedRequest?.status === "Pending" && (
              <>
                <Button onClick={() => { handleApprove(selectedRequest); setIsViewOpen(false); }}>Approve</Button>
                <Button variant="destructive" onClick={() => { handleReject(selectedRequest); setIsViewOpen(false); }}>Reject</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={handleRejectDialogClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              Reject Travel Request
            </DialogTitle>
            <DialogDescription>Please provide a reason for rejection</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Enter reason for rejection..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              data-testid="input-reject-reason"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} data-testid="button-confirm-reject">Confirm Rejection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
