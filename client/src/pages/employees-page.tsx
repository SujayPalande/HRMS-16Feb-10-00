import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmployeeInvitationForm } from "@/components/employees/employee-invitation-form";
import { MultiStepEmployeeForm } from "@/components/employees/multi-step-employee-form";
import { 
  Plus, 
  Trash2, 
  Eye, 
  Mail, 
  Phone, 
  Building2, 
  User as UserIcon, 
  Search,
  Users,
  TrendingUp,
  Crown,
  Star,
  Award,
  X,
  Grid3X3,
  List,
  ChevronRight,
  Calendar,
  Settings,
  Send
} from "lucide-react";
import { User, Department } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeesPage() {
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isAddFormVisible, setIsAddFormVisible] = useState(false);
  const [addMethod, setAddMethod] = useState<'invitation' | 'manual'>('invitation');
  const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Fetch employees data
  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<User[]>({
    queryKey: ["/api/employees"],
  });
  
  // Fetch departments for the form
  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });
  
  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employee deleted",
        description: "The employee has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete employee: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const handleEdit = (employee: User) => {
    setSelectedEmployee(employee);
    setIsEditOpen(true);
  };

  const handleView = (employee: User) => {
    setSelectedEmployee(employee);
    setIsViewOpen(true);
  };
  
  const filteredEmployees = employees.filter((employee) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      employee.firstName.toLowerCase().includes(searchLower) ||
      employee.lastName.toLowerCase().includes(searchLower) ||
      employee.email.toLowerCase().includes(searchLower) ||
      (employee.position?.toLowerCase().includes(searchLower)) ||
      employee.role.toLowerCase().includes(searchLower)
    );
  });

  const shouldForceTableView = filteredEmployees.length > 20;
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.isActive).length;
  
  const roleStats = {
    admin: employees.filter(emp => emp.role === 'admin').length,
    hr: employees.filter(emp => emp.role === 'hr').length,
    manager: employees.filter(emp => emp.role === 'manager').length,
    employee: employees.filter(emp => emp.role === 'employee').length
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'hr': return <Users className="w-4 h-4" />;
      case 'manager': return <Star className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return "default";
      case 'hr': return "secondary";
      case 'manager': return "outline";
      default: return "outline";
    }
  };

  const EmployeeCard = ({ employee, index }: { employee: User; index: number }) => {
    const department = departments.find(d => d.id === employee.departmentId);
    const isPending = employee.status === 'invited';
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <Card className={cn(
          "group border-2 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden relative",
          isPending 
            ? "border-orange-300 hover:border-orange-400 bg-gradient-to-br from-orange-50 via-orange-100/50 to-white" 
            : "border-slate-200 hover:border-teal-300 bg-gradient-to-br from-white via-slate-50 to-white"
        )}>
          <CardContent className="p-6 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-14 w-14 border-3 border-white shadow-lg">
                    <AvatarImage src={employee.photoUrl || ""} alt={`${employee.firstName} ${employee.lastName}`} />
                    <AvatarFallback className="bg-gradient-to-br from-teal-100 to-teal-200 text-teal-700 text-lg font-bold">
                      {employee.firstName[0]}{employee.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 group-hover:text-teal-900 transition-colors duration-300">
                      {employee.firstName} {employee.lastName}
                    </h3>
                    <p className="text-sm text-slate-600 font-medium">{employee.position || "No Position"}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => handleView(employee)} className="h-8 w-8 hover:bg-teal-100">
                    <Eye className="h-4 w-4 text-teal-600" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(employee)} className="h-8 w-8 hover:bg-slate-100">
                    <Settings className="h-4 w-4 text-slate-600" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-teal-500" />
                  <span className="truncate">{employee.email}</span>
                </div>
                {department && (
                  <div className="flex items-center space-x-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4 text-teal-500" />
                    <span>{department.name}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(employee.role)} className="text-xs font-medium">
                    {getRoleIcon(employee.role)}
                    <span className="ml-1 capitalize">{employee.role}</span>
                  </Badge>
                  <Badge 
                    variant={isPending ? "secondary" : employee.isActive ? "default" : "destructive"} 
                    className={cn("text-xs", isPending && "bg-orange-100 text-orange-800 border-orange-200")}
                  >
                    {isPending ? "Pending" : employee.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleView(employee)} className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 text-xs px-3">
                  View Profile <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
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
                <Users className="w-8 h-8 text-teal-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
                  Employee Management
                </h1>
                <p className="text-slate-600 text-lg">Manage your workforce and team members</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-white rounded-xl px-4 py-3 shadow-md border border-slate-200">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <div>
                    <div className="text-sm font-medium text-slate-600">Total Team Members</div>
                    <div className="text-2xl font-bold text-slate-900">{totalEmployees}</div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={() => setIsAddFormVisible(!isAddFormVisible)}
                className="bg-gradient-to-r from-teal-600 via-teal-600 to-emerald-600 hover:from-teal-700 hover:via-teal-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 h-auto text-white font-semibold"
              >
                {isAddFormVisible ? <X className="h-5 w-5 mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                {isAddFormVisible ? "Cancel Addition" : "Add New Employee"}
              </Button>
            </div>
          </div>
        </div>

        {/* Dual Entry Toggle Form */}
        <AnimatePresence>
          {isAddFormVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-2 border-teal-200 shadow-xl bg-white mb-8">
                <CardContent className="p-0">
                  <div className="flex border-b border-slate-100">
                    <button
                      onClick={() => setAddMethod('invitation')}
                      className={cn(
                        "flex-1 flex items-center justify-center py-4 px-6 text-sm font-bold transition-all",
                        addMethod === 'invitation' 
                          ? "bg-teal-50 text-teal-700 border-b-2 border-teal-600" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Email Invitation
                    </button>
                    <button
                      onClick={() => setAddMethod('manual')}
                      className={cn(
                        "flex-1 flex items-center justify-center py-4 px-6 text-sm font-bold transition-all",
                        addMethod === 'manual' 
                          ? "bg-teal-50 text-teal-700 border-b-2 border-teal-600" 
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Manual Form
                    </button>
                  </div>
                  <div className="p-8">
                    {addMethod === 'invitation' ? (
                      <div className="max-w-2xl mx-auto">
                        <div className="mb-6 text-center">
                          <h3 className="text-lg font-bold text-slate-900">Send Invitation Email</h3>
                          <p className="text-sm text-slate-500">The employee will receive an email with their login credentials and onboarding steps.</p>
                        </div>
                        <EmployeeInvitationForm 
                          onSuccess={() => {
                            setIsAddFormVisible(false);
                            queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
                            toast({ title: "Success", description: "Invitation sent successfully." });
                          }}
                        />
                      </div>
                    ) : (
                      <MultiStepEmployeeForm 
                        departments={departments}
                        onSuccess={() => {
                          setIsAddFormVisible(false);
                          queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
                          toast({ title: "Success", description: "Employee added successfully." });
                        }}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700">Total Employees</div>
                <div className="text-3xl font-bold text-blue-900">{totalEmployees}</div>
              </div>
              <div className="bg-blue-500 p-3 rounded-xl"><Users className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-700">Active Members</div>
                <div className="text-3xl font-bold text-emerald-900">{activeEmployees}</div>
              </div>
              <div className="bg-emerald-500 p-3 rounded-xl"><Award className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700">Departments</div>
                <div className="text-3xl font-bold text-purple-900">{departments.length}</div>
              </div>
              <div className="bg-purple-500 p-3 rounded-xl"><Building2 className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
          <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-orange-700">Leadership</div>
                <div className="text-3xl font-bold text-orange-900">{roleStats.admin + roleStats.manager}</div>
              </div>
              <div className="bg-orange-500 p-3 rounded-xl"><Crown className="w-6 h-6 text-white" /></div>
            </CardContent>
          </Card>
        </div>

        {/* Search & View Controls */}
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 border-2 border-slate-200 focus:border-teal-500 rounded-lg"
                />
              </div>
              <div className="text-sm text-slate-600 font-medium bg-slate-50 px-3 py-2 rounded-lg">
                {filteredEmployees.length} employees found
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant={viewMode === 'grid' ? 'default' : 'outline'} onClick={() => setViewMode('grid')} className="h-10">
                <Grid3X3 className="w-4 h-4 mr-2" /> Grid
              </Button>
              <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')} className="h-10">
                <List className="w-4 h-4 mr-2" /> Table
              </Button>
            </div>
          </div>
        </div>
        
        {/* Employee List */}
        {isLoadingEmployees ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse h-48 border-2 border-slate-200" />)}
          </div>
        ) : (viewMode === 'grid' && !shouldForceTableView) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEmployees.map((employee, index) => (
              <EmployeeCard key={employee.id} employee={employee} index={index} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-slate-50">
                <TableHead>Photo</TableHead><TableHead>Name</TableHead><TableHead>Email</TableHead>
                <TableHead>Position</TableHead><TableHead>Department</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead>
              </TableRow></TableHeader>
              <TableBody>{filteredEmployees.map((employee) => {
                const department = departments.find(d => d.id === employee.departmentId);
                return (
                  <TableRow key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell><Avatar className="h-10 w-10"><AvatarImage src={employee.photoUrl || ""} /><AvatarFallback>{employee.firstName[0]}{employee.lastName[0]}</AvatarFallback></Avatar></TableCell>
                    <TableCell className="font-bold">{employee.firstName} {employee.lastName}</TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.position || "-"}</TableCell>
                    <TableCell>{department?.name || "-"}</TableCell>
                    <TableCell><Badge variant={getRoleBadgeVariant(employee.role)}>{employee.role}</Badge></TableCell>
                    <TableCell><Badge variant={employee.status === 'invited' ? "secondary" : employee.isActive ? "default" : "destructive"}>{employee.status === 'invited' ? "Pending" : employee.isActive ? "Active" : "Inactive"}</Badge></TableCell>
                  </TableRow>
                );
              })}</TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit & View Modals */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
          {selectedEmployee && <MultiStepEmployeeForm employee={selectedEmployee} departments={departments} onSuccess={() => { setIsEditOpen(false); queryClient.invalidateQueries({ queryKey: ["/api/employees"] }); }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-auto">
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="flex items-center space-x-6 pb-6 border-b border-slate-100">
                <Avatar className="h-24 w-24 border-4 border-teal-50"><AvatarImage src={selectedEmployee.photoUrl || ""} /><AvatarFallback className="text-2xl font-bold">{selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}</AvatarFallback></Avatar>
                <div>
                  <h2 className="text-2xl font-bold">{selectedEmployee.firstName} {selectedEmployee.lastName}</h2>
                  <p className="text-slate-600 font-medium">{selectedEmployee.position}</p>
                  <div className="flex items-center mt-2 space-x-2"><Badge>{selectedEmployee.role}</Badge><Badge variant={selectedEmployee.isActive ? "default" : "destructive"}>{selectedEmployee.isActive ? "Active" : "Inactive"}</Badge></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1"><div className="text-xs font-bold text-slate-400 uppercase">Email Address</div><div className="flex items-center space-x-2"><Mail className="w-4 h-4 text-teal-500" /><span>{selectedEmployee.email}</span></div></div>
                <div className="space-y-1"><div className="text-xs font-bold text-slate-400 uppercase">Phone Number</div><div className="flex items-center space-x-2"><Phone className="w-4 h-4 text-teal-500" /><span>{selectedEmployee.phoneNumber || "Not provided"}</span></div></div>
                <div className="space-y-1"><div className="text-xs font-bold text-slate-400 uppercase">Department</div><div className="flex items-center space-x-2"><Building2 className="w-4 h-4 text-teal-500" /><span>{departments.find(d => d.id === selectedEmployee.departmentId)?.name || "Unassigned"}</span></div></div>
                <div className="space-y-1"><div className="text-xs font-bold text-slate-400 uppercase">Join Date</div><div className="flex items-center space-x-2"><Calendar className="w-4 h-4 text-teal-500" /><span>{selectedEmployee.joinDate ? format(new Date(selectedEmployee.joinDate), "PPP") : "Not set"}</span></div></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
