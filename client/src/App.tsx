import { Switch, Route, Router } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ProtectedRoute } from "@/lib/protected-route";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import EmployeesPage from "@/pages/employees-page";
import DepartmentsPage from "@/pages/departments-page";
import AttendancePage from "@/pages/attendance-page";
import LeavePage from "@/pages/leave-page";
import HolidaysPage from "@/pages/holidays-page";
import PayrollPage from "@/pages/payroll-page";
import RolesPage from "@/pages/roles-page";
import SettingsPage from "@/pages/settings-page";
import SystemSettingsPage from "@/pages/system-settings-page";
import EmployeeLimitPage from "@/pages/employee-limit-page";
import InvitationPage from "@/pages/invitation-page";
import EmployeeDetailPage from "@/pages/employee-detail-page";
import DocumentsPage from "@/pages/documents-page";
import ShiftsPage from "@/pages/shifts-page";

import PfPage from "@/pages/compliance/pf-page";
import EsiPage from "@/pages/compliance/esi-page";
import PtPage from "@/pages/compliance/pt-page";
import MlwfPage from "@/pages/compliance/mlwf-page";
import BonusReportsPage from "@/pages/compliance/bonus-reports-page";
import Form16TdsPage from "@/pages/compliance/form16-tds-page";
import StatutoryCompliancePage from "@/pages/compliance/statutory-compliance-page";

import SalaryStructurePage from "@/pages/payroll/structure-page";
import PayslipsPage from "@/pages/payroll/payslips-page";
import BankTransfersPage from "@/pages/payroll/transfers-page";

import OfferLettersPage from "@/pages/recruitment/offers-page";
import DigitalJoiningPage from "@/pages/recruitment/joining-page";
import RecruitmentDocumentsPage from "@/pages/recruitment/documents-page";

import GoalsPage from "@/pages/performance/goals-page";
import AppraisalsPage from "@/pages/performance/appraisals-page";
import FeedbackPage from "@/pages/performance/feedback-page";
import PerformanceReportsPage from "@/pages/performance/reports-page";

import TrainingCalendarPage from "@/pages/training/calendar-page";
import SkillMatrixPage from "@/pages/training/skills-page";
import CertificationsPage from "@/pages/training/certifications-page";
import TrainingRequestsPage from "@/pages/training/requests-page";

import ExpenseClaimsPage from "@/pages/expense/claims-page";
import TravelRequestsPage from "@/pages/expense/travel-page";
import ReimbursementsPage from "@/pages/expense/reimbursements-page";

import AssetAllocationPage from "@/pages/assets/allocation-page";
import AssetTrackingPage from "@/pages/assets/tracking-page";
import AssetReturnsPage from "@/pages/assets/returns-page";

import AppointmentLettersPage from "@/pages/letters/appointment-page";
import IncrementLettersPage from "@/pages/letters/increment-page";
import WarningLettersPage from "@/pages/letters/warning-page";
import ExperienceLettersPage from "@/pages/letters/experience-page";

import MyProfilePage from "@/pages/self-service/profile-page";
import MyPayslipsPage from "@/pages/self-service/payslips-page";
import MyDocumentsPage from "@/pages/self-service/documents-page";
import MyAttendancePage from "@/pages/self-service/attendance-page";

import HeadcountReportPage from "@/pages/reports/headcount-page";
import ComplianceReportPage from "@/pages/reports/compliance-page";
import AttendanceReportPage from "@/pages/reports/attendance-page";
import LeaveReportPage from "@/pages/reports/leave-page";
import PayrollReportPage from "@/pages/reports/payroll-page";
import MusterRollPage from "@/pages/reports/muster-roll-page";
import LeaveRegisterPage from "@/pages/reports/leave-register-page";

