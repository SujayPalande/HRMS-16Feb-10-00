import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { Users, Mail, Phone, MapPin, Building2, Calendar, Edit, Camera } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function MyProfilePage() {
  const { user } = useAuth();

  const profileInfo = {
    personalInfo: [
      { label: "Full Name", value: user ? `${user.firstName} ${user.lastName}` : "N/A", icon: <Users className="h-4 w-4" /> },
      { label: "Email", value: user?.email || "N/A", icon: <Mail className="h-4 w-4" /> },
      { label: "Phone", value: user?.personalPhone || "N/A", icon: <Phone className="h-4 w-4" /> },
      { label: "Address", value: user?.address || "N/A", icon: <MapPin className="h-4 w-4" /> },
    ],
    employmentInfo: [
      { label: "Employee ID", value: user?.employeeId || "N/A" },
      { label: "Department", value: user?.departmentId ? `Dept ${user.departmentId}` : "N/A" },
      { label: "Position", value: user?.position || "N/A" },
      { label: "Join Date", value: user?.joinDate ? new Date(user.joinDate).toLocaleDateString() : "N/A" },
      { label: "Employment Type", value: "Full-time" },
      { label: "Reporting Manager", value: user?.managerId ? `Manager ${user.managerId}` : "N/A" },
    ],
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
            <h1 className="text-2xl font-bold text-slate-900" data-testid="text-page-title">My Profile</h1>
            <p className="text-slate-500 mt-1">View and manage your personal information</p>
          </div>
          <Link href="/settings">
            <Button className="gap-2" data-testid="button-edit-profile">
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block">
                <Avatar className="h-24 w-24 mx-auto">
                  <AvatarImage src={user?.photoUrl || ""} alt={user ? `${user.firstName} ${user.lastName}` : ""} />
                  <AvatarFallback className="text-2xl">
                    {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "?"}
                  </AvatarFallback>
                </Avatar>
                <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full" data-testid="button-change-photo">
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                {user ? `${user.firstName} ${user.lastName}` : "N/A"}
              </h2>
              <p className="text-slate-500">{user?.position || "Employee"}</p>
              <Badge className="mt-2" variant="secondary">{user?.departmentId ? `Department ${user.departmentId}` : "N/A"}</Badge>

              <div className="mt-6 pt-6 border-t space-y-3 text-left">
                {profileInfo.personalInfo.map((info, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <div className="text-slate-400">{info.icon}</div>
                    <span className="text-slate-600">{info.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-teal-600" />
                Employment Information
              </CardTitle>
              <CardDescription>Your employment details and work information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profileInfo.employmentInfo.map((info, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-lg bg-slate-50"
                  >
                    <p className="text-sm text-slate-500">{info.label}</p>
                    <p className="font-medium text-slate-900 mt-1">{info.value}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover-elevate cursor-pointer" data-testid="card-leave-balance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-50 text-green-600">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                  <p className="text-sm text-slate-500">Leave Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" data-testid="card-attendance">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">98%</p>
                  <p className="text-sm text-slate-500">Attendance Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="hover-elevate cursor-pointer" data-testid="card-documents">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                  <p className="text-sm text-slate-500">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
