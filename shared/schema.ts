import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Role enum for role-based access control
export const roleEnum = pgEnum('role', ['admin', 'hr', 'manager', 'employee', 'developer']);

// Unit schema
export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull(),
  description: text("description"),
});

export const insertUnitSchema = createInsertSchema(units).pick({
  name: true,
  code: true,
  description: true,
});

export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Unit = typeof units.$inferSelect;

// Department schema
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull(),
  manager: text("manager"),
  location: text("location"),
  description: text("description"),
  unitId: integer("unit_id").references(() => units.id),
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  code: true,
  manager: true,
  location: true,
  description: true,
});

export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;
export type Department = typeof departments.$inferSelect;

// Gender enum
export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);

// Account type enum
export const accountTypeEnum = pgEnum('account_type', ['savings', 'current', 'salary']);

// Employee status enum for invitation workflow
export const employeeStatusEnum = pgEnum('employee_status', ['invited', 'active', 'inactive']);

// Marital status enum
export const maritalStatusEnum = pgEnum('marital_status', ['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say']);

// Attendance status enum
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'halfday', 'late']);

// User/Employee schema (moved before employeeInvitations to resolve circular reference)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").unique(), // Unique employee identifier
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  gender: genderEnum("gender"),
  maritalStatus: maritalStatusEnum("marital_status"),
  photoUrl: text("photo_url"),
  role: roleEnum("role").notNull().default('employee'),
  departmentId: integer("department_id").references(() => departments.id),
  position: text("position"),
  joinDate: timestamp("join_date").defaultNow(),
  workLocation: text("work_location"),
  reportingTo: integer("reporting_to"),
  phoneNumber: text("phone_number"),
  address: text("address"),
  uanNumber: text("uan_number"),
  esicNumber: text("esic_number"),
  aadhaarCard: text("aadhaar_card"),
  panCard: text("pan_card"),
  employmentType: text("employment_type").default('permanent'), // permanent, contract, consultant
  pfApplicable: boolean("pf_applicable").default(true),
  esicApplicable: boolean("esic_applicable").default(true),
  ptApplicable: boolean("pt_applicable").default(true),
  incomeTaxApplicable: boolean("income_tax_applicable").default(false),
  mlwfApplicable: boolean("mlwf_applicable").default(false),
  overtimeApplicable: boolean("overtime_applicable").default(false),
  bonusApplicable: boolean("bonus_applicable").default(false),
  bankName: text("bank_name"),
  bankAccountNumber: text("bank_account_number"),
  bankIFSCCode: text("bank_ifsc_code"),
  bankAccountType: accountTypeEnum("bank_account_type"),
  salary: integer("salary"),
  isActive: boolean("is_active").default(true),
  status: employeeStatusEnum("status").notNull().default('active'), // Track invitation workflow
  customPermissions: text("custom_permissions").array(),
  documents: text("documents").array(), // Array of base64 encoded document data with metadata
});

export const insertUserSchema = createInsertSchema(users).pick({
  employeeId: true,
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  maritalStatus: true,
  photoUrl: true,
  role: true,
  departmentId: true,
  position: true,
  joinDate: true,
  workLocation: true,
  reportingTo: true,
  phoneNumber: true,
  address: true,
  bankAccountNumber: true,
  bankName: true,
  bankIFSCCode: true,
  bankAccountType: true,
  aadhaarCard: true,
  panCard: true,
  salary: true,
  status: true,
  customPermissions: true,
  documents: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Employee invitations schema for secure token-based invitations
export const employeeInvitations = pgTable("employee_invitations", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(), // Secure UUID token
  email: text("email").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  invitedById: integer("invited_by_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(), // Token expiration (7 days)
  usedAt: timestamp("used_at"), // When invitation was accepted
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEmployeeInvitationSchema = createInsertSchema(employeeInvitations).pick({
  token: true,
  email: true,
  firstName: true,
  lastName: true,
  invitedById: true,
  expiresAt: true,
});

export type InsertEmployeeInvitation = z.infer<typeof insertEmployeeInvitationSchema>;
export type EmployeeInvitation = typeof employeeInvitations.$inferSelect;

// Attendance schema
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  checkInTime: timestamp("check_in_time").defaultNow(),
  checkOutTime: timestamp("check_out_time"),
  date: timestamp("date").defaultNow(),
  status: text("status").notNull().default('present'), // present, absent, halfday, late
  notes: text("notes"),
});

// Custom schema to handle date strings from frontend
export const insertAttendanceSchema = z.object({
  userId: z.number(),
  checkInTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  checkOutTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  date: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  status: z.enum(['present', 'absent', 'halfday', 'late']).optional(),
  notes: z.string().optional(),
});

// Create a specific schema for updating attendance records
export const updateAttendanceSchema = z.object({
  checkInTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  checkOutTime: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  date: z.union([
    z.date(),
    z.string().transform((str) => new Date(str))
  ]).optional(),
  status: z.enum(['present', 'absent', 'halfday', 'late']).optional(),
  notes: z.string().optional(),
});

export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type UpdateAttendance = z.infer<typeof updateAttendanceSchema>;
export type Attendance = typeof attendanceRecords.$inferSelect;

// Leave types enum
export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'personal', 'halfday', 'unpaid', 'other', 'workfromhome']);