import MasterDataPage from "@/pages/master-data-page";
import BankMasterPage from "@/pages/masters/bank-master-page";
import CategoryMasterPage from "@/pages/masters/category-master-page";
import CompanyMasterPage from "@/pages/masters/company-master-page";
import CostCenterPage from "@/pages/masters/cost-center-page";
import DepartmentMasterPage from "@/pages/masters/department-master-page";
import DocumentApprovalPage from "@/pages/masters/document-approval-page";
import EmpDataUploadPage from "@/pages/masters/empdata-upload-page";
import EmployeeDeductionsPage from "@/pages/masters/employee-deductions-page";
import EmployeeMasterPage from "@/pages/masters/employee-master-page";
import ImportEmployeeMasterPage from "@/pages/masters/import-employee-master-page";
import ImportPayRatePage from "@/pages/masters/import-payrate-page";
import EmployeeLoginPage from "@/pages/masters/employee-login-page";
import MissingDetailsPage from "@/pages/masters/missing-details-page";
import LWFSubcodePage from "@/pages/masters/lwf-subcode-page";
import PTSubcodePage from "@/pages/masters/pt-subcode-page";
import RateMasterPage from "@/pages/masters/rate-master-page";
import SalaryIncrementPage from "@/pages/masters/salary-increment-page";
import SiteMasterPage from "@/pages/masters/site-master-page";

