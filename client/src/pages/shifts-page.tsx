import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, Plus, Users, Settings, Sun, Moon, Sunrise, Trash2, Edit, X } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface Shift {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
  employees: number;
  icon: JSX.Element;
  color: string;
  description?: string;
}

interface ShiftSettings {
  allowOvertime: boolean;
  maxOvertimeHours: number;
  requireApproval: boolean;
  notifyManager: boolean;
  allowShiftSwap: boolean;
  minRestHours: number;
  autoAssign: boolean;
}

interface ShiftAssignment {
  id: number;
  employee: string;
  department: string;
  shift: string;
  startDate: string;
  endDate: string;
}

export default function ShiftsPage() {
  const { toast } = useToast();
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditAssignmentOpen, setIsEditAssignmentOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<number | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<ShiftAssignment | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([
    { id: 1, name: "Morning Shift", startTime: "06:00", endTime: "14:00", employees: 45, icon: <Sunrise className="h-5 w-5" />, color: "bg-amber-50 text-amber-600", description: "Early morning shift for production" },
    { id: 2, name: "Day Shift", startTime: "09:00", endTime: "18:00", employees: 120, icon: <Sun className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600", description: "Standard business hours" },
    { id: 3, name: "Evening Shift", startTime: "14:00", endTime: "22:00", employees: 38, icon: <Moon className="h-5 w-5" />, color: "bg-purple-50 text-purple-600", description: "Afternoon to evening coverage" },
    { id: 4, name: "Night Shift", startTime: "22:00", endTime: "06:00", employees: 22, icon: <Moon className="h-5 w-5" />, color: "bg-indigo-50 text-indigo-600", description: "Overnight operations" },
  ]);

  const [newShift, setNewShift] = useState({
    name: "",
    startTime: "",
    endTime: "",
    description: "",
    colorTheme: "amber"
  });

  const [settings, setSettings] = useState<ShiftSettings>({
    allowOvertime: true,
    maxOvertimeHours: 4,
    requireApproval: true,
    notifyManager: true,
    allowShiftSwap: true,
    minRestHours: 8,
    autoAssign: false,
  });

  const [shiftSchedule, setShiftSchedule] = useState([
    { id: 1, employee: "John Doe", department: "Engineering", shift: "Day Shift", startDate: "2024-01-01", endDate: "2024-03-31" },
    { id: 2, employee: "Jane Smith", department: "Marketing", shift: "Morning Shift", startDate: "2024-01-15", endDate: "2024-04-15" },
    { id: 3, employee: "Mike Johnson", department: "Sales", shift: "Evening Shift", startDate: "2024-02-01", endDate: "2024-05-01" },
  ]);

  const colorThemes = [
    { value: "amber", label: "Amber", bgClass: "bg-amber-50 text-amber-600" },
    { value: "yellow", label: "Yellow", bgClass: "bg-yellow-50 text-yellow-600" },
    { value: "purple", label: "Purple", bgClass: "bg-purple-50 text-purple-600" },
    { value: "indigo", label: "Indigo", bgClass: "bg-indigo-50 text-indigo-600" },
    { value: "teal", label: "Teal", bgClass: "bg-teal-50 text-teal-600" },
    { value: "blue", label: "Blue", bgClass: "bg-blue-50 text-blue-600" },
    { value: "green", label: "Green", bgClass: "bg-green-50 text-green-600" },
    { value: "red", label: "Red", bgClass: "bg-red-50 text-red-600" },
  ];

  const getIconForShift = (startTime: string) => {
    const hour = parseInt(startTime.split(":")[0]);
    if (hour >= 5 && hour < 9) return <Sunrise className="h-5 w-5" />;
    if (hour >= 9 && hour < 14) return <Sun className="h-5 w-5" />;
    if (hour >= 14 && hour < 20) return <Moon className="h-5 w-5" />;
    return <Moon className="h-5 w-5" />;
  };

  const getColorClass = (theme: string) => {
    return colorThemes.find(t => t.value === theme)?.bgClass || "bg-amber-50 text-amber-600";
  };

  const formatTime = (time24: string) => {
    const [hours, minutes] = time24.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleAddShift = () => {
    if (!newShift.name || !newShift.startTime || !newShift.endTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (isEditMode && editingShiftId) {
      setShifts(prev => prev.map(shift => 
        shift.id === editingShiftId 
          ? {
              ...shift,
              name: newShift.name,
              startTime: newShift.startTime,
              endTime: newShift.endTime,
              description: newShift.description,
              icon: getIconForShift(newShift.startTime),
              color: getColorClass(newShift.colorTheme)
            }
          : shift
      ));
      toast({
        title: "Shift Updated",
        description: `${newShift.name} has been updated successfully`
      });
    } else {
      const newId = Math.max(...shifts.map(s => s.id)) + 1;
      const shift: Shift = {
        id: newId,
        name: newShift.name,
        startTime: newShift.startTime,
        endTime: newShift.endTime,
        employees: 0,
        icon: getIconForShift(newShift.startTime),
        color: getColorClass(newShift.colorTheme),
        description: newShift.description
      };
      setShifts(prev => [...prev, shift]);
      toast({
        title: "Shift Created",
        description: `${newShift.name} has been added successfully`
      });
    }

    setNewShift({ name: "", startTime: "", endTime: "", description: "", colorTheme: "amber" });
    setIsEditMode(false);
    setEditingShiftId(null);
    setIsAddShiftOpen(false);
  };

  const handleEditShift = (shift: Shift) => {
    const colorTheme = colorThemes.find(t => t.bgClass === shift.color)?.value || "amber";
    setNewShift({
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      description: shift.description || "",
      colorTheme
    });
    setIsEditMode(true);
    setEditingShiftId(shift.id);
    setIsAddShiftOpen(true);
  };

  const handleDeleteShift = (shiftId: number) => {
    const shift = shifts.find(s => s.id === shiftId);
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    toast({
      title: "Shift Deleted",
      description: `${shift?.name} has been removed`
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Shift management settings have been updated"
    });
    setIsSettingsOpen(false);
  };

  const handleDeleteSchedule = (scheduleId: number) => {
    setShiftSchedule(prev => prev.filter(s => s.id !== scheduleId));
    toast({
      title: "Assignment Removed",
      description: "Shift assignment has been deleted"
    });
  };

  const handleEditAssignment = (assignment: ShiftAssignment) => {
    setEditingAssignment({ ...assignment });
    setIsEditAssignmentOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!editingAssignment) return;
    
    if (!editingAssignment.employee || !editingAssignment.shift || !editingAssignment.startDate || !editingAssignment.endDate) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setShiftSchedule(prev => prev.map(s => 
      s.id === editingAssignment.id ? editingAssignment : s
    ));
    
    toast({
      title: "Assignment Updated",
      description: `${editingAssignment.employee}'s shift has been updated`
    });
    
    setIsEditAssignmentOpen(false);
    setEditingAssignment(null);
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Shift Management</h1>
            <p className="text-slate-500 mt-1">Configure and manage employee shifts</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2" 
              data-testid="button-shift-settings"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <Button 
              className="gap-2" 
              data-testid="button-add-shift"
              onClick={() => {
                setIsEditMode(false);
                setEditingShiftId(null);
                setNewShift({ name: "", startTime: "", endTime: "", description: "", colorTheme: "amber" });
                setIsAddShiftOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add Shift
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {shifts.map((shift, index) => (
            <motion.div
              key={shift.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="hover-elevate cursor-pointer group relative" data-testid={`card-shift-${shift.name.toLowerCase().replace(' ', '-')}`}>
                <CardContent className="p-6">
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7"
                      onClick={(e) => { e.stopPropagation(); handleEditShift(shift); }}
                      data-testid={`button-edit-shift-${shift.id}`}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-red-500 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); handleDeleteShift(shift.id); }}
                      data-testid={`button-delete-shift-${shift.id}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${shift.color}`}>
                      {shift.icon}
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      {shift.employees}
                    </Badge>
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">{shift.name}</h3>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </p>
                  {shift.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{shift.description}</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-600" />
              Shift Assignments
            </CardTitle>
            <CardDescription>Current employee shift schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Department</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Shift</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Start Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">End Date</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftSchedule.map((schedule, index) => (
                    <tr key={schedule.id} className="border-b hover:bg-slate-50" data-testid={`row-schedule-${index}`}>
                      <td className="py-3 px-4 font-medium">{schedule.employee}</td>
                      <td className="py-3 px-4 text-slate-600">{schedule.department}</td>
                      <td className="py-3 px-4">
                        <Badge variant="secondary">{schedule.shift}</Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{schedule.startDate}</td>
                      <td className="py-3 px-4 text-slate-600">{schedule.endDate}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEditAssignment(schedule)}
                            data-testid={`button-edit-schedule-${index}`}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            data-testid={`button-delete-schedule-${index}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50">
                <Clock className="h-5 w-5 text-teal-600" />
              </div>
              {isEditMode ? "Edit Shift" : "Add New Shift"}
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? "Update the shift details below" : "Create a new shift schedule for your organization"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shiftName">Shift Name *</Label>
              <Input
                id="shiftName"
                placeholder="e.g., Morning Shift, Night Shift"
                value={newShift.name}
                onChange={(e) => setNewShift(prev => ({ ...prev, name: e.target.value }))}
                data-testid="input-shift-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                  data-testid="input-start-time"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                  data-testid="input-end-time"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="colorTheme">Color Theme</Label>
              <Select
                value={newShift.colorTheme}
                onValueChange={(value) => setNewShift(prev => ({ ...prev, colorTheme: value }))}
              >
                <SelectTrigger data-testid="select-color-theme">
                  <SelectValue placeholder="Select a color theme" />
                </SelectTrigger>
                <SelectContent>
                  {colorThemes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded ${theme.bgClass}`} />
                        {theme.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this shift..."
                value={newShift.description}
                onChange={(e) => setNewShift(prev => ({ ...prev, description: e.target.value }))}
                className="resize-none"
                rows={3}
                data-testid="input-shift-description"
              />
            </div>

            {newShift.startTime && newShift.endTime && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <span className="font-medium">Duration:</span>{" "}
                  {(() => {
                    const start = parseInt(newShift.startTime.split(":")[0]) * 60 + parseInt(newShift.startTime.split(":")[1]);
                    const end = parseInt(newShift.endTime.split(":")[0]) * 60 + parseInt(newShift.endTime.split(":")[1]);
                    const diff = end > start ? end - start : (24 * 60 - start) + end;
                    const hours = Math.floor(diff / 60);
                    const mins = diff % 60;
                    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`;
                  })()}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddShiftOpen(false)} data-testid="button-cancel-shift">
              Cancel
            </Button>
            <Button onClick={handleAddShift} data-testid="button-save-shift">
              {isEditMode ? "Update Shift" : "Create Shift"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-slate-100">
                <Settings className="h-5 w-5 text-slate-600" />
              </div>
              Shift Settings
            </DialogTitle>
            <DialogDescription>
              Configure global shift management settings for your organization
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Overtime Settings</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Overtime</Label>
                  <p className="text-sm text-slate-500">Enable employees to work beyond scheduled hours</p>
                </div>
                <Switch
                  checked={settings.allowOvertime}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowOvertime: checked }))}
                  data-testid="switch-allow-overtime"
                />
              </div>

              {settings.allowOvertime && (
                <div className="space-y-2 pl-4 border-l-2 border-slate-200">
                  <Label htmlFor="maxOvertime">Maximum Overtime Hours (per day)</Label>
                  <Input
                    id="maxOvertime"
                    type="number"
                    min="1"
                    max="8"
                    value={settings.maxOvertimeHours}
                    onChange={(e) => setSettings(prev => ({ ...prev, maxOvertimeHours: parseInt(e.target.value) || 0 }))}
                    className="w-32"
                    data-testid="input-max-overtime"
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Approval & Notifications</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Manager Approval</Label>
                  <p className="text-sm text-slate-500">Shift changes need manager approval</p>
                </div>
                <Switch
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireApproval: checked }))}
                  data-testid="switch-require-approval"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notify Manager on Changes</Label>
                  <p className="text-sm text-slate-500">Send notifications when shifts are modified</p>
                </div>
                <Switch
                  checked={settings.notifyManager}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, notifyManager: checked }))}
                  data-testid="switch-notify-manager"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-slate-900 border-b pb-2">Shift Rules</h4>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Shift Swapping</Label>
                  <p className="text-sm text-slate-500">Enable employees to swap shifts with colleagues</p>
                </div>
                <Switch
                  checked={settings.allowShiftSwap}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowShiftSwap: checked }))}
                  data-testid="switch-allow-swap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minRest">Minimum Rest Hours Between Shifts</Label>
                <Input
                  id="minRest"
                  type="number"
                  min="4"
                  max="16"
                  value={settings.minRestHours}
                  onChange={(e) => setSettings(prev => ({ ...prev, minRestHours: parseInt(e.target.value) || 8 }))}
                  className="w-32"
                  data-testid="input-min-rest"
                />
                <p className="text-xs text-slate-500">Recommended: 8-11 hours for employee wellness</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Assign Shifts</Label>
                  <p className="text-sm text-slate-500">Automatically assign shifts based on availability</p>
                </div>
                <Switch
                  checked={settings.autoAssign}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoAssign: checked }))}
                  data-testid="switch-auto-assign"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button onClick={handleSaveSettings} data-testid="button-save-settings">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditAssignmentOpen} onOpenChange={setIsEditAssignmentOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-50">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              Edit Shift Assignment
            </DialogTitle>
            <DialogDescription>
              Update the employee's shift assignment details
            </DialogDescription>
          </DialogHeader>
          
          {editingAssignment && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="assignmentEmployee">Employee Name *</Label>
                <Input
                  id="assignmentEmployee"
                  value={editingAssignment.employee}
                  onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, employee: e.target.value } : null)}
                  data-testid="input-assignment-employee"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentDepartment">Department *</Label>
                <Select
                  value={editingAssignment.department}
                  onValueChange={(value) => setEditingAssignment(prev => prev ? { ...prev, department: value } : null)}
                >
                  <SelectTrigger data-testid="select-assignment-department">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignmentShift">Shift *</Label>
                <Select
                  value={editingAssignment.shift}
                  onValueChange={(value) => setEditingAssignment(prev => prev ? { ...prev, shift: value } : null)}
                >
                  <SelectTrigger data-testid="select-assignment-shift">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.name}>
                        {shift.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assignmentStartDate">Start Date *</Label>
                  <Input
                    id="assignmentStartDate"
                    type="date"
                    value={editingAssignment.startDate}
                    onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, startDate: e.target.value } : null)}
                    data-testid="input-assignment-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignmentEndDate">End Date *</Label>
                  <Input
                    id="assignmentEndDate"
                    type="date"
                    value={editingAssignment.endDate}
                    onChange={(e) => setEditingAssignment(prev => prev ? { ...prev, endDate: e.target.value } : null)}
                    data-testid="input-assignment-end-date"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditAssignmentOpen(false);
                setEditingAssignment(null);
              }} 
              data-testid="button-cancel-assignment"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAssignment} data-testid="button-save-assignment">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