// Leave request status enum
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected']);

// Leave requests schema
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: leaveTypeEnum("type").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default('pending'),
  approvedById: integer("approved_by_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).pick({
  userId: true,
  type: true,
  startDate: true,
  endDate: true,
  reason: true,
  status: true,
  approvedById: true,
});

export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;

// Holidays schema
export const holidays = pgTable("holidays", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  description: text("description"),
});

export const insertHolidaySchema = createInsertSchema(holidays).pick({
  name: true,
  date: true,
  description: true,
});

export type InsertHoliday = z.infer<typeof insertHolidaySchema>;
export type Holiday = typeof holidays.$inferSelect;

// Notification type enum
export const notificationTypeEnum = pgEnum('notification_type', ['login', 'logout', 'leave_request', 'leave_approved', 'leave_rejected']);

// Notifications schema
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  relatedUserId: integer("related_user_id").references(() => users.id),
  relatedLeaveId: integer("related_leave_id").references(() => leaveRequests.id),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  type: true,
  title: true,
  message: true,
  isRead: true,
  relatedUserId: true,
  relatedLeaveId: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid']);

// Payment mode enum
export const paymentModeEnum = pgEnum('payment_mode', ['bank_transfer', 'cheque', 'cash', 'upi']);

// Payment records schema
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  month: text("month").notNull(), // Format: "MMM yyyy" e.g., "Jan 2025"
  paymentStatus: paymentStatusEnum("payment_status").notNull().default('pending'),
  amount: integer("amount").notNull(),
  paymentDate: timestamp("payment_date"),
  paymentMode: paymentModeEnum("payment_mode"),
  referenceNo: text("reference_no"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).pick({
  employeeId: true,
  month: true,
  paymentStatus: true,
  amount: true,
  paymentDate: true,
  paymentMode: true,
  referenceNo: true,
});

export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecords.$inferSelect;

// System settings validation schema
export const systemSettingsSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required").optional(),
  organizationEmail: z.string().email("Valid email is required").optional(),
  timeZone: z.string().optional(),
  dateFormat: z.string().optional(),
  workingHours: z.object({
    start: z.string(),
    end: z.string()
  }).optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    attendance: z.boolean(),
    leave: z.boolean()
  }).optional(),
  systemLimits: z.object({
    maxEmployees: z.coerce.number().min(1).max(1000),
    contactEmail: z.string().email(),
    contactPhone: z.string(),
    upgradeLink: z.string().url()
  }).optional(),
  salaryComponents: z.object({
    basicSalaryPercentage: z.coerce.number().min(0, "Basic salary percentage must be at least 0").max(100, "Basic salary percentage cannot exceed 100"),
    hraPercentage: z.coerce.number().min(0, "HRA percentage must be at least 0").max(100, "HRA percentage cannot exceed 100"),
    epfPercentage: z.coerce.number().min(0, "EPF percentage must be at least 0").max(100, "EPF percentage cannot exceed 100"),
    esicPercentage: z.coerce.number().min(0, "ESIC percentage must be at least 0").max(100, "ESIC percentage cannot exceed 100"),
    professionalTax: z.coerce.number().min(0, "Professional tax must be at least 0")
  }).optional()
});

export type SystemSettings = z.infer<typeof systemSettingsSchema>;

// Bank Master schema
export const bankMasters = pgTable("bank_masters", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  branch: text("branch").notNull(),
  branchCode: text("branch_code"),
  address: text("address"),
  accountNo: text("account_no"),
  ifscCode: text("ifsc_code"),
  micrCode: text("micr_code"),
});

export const insertBankMasterSchema = createInsertSchema(bankMasters).pick({
  bankName: true,
  branch: true,
  branchCode: true,
  address: true,
  accountNo: true,
  ifscCode: true,
  micrCode: true,
});