function AppRouter() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/master-data" component={MasterDataPage} />
      <ProtectedRoute path="/master/bank-master" component={BankMasterPage} />
      <ProtectedRoute path="/master/category-master" component={CategoryMasterPage} />
      <ProtectedRoute path="/master/company-master" component={CompanyMasterPage} />
      <ProtectedRoute path="/master/cost-center" component={CostCenterPage} />
      <ProtectedRoute path="/master/department-master" component={DepartmentMasterPage} />
      <ProtectedRoute path="/master/document-approval" component={DocumentApprovalPage} />
      <ProtectedRoute path="/master/empdata-upload" component={EmpDataUploadPage} />
      <ProtectedRoute path="/master/employee-deductions" component={EmployeeDeductionsPage} />
      <ProtectedRoute path="/master/employee-master" component={EmployeeMasterPage} />
      <ProtectedRoute path="/master/import-employee-master" component={ImportEmployeeMasterPage} />
      <ProtectedRoute path="/master/import-payrate" component={ImportPayRatePage} />
      <ProtectedRoute path="/master/employee-login" component={EmployeeLoginPage} />
      <ProtectedRoute path="/master/missing-details" component={MissingDetailsPage} />
      <ProtectedRoute path="/master/lwf-subcode" component={LWFSubcodePage} />
      <ProtectedRoute path="/master/pt-subcode" component={PTSubcodePage} />
      <ProtectedRoute path="/master/rate-master" component={RateMasterPage} />
      <ProtectedRoute path="/masters/salary-increment" component={SalaryIncrementPage} />
      <ProtectedRoute path="/master/site-master" component={SiteMasterPage} />
      
      <ProtectedRoute path="/employees" component={EmployeesPage} />
      <ProtectedRoute path="/employee/:id" component={EmployeeDetailPage} />
      <ProtectedRoute path="/departments" component={DepartmentsPage} />
      <ProtectedRoute path="/documents" component={DocumentsPage} />
      <ProtectedRoute path="/roles" component={RolesPage} />
      
      <ProtectedRoute path="/attendance" component={AttendancePage} />
      <ProtectedRoute path="/leave" component={LeavePage} />
      <ProtectedRoute path="/holidays" component={HolidaysPage} />
      <ProtectedRoute path="/shifts" component={ShiftsPage} />
      
      <ProtectedRoute path="/payroll" component={PayrollPage} />
      <ProtectedRoute path="/payroll/structure" component={SalaryStructurePage} />
      <ProtectedRoute path="/payroll/payslips" component={PayslipsPage} />
      <ProtectedRoute path="/payroll/transfers" component={BankTransfersPage} />
            
      <ProtectedRoute path="/compliance/pf" component={PfPage} />
      <ProtectedRoute path="/compliance/esi" component={EsiPage} />
      <ProtectedRoute path="/compliance/pt" component={PtPage} />
      <ProtectedRoute path="/compliance/mlwf" component={MlwfPage} />
      <ProtectedRoute path="/compliance/bonus-reports" component={BonusReportsPage} />
      <ProtectedRoute path="/compliance/form16-tds" component={Form16TdsPage} />
      <ProtectedRoute path="/compliance/statutory" component={StatutoryCompliancePage} />
      
      <ProtectedRoute path="/recruitment/offers" component={OfferLettersPage} />
      <ProtectedRoute path="/recruitment/joining" component={DigitalJoiningPage} />
      <ProtectedRoute path="/recruitment/documents" component={RecruitmentDocumentsPage} />
      
      <ProtectedRoute path="/performance/goals" component={GoalsPage} />
      <ProtectedRoute path="/performance/appraisals" component={AppraisalsPage} />
      <ProtectedRoute path="/performance/feedback" component={FeedbackPage} />
      <ProtectedRoute path="/performance/reports" component={PerformanceReportsPage} />
      
      <ProtectedRoute path="/training/calendar" component={TrainingCalendarPage} />
      <ProtectedRoute path="/training/skills" component={SkillMatrixPage} />
      <ProtectedRoute path="/training/certifications" component={CertificationsPage} />
      <ProtectedRoute path="/training/requests" component={TrainingRequestsPage} />
      
      <ProtectedRoute path="/expense/claims" component={ExpenseClaimsPage} />
      <ProtectedRoute path="/expense/travel" component={TravelRequestsPage} />
      <ProtectedRoute path="/expense/reimbursements" component={ReimbursementsPage} />
      
      <ProtectedRoute path="/assets/allocation" component={AssetAllocationPage} />
      <ProtectedRoute path="/assets/tracking" component={AssetTrackingPage} />
      <ProtectedRoute path="/assets/returns" component={AssetReturnsPage} />
      
      <ProtectedRoute path="/letters/appointment" component={AppointmentLettersPage} />
      <ProtectedRoute path="/letters/increment" component={IncrementLettersPage} />
      <ProtectedRoute path="/letters/warning" component={WarningLettersPage} />
      <ProtectedRoute path="/letters/experience" component={ExperienceLettersPage} />
      
      <ProtectedRoute path="/self-service/profile" component={MyProfilePage} />
      <ProtectedRoute path="/self-service/payslips" component={MyPayslipsPage} />
      <ProtectedRoute path="/self-service/documents" component={MyDocumentsPage} />
      <ProtectedRoute path="/self-service/attendance" component={MyAttendancePage} />
      
      <ProtectedRoute path="/reports/attendance" component={AttendanceReportPage} />
      <ProtectedRoute path="/reports/leave" component={LeaveReportPage} />
      <ProtectedRoute path="/reports/payroll" component={PayrollReportPage} />
      <ProtectedRoute path="/reports/headcount" component={HeadcountReportPage} />
      <ProtectedRoute path="/reports/compliance" component={ComplianceReportPage} />
      <ProtectedRoute path="/reports/muster-roll" component={MusterRollPage} />
      <ProtectedRoute path="/reports/leave-register" component={LeaveRegisterPage} />
      
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/developer/system-settings" component={SystemSettingsPage} />
      <ProtectedRoute path="/developer/employee-limit" component={EmployeeLimitPage} />
      
      <Route path="/auth" component={AuthPage} />
      <Route path="/invitation/:token" component={InvitationPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Get the base path from Vite's BASE_URL for subdirectory hosting (e.g., /hrms/)
  // Remove trailing slash for wouter's base prop
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';
  
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryClientProvider client={queryClient}>
        <Router base={basePath === '/' ? undefined : basePath}>
          <AuthProvider>
            <SidebarProvider>
              <TooltipProvider>
                <Toaster />
                <AppRouter />
              </TooltipProvider>
            </SidebarProvider>
          </AuthProvider>
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;