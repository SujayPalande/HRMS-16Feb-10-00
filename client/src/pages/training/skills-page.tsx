import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ClipboardList, Plus, Search, Star, TrendingUp, Filter, Eye, Edit, Trash2, Download } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

export default function SkillMatrixPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  const [formData, setFormData] = useState({
    skillName: "",
    category: "Technical Skills",
    level: "3"
  });

  const skillCategories = [
    { name: "Technical Skills", count: 45, avgProficiency: 72 },
    { name: "Soft Skills", count: 28, avgProficiency: 68 },
    { name: "Leadership", count: 15, avgProficiency: 58 },
    { name: "Domain Expertise", count: 32, avgProficiency: 75 },
  ];

  const [employeeSkills, setEmployeeSkills] = useState([
    { id: 1, employee: "John Doe", department: "Engineering", skills: [
      { name: "React", level: 4, category: "Technical Skills" },
      { name: "Node.js", level: 4, category: "Technical Skills" },
      { name: "TypeScript", level: 3, category: "Technical Skills" },
      { name: "AWS", level: 2, category: "Technical Skills" },
    ]},
    { id: 2, employee: "Jane Smith", department: "Marketing", skills: [
      { name: "Digital Marketing", level: 5, category: "Domain Expertise" },
      { name: "SEO", level: 4, category: "Technical Skills" },
      { name: "Analytics", level: 3, category: "Technical Skills" },
      { name: "Content Strategy", level: 4, category: "Domain Expertise" },
    ]},
    { id: 3, employee: "Mike Johnson", department: "Sales", skills: [
      { name: "Negotiation", level: 5, category: "Soft Skills" },
      { name: "CRM", level: 4, category: "Technical Skills" },
      { name: "Presentation", level: 4, category: "Soft Skills" },
      { name: "Lead Generation", level: 3, category: "Domain Expertise" },
    ]},
    { id: 4, employee: "Sarah Wilson", department: "HR", skills: [
      { name: "Recruitment", level: 5, category: "Domain Expertise" },
      { name: "Employee Relations", level: 4, category: "Soft Skills" },
      { name: "HRIS", level: 3, category: "Technical Skills" },
      { name: "Training", level: 4, category: "Leadership" },
    ]},
  ]);

  const departments = Array.from(new Set(employeeSkills.map(e => e.department)));

  const filteredEmployees = employeeSkills.filter(employee => {
    const matchesSearch = employee.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          employee.skills.some(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = departmentFilter === "all" || employee.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  const renderSkillLevel = (level: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= level ? 'text-amber-500 fill-amber-500' : 'text-slate-200 dark:text-slate-600'}`}
          />
        ))}
      </div>
    );
  };

  const handleAddSkill = () => {
    if (!selectedEmployee || !formData.skillName) {
      toast({ title: "Error", description: "Please select an employee and skill name", variant: "destructive" });
      return;
    }
    const updatedEmployees = employeeSkills.map(emp => {
      if (emp.id === selectedEmployee.id) {
        return {
          ...emp,
          skills: [...emp.skills, { name: formData.skillName, level: parseInt(formData.level), category: formData.category }]
        };
      }
      return emp;
    });
    setEmployeeSkills(updatedEmployees);
    setShowAddDialog(false);
    resetForm();
    toast({ title: "Success", description: "Skill added successfully" });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Skill Matrix Report", 20, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 30);

    let yPos = 50;
    filteredEmployees.forEach((employee) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFontSize(14);
      doc.text(`${employee.employee} - ${employee.department}`, 20, yPos);
      yPos += 10;
      doc.setFontSize(10);
      employee.skills.forEach((skill) => {
        doc.text(`  ${skill.name}: ${"*".repeat(skill.level)} (Level ${skill.level}/5)`, 20, yPos);
        yPos += 7;
      });
      yPos += 5;
    });

    doc.save("skill-matrix-report.pdf");
    toast({ title: "Success", description: "PDF exported successfully" });
  };

  const resetForm = () => {
    setFormData({ skillName: "", category: "Technical Skills", level: "3" });
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100" data-testid="text-page-title">Skill Matrix</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Track and manage employee skills and competencies</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleExportPDF} data-testid="button-export">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button className="gap-2" data-testid="button-add-skill" onClick={() => { resetForm(); setShowAddDialog(true); }}>
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {skillCategories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card data-testid={`card-category-${index}`} className="hover-elevate cursor-pointer">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">{category.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{category.count} skills mapped</p>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-slate-600 dark:text-slate-400">Avg Proficiency</span>
                      <span className="font-medium">{category.avgProficiency}%</span>
                    </div>
                    <Progress value={category.avgProficiency} className="h-2" />
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
                  <ClipboardList className="h-5 w-5 text-teal-600" />
                  Employee Skills
                </CardTitle>
                <CardDescription>Skill proficiency by employee</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search employee or skill..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-dept-filter">
                    <Filter className="h-4 w-4 mr-2" />
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
            <div className="space-y-4">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No employees found</div>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <motion.div
                    key={employee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    data-testid={`row-employee-${index}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100">{employee.employee}</h3>
                          <Badge variant="outline">{employee.department}</Badge>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{employee.skills.length} skills</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {employee.skills.map((skill, i) => (
                            <div key={i} className="flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded border dark:border-slate-700">
                              <span className="text-sm font-medium">{skill.name}</span>
                              {renderSkillLevel(skill.level)}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" data-testid={`button-view-${index}`} onClick={() => { setSelectedEmployee(employee); setShowViewDialog(true); }}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-add-skill-${index}`} onClick={() => { setSelectedEmployee(employee); resetForm(); setShowAddDialog(true); }}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Skill
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>Add a skill for {selectedEmployee?.employee || "employee"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {!selectedEmployee && (
              <div>
                <Label>Select Employee *</Label>
                <Select onValueChange={(value) => setSelectedEmployee(employeeSkills.find(e => e.id.toString() === value))}>
                  <SelectTrigger data-testid="select-employee"><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employeeSkills.map(emp => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>{emp.employee}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Skill Name *</Label>
              <Input value={formData.skillName} onChange={(e) => setFormData({...formData, skillName: e.target.value})} placeholder="e.g., Python, Leadership" data-testid="input-skill-name" />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger data-testid="select-category"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical Skills">Technical Skills</SelectItem>
                  <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                  <SelectItem value="Leadership">Leadership</SelectItem>
                  <SelectItem value="Domain Expertise">Domain Expertise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Proficiency Level (1-5)</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData({...formData, level: value})}>
                <SelectTrigger data-testid="select-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Beginner</SelectItem>
                  <SelectItem value="2">2 - Basic</SelectItem>
                  <SelectItem value="3">3 - Intermediate</SelectItem>
                  <SelectItem value="4">4 - Advanced</SelectItem>
                  <SelectItem value="5">5 - Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddSkill} data-testid="button-submit-skill">Add Skill</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Skills Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedEmployee?.employee} - Skill Profile</DialogTitle>
            <DialogDescription>{selectedEmployee?.department} Department</DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {selectedEmployee.skills.map((skill: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <p className="font-medium">{skill.name}</p>
                    <p className="text-sm text-slate-500">{skill.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderSkillLevel(skill.level)}
                    <Badge variant="outline">Level {skill.level}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