export type InsertBankMaster = z.infer<typeof insertBankMasterSchema>;
export type BankMaster = typeof bankMasters.$inferSelect;

// Document Approval schema
export const documentApprovals = pgTable("document_approvals", {
  id: serial("id").primaryKey(),
  documentType: text("document_type").notNull(),
  approverId: integer("approver_id").notNull().references(() => users.id),
  status: text("status").notNull().default('pending'),
  remarks: text("remarks"),
});

export const insertDocumentApprovalSchema = createInsertSchema(documentApprovals).pick({
  documentType: true,
  approverId: true,
  status: true,
  remarks: true,
});

export type InsertDocumentApproval = z.infer<typeof insertDocumentApprovalSchema>;
export type DocumentApproval = typeof documentApprovals.$inferSelect;

// Employee Deductions schema
export const employeeDeductions = pgTable("employee_deductions", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").notNull().references(() => users.id),
  deductionType: text("deduction_type").notNull(),
  amount: integer("amount").notNull(),
  month: text("month").notNull(),
});

export const insertEmployeeDeductionSchema = createInsertSchema(employeeDeductions).pick({
  employeeId: true,
  deductionType: true,
  amount: true,
  month: true,
});

export type InsertEmployeeDeduction = z.infer<typeof insertEmployeeDeductionSchema>;
export type EmployeeDeduction = typeof employeeDeductions.$inferSelect;

// Category Master schema
export const categoryMasters = pgTable("category_masters", {
  id: serial("id").primaryKey(),
  categoryDescription: text("category_description").notNull(),
  class: text("class").notNull(), // SemiSkilled, Management, Worker, etc.
});

export const insertCategoryMasterSchema = createInsertSchema(categoryMasters).pick({
  categoryDescription: true,
  class: true,
});

export type InsertCategoryMaster = z.infer<typeof insertCategoryMasterSchema>;
export type CategoryMaster = typeof categoryMasters.$inferSelect;

// Company Master schema
export const companyMasters = pgTable("company_masters", {
  id: serial("id").primaryKey(),
  companyCode: text("company_code").notNull(),
  companyName: text("company_name").notNull(),
  address: text("address"),
  state: text("state"),
  pinCode: text("pin_code"),
  regdNo: text("regd_no"),
  pfcCode: text("pfc_code"),
  esicCode: text("esic_code"),
  panNo: text("pan_no"),
  tanNo: text("tan_no"),
  gstNo: text("gst_no"),
  email: text("email"),
  natureOfBusiness: text("nature_of_business"),
  esiEmployeeContribution: text("esi_employee_contribution"),
  esiEmployerContribution: text("esi_employer_contribution"),
  pfEmployerContribution: text("pf_employer_contribution"),
});

export const insertCompanyMasterSchema = createInsertSchema(companyMasters).pick({
  companyCode: true,
  companyName: true,
  address: true,
  state: true,
  pinCode: true,
  regdNo: true,
  pfcCode: true,
  esicCode: true,
  panNo: true,
  tanNo: true,
  gstNo: true,
  email: true,
  natureOfBusiness: true,
  esiEmployeeContribution: true,
  esiEmployerContribution: true,
  pfEmployerContribution: true,
});

export type InsertCompanyMaster = z.infer<typeof insertCompanyMasterSchema>;
export type CompanyMaster = typeof companyMasters.$inferSelect;

// Cost Center schema
export const costCenters = pgTable("cost_centers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
});

export const insertCostCenterSchema = createInsertSchema(costCenters).pick({
  name: true,
});

export type InsertCostCenter = z.infer<typeof insertCostCenterSchema>;
export type CostCenter = typeof costCenters.$inferSelect;

// Leave Balance schema for calculating employee leave balances
export const leaveBalanceSchema = z.object({
  asOfDate: z.date(),
  totalAccrued: z.number(),
  totalTaken: z.number(),
  pendingRequests: z.number(),
  remainingBalance: z.number(),
  nextAccrualDate: z.date(),
  accruedThisYear: z.number(),
  takenThisYear: z.number()
});

export type LeaveBalance = z.infer<typeof leaveBalanceSchema>;

// Leave Balance Response schema for API responses
export const leaveBalanceResponseSchema = z.object({
  success: z.boolean(),
  data: leaveBalanceSchema.optional(),
  error: z.string().optional()
});

export type LeaveBalanceResponse = z.infer<typeof leaveBalanceResponseSchema>;
