import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserCheck, FileText, CheckCircle, Clock, AlertCircle, Send, Eye } from "lucide-react";
import { motion } from "framer-motion";

export default function DigitalJoiningPage() {
  const joiningStats = [
    { title: "Pending Joining", value: "8", icon: <Clock className="h-5 w-5" />, color: "bg-yellow-50 text-yellow-600" },
    { title: "In Progress", value: "12", icon: <UserCheck className="h-5 w-5" />, color: "bg-blue-50 text-blue-600" },
    { title: "Completed", value: "45", icon: <CheckCircle className="h-5 w-5" />, color: "bg-green-50 text-green-600" },
    { title: "Documents Pending", value: "5", icon: <AlertCircle className="h-5 w-5" />, color: "bg-red-50 text-red-600" },
  ];

  const joiningList = [
    { 
      candidate: "Rajesh Kumar", 
      position: "Senior Developer", 
      joiningDate: "Feb 1, 2024", 
      progress: 80,
      status: "In Progress",
      documents: { submitted: 8, total: 10 }
    },
    { 
      candidate: "Priya Sharma", 
      position: "Marketing Manager", 
      joiningDate: "Feb 5, 2024", 
      progress: 40,
      status: "In Progress",
      documents: { submitted: 4, total: 10 }
    },
    { 
      candidate: "Amit Singh", 
      position: "Sales Executive", 
      joiningDate: "Feb 10, 2024", 
      progress: 0,
      status: "Pending",
      documents: { submitted: 0, total: 10 }
    },
    { 
      candidate: "Sneha Patel", 
      position: "HR Executive", 
      joiningDate: "Jan 28, 2024", 
      progress: 100,
      status: "Completed",
      documents: { submitted: 10, total: 10 }
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed": return "bg-green-100 text-green-700";
      case "In Progress": return "bg-blue-100 text-blue-700";
      case "Pending": return "bg-yellow-100 text-yellow-700";
      default: return "bg-slate-100 text-slate-700";
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">Digital Joining Formalities</h1>
            <p className="text-slate-500 mt-1">Manage new employee onboarding and document collection</p>
          </div>
          <Button className="gap-2" data-testid="button-send-link">
            <Send className="h-4 w-4" />
            Send Joining Link
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {joiningStats.map((stat, index) => (
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
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal-600" />
              Joining Status
            </CardTitle>
            <CardDescription>Track onboarding progress for new employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {joiningList.map((joining, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  data-testid={`row-joining-${index}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{joining.candidate}</h3>
                        <Badge className={getStatusColor(joining.status)}>{joining.status}</Badge>
                      </div>
                      <p className="text-sm text-slate-600">{joining.position} • Joining: {joining.joiningDate}</p>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-slate-600">Documents: {joining.documents.submitted}/{joining.documents.total}</span>
                          <span className="font-medium">{joining.progress}%</span>
                        </div>
                        <Progress value={joining.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1" data-testid={`button-view-${index}`}>
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      {joining.status !== "Completed" && (
                        <Button size="sm" className="gap-1" data-testid={`button-remind-${index}`}>
                          <Send className="h-4 w-4" />
                          Send Reminder
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
