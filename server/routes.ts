import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { 
  insertUnitSchema,
  insertDepartmentSchema, 
  insertAttendanceSchema, 
  updateAttendanceSchema,
  insertLeaveRequestSchema, 
  insertHolidaySchema,
  insertEmployeeInvitationSchema,
  systemSettingsSchema,
  insertBankMasterSchema,
  insertCategoryMasterSchema,
  insertCompanyMasterSchema,
  insertCostCenterSchema,
  insertDocumentApprovalSchema,
  insertEmployeeDeductionSchema
} from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { sendEmail, generateInvitationEmail, generateAdminInvitationNotificationEmail, generateEmployeeRegistrationCompletionEmail } from "./sendgrid";

// Permission helper functions for role-based authorization
function getUserPermissions(user: any) {
  const base = {
    admin: "all", 
    developer: "all", 
    hr: [
      "employees.view", "employees.create", "employees.edit",
      "departments.view", "departments.create", "departments.edit",
      "attendance.view", "attendance.edit",
      "leave.view", "leave.approve",
      "reports.view", "roles.view",
      "payroll.view", "payroll.process", "payroll.edit"
    ],
    manager: [
      "employees.view", "departments.view",
      "attendance.view", "attendance.edit",
      "leave.view", "leave.approve",
      "reports.view"
    ],
    employee: [
      "attendance.view", "attendance.mark",
      "leave.view", "leave.create",
      "payroll.view_own"
    ]
  } as const;
  
  const defaults = (user?.role === "admin" || user?.role === "developer") 
    ? "all" 
    : (base as any)[user?.role] || [];
  const merged = defaults === "all" 
    ? new Set<string>(["all"]) 
    : new Set<string>([...defaults, ...(user?.customPermissions || [])]);
  return merged;
}

function hasPermission(req: any, permission: string) { 
  const perms = getUserPermissions(req.user); 
  return perms.has("all") || perms.has(permission); 
}

// Helper function to compute attendance status based on working hours
function computeAttendanceStatus(checkInTime: Date | null, checkOutTime: Date | null): 'present' | 'absent' | 'halfday' | 'late' {
  if (!checkInTime) return 'absent';
  if (!checkOutTime) return 'present'; // Still working
  
  const workingMilliseconds = checkOutTime.getTime() - checkInTime.getTime();
  const workingHours = workingMilliseconds / (1000 * 60 * 60); // Convert to hours
  
  if (workingHours < 4) {
    return 'absent';
  } else if (workingHours < 9) {
    return 'halfday';
  } else {
    return 'present';
  }
}

import multer from "multer";
import * as xlsx from "xlsx";
import { parse as parseCsv } from "csv-parse/sync";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Payroll calculation helper
  app.post("/api/payroll/calculate", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const { salary, overtimeHours = 0, daysWorked = 25, totalDaysInMonth = 30 } = req.body;
      const settings = await storage.getSystemSettings();
      const salaryComponents = settings?.salaryComponents || {
        basicSalaryPercentage: 50,
        hraPercentage: 50,
        epfPercentage: 12,
        esicPercentage: 0.75,
        professionalTax: 200
      };
      
      // Step 1: Gross Salary (Pro-rated based on days worked)
      const gross = (salary / totalDaysInMonth) * daysWorked;
      
      // Step 2: Earnings Breakdown
      const basic = gross * (salaryComponents.basicSalaryPercentage / 100);
      const hra = basic * (salaryComponents.hraPercentage / 100);
      const da = basic * 0.1; 
      const conveyance = 0; 
      const medical = 0; 
      const transAll = basic * 0.16;
      const lta = basic * 0.04;
      const childAll = basic * 0.04;
      const medAll = basic * 0.10;
      const othAll = basic * 0.06;
      
      const otRate = ((basic + da) / 26 / 8) * 2;
      const otAmount = overtimeHours * otRate;
      
      // Special Allowance = Gross - (Sum of other earnings)
      const earningsBeforeSpecial = basic + da + hra + transAll + lta + childAll + medAll + othAll + otAmount;
      const specialAllowance = Math.max(0, gross - earningsBeforeSpecial);
      
      // Statutory Deductions based on updated logic
      const basicLimit = 15000;
      const epfEmployee = Math.min(basic, basicLimit) * 0.12;
      const epfEmployer = Math.min(basic, basicLimit) * 0.13; // Includes Admin charges
      
      const esicEmployee = gross <= 21000 ? Math.round(gross * 0.0075) : 0;
      const esicEmployer = gross <= 21000 ? Math.round(gross * 0.0325) : 0;
      
      const pt = 200;
      
      // MLWF - Half yearly (June & December only) - Employee: 25, Employer: 75
      const currentMonth = new Date().getMonth() + 1;
      const isMlwfMonth = currentMonth === 6 || currentMonth === 12;
      const lwf = isMlwfMonth ? 25 : 0;
      
      const totalDeductions = epfEmployee + esicEmployee + pt + lwf;
      const netSalary = gross - totalDeductions;
      
      res.json({
        earnings: {
          basic, da, hra, conveyance, medical, otAmount, specialAllowance, gross
        },
        deductions: {
          epf: epfEmployee, esic: esicEmployee, pt, lwf, totalDeductions
        },
        netSalary,
        period: {
          daysWorked,
          totalDaysInMonth
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Master Data Routes
  app.get("/api/masters/units", async (req, res, next) => {
    try {
      const units = await storage.getUnits();
      res.json(units);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/units", async (req, res, next) => {
    try {
      const validatedData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(validatedData);
      res.status(201).json(unit);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/banks", async (req, res, next) => {
    try {
      const banks = await storage.getBankMasters();
      res.json(banks);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/banks", async (req, res, next) => {
    try {
      const validatedData = insertBankMasterSchema.parse(req.body);
      const bank = await storage.createBankMaster(validatedData);
      res.status(201).json(bank);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/categories", async (req, res, next) => {
    try {
      const categories = await storage.getCategoryMasters();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/categories", async (req, res, next) => {
    try {
      const validatedData = insertCategoryMasterSchema.parse(req.body);
      const category = await storage.createCategoryMaster(validatedData);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/companies", async (req, res, next) => {
    try {
      const companies = await storage.getCompanyMasters();
      res.json(companies);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/companies", async (req, res, next) => {
    try {
      const validatedData = insertCompanyMasterSchema.parse(req.body);
      const company = await storage.createCompanyMaster(validatedData);
      res.status(201).json(company);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/cost-centers", async (req, res, next) => {
    try {
      const costCenters = await storage.getCostCenters();
      res.json(costCenters);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/cost-centers", async (req, res, next) => {
    try {
      const validatedData = insertCostCenterSchema.parse(req.body);
      const costCenter = await storage.createCostCenter(validatedData);
      res.status(201).json(costCenter);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/document-approvals", async (req, res, next) => {
    try {
      const approvals = await storage.getDocumentApprovals();
      res.json(approvals);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/document-approvals", async (req, res, next) => {
    try {
      const validatedData = insertDocumentApprovalSchema.parse(req.body);
      const approval = await storage.createDocumentApproval(validatedData);
      res.status(201).json(approval);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/masters/employee-deductions", async (req, res, next) => {
    try {
      const deductions = await storage.getEmployeeDeductions();
      res.json(deductions);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/masters/employee-deductions", async (req, res, next) => {
    try {
      const validatedData = insertEmployeeDeductionSchema.parse(req.body);
      const deduction = await storage.createEmployeeDeduction(validatedData);
      res.status(201).json(deduction);
    } catch (error) {
      next(error);
    }
  });

  // Attendance Bulk Upload Route
  app.post("/api/attendance/bulk", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Invalid records format" });
      }

      const results = { success: 0, failed: 0 };
      for (const record of records) {
        try {
          // Find employee by ID or Name
          const employees = await storage.getUsers();
          const emp = employees.find(e => 
            e.employeeId === record.employeeId || 
            `${e.firstName} ${e.lastName}`.toLowerCase() === record.fullName?.toLowerCase()
          );

          if (!emp) continue;

          // For each day in the record
          for (let day = 1; day <= 31; day++) {
            const statusKey = `Day ${day}`;
            const status = record[statusKey];
            if (!status) continue;

            const date = new Date(record.year, record.month - 1, day);
            if (isNaN(date.getTime())) continue;

            // Map status codes
            let attendanceStatus: 'present' | 'absent' | 'halfday' | 'late' = 'present';
            const s = String(status).toUpperCase();
            if (s === 'A') attendanceStatus = 'absent';
            else if (s === 'H') attendanceStatus = 'halfday';
            else if (s === 'L') attendanceStatus = 'absent'; // Mapping leave to absent for now or handle specifically

            await storage.createAttendance({
              userId: emp.id,
              date,
              status: attendanceStatus,
            });
          }
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }

      res.json({ message: "Bulk attendance processed", results });
    } catch (error) {
      next(error);
    }
  });

  // Leave Requests Bulk Upload Route
  app.post("/api/leave-requests/bulk", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
      
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "Invalid records format" });
      }

      const results = { success: 0, failed: 0 };
      for (const record of records) {
        try {
          const employees = await storage.getUsers();
          const emp = employees.find(e => 
            e.employeeId === record.employeeId || 
            `${e.firstName} ${e.lastName}`.toLowerCase() === record.fullName?.toLowerCase()
          );

          if (!emp) continue;

          // Assuming template provides leave data
          // Simplified for now: adding a single leave request if balance is used
          if (record.leaveEnjoyed > 0) {
            await storage.createLeaveRequest({
              userId: emp.id,
              type: 'annual',
              startDate: new Date(), // Placeholders as exact dates aren't in current template
              endDate: new Date(),
              reason: 'Imported from register',
              status: 'approved',
            });
          }
          results.success++;
        } catch (err) {
          results.failed++;
        }
      }

      res.json({ message: "Bulk leave requests processed", results });
    } catch (error) {
      next(error);
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Employee Data Upload Route
  app.post("/api/employees/upload", upload.single("file"), async (req: any, res, next) => {
    try {
      if (typeof req.isAuthenticated === 'function' && !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      } else if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = req.user as any;
      if (!['hr', 'admin', 'developer'].includes(user.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const departmentId = req.body.departmentId ? parseInt(req.body.departmentId) : null;
      let data: any[] = [];

      if (req.file.originalname.endsWith(".csv")) {
        data = parseCsv(req.file.buffer, { columns: true, skip_empty_lines: true });
      } else if (req.file.originalname.endsWith(".xlsx")) {
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      } else {
        return res.status(400).json({ message: "Invalid file format. Only CSV and XLSX supported." });
      }

      // Process each row
      const results = { success: 0, failed: 0, errors: [] as string[] };
      for (const row of data) {
        try {
          const username = row.username || row.Username || row.employeeId || row.EmployeeID;
          const email = row.email || row.Email;
          const firstName = row.firstName || row.FirstName || row.first_name;
          const lastName = row.lastName || row.LastName || row.last_name;

          if (!username || !email || !firstName || !lastName) {
            results.failed++;
            results.errors.push(`Missing required fields for row: ${JSON.stringify(row)}`);
            continue;
          }

          const existingUser = await storage.getUserByUsername(username) || await storage.getUserByEmail(email);
          if (existingUser) {
            results.failed++;
            results.errors.push(`User already exists: ${username} or ${email}`);
            continue;
          }

          const password = await hashPassword("Welcome@123");
          await storage.createUser({
            username,
            email,
            firstName,
            lastName,
            password,
            departmentId: departmentId || (row.departmentId ? parseInt(row.departmentId) : null) || (row.DepartmentID ? parseInt(row.DepartmentID) : null),
            employeeId: row.employeeId || row.EmployeeID || username,
            role: (row.role || "employee").toLowerCase() as any,
            status: "active",
            salary: row.salary ? parseInt(row.salary) : null,
            position: row.position || row.Position || null,
          });
          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`Error processing row: ${err.message}`);
        }
      }

      res.json({ 
        message: `Processed ${data.length} rows. ${results.success} succeeded, ${results.failed} failed.`,
        details: results
      });
    } catch (error) {
      next(error);
    }
  });

  // Department routes
  app.get("/api/departments", async (req, res, next) => {
    try {
      const departments = await storage.getDepartments();
      res.json(departments);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const department = await storage.getDepartment(id);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(department);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/departments", async (req, res, next) => {
    try {
      const validatedData = insertDepartmentSchema.parse(req.body);
      const department = await storage.createDepartment(validatedData);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(id, validatedData);
      
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/departments/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDepartment(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Department not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Employee/User routes
  app.get("/api/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const users = await storage.getUsers();
      
      // Filter out developer users unless the requesting user is also a developer
      const filteredUsers = req.user?.role === 'developer' 
        ? users 
        : users.filter(user => user.role !== 'developer');
      
      // Don't expose passwords in response
      const usersWithoutPasswords = filteredUsers.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/employees/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Don't allow non-developers to access developer user data
      if (user.role === 'developer' && req.user?.role !== 'developer') {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Don't expose password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/employees/:id", async (req, res, next) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const requestingUser = req.user;

      // Authorization: Allow users to update their own profile, or admin/hr/manager can update any
      const canUpdate = requestingUser.id === id || 
                       ['admin', 'hr', 'manager', 'developer'].includes(requestingUser.role);
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied. You can only update your own profile or must have admin/HR privileges." });
      }

      // Password updates should be handled separately
      const { password, ...updateData } = req.body;
      
      // Log document uploads for debugging
      if (updateData.documents && updateData.documents.length > 0) {
        console.log(`[Employee Update] Saving ${updateData.documents.length} documents for employee ${id}`);
      }
      
      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Don't expose password
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // PATCH endpoint for partial updates (used for document uploads)
  app.patch("/api/employees/:id", async (req, res, next) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const requestingUser = req.user;

      // Authorization: Allow users to update their own profile, or admin/hr/manager can update any
      const canUpdate = requestingUser.id === id || 
                       ['admin', 'hr', 'manager', 'developer'].includes(requestingUser.role);
      
      if (!canUpdate) {
        return res.status(403).json({ message: "Access denied. You can only update your own profile or must have admin/HR privileges." });
      }

      // Password updates should be handled separately
      const { password, ...updateData } = req.body;
      
      // Log document uploads for debugging
      if (updateData.documents && updateData.documents.length > 0) {
        console.log(`[Employee PATCH] Saving ${updateData.documents.length} documents for employee ${id}`);
      }
      
      const user = await storage.updateUser(id, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      // Don't expose password
      const { password: userPassword, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/employees/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Employee not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Leave balance endpoint
  app.get("/api/employees/:id/leave-balance", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.id);
      const requestingUser = req.user;
      
      // Check if the user exists
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Don't allow non-developers to access developer user data
      if (targetUser.role === 'developer' && requestingUser?.role !== 'developer') {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Authorization logic: Allow users to see their own leave balance or HR/admin/manager to see any
      const canAccess = requestingUser.id === userId || 
                       ['hr', 'admin', 'manager'].includes(requestingUser.role);
      
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied. You can only view your own leave balance or must have HR/admin/manager privileges." });
      }

      // Calculate leave balance
      const leaveBalance = await storage.calculateLeaveBalance(userId);
      
      res.json(leaveBalance);
    } catch (error) {
      next(error);
    }
  });

  // Change password endpoint
  app.put("/api/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if current password is correct using the same logic as authentication
      let isCurrentPasswordValid = false;
      
      // First, check hardcoded credentials (for users still using default passwords)
      if (
        (user.username === 'admin' && currentPassword === 'admin123') ||
        (user.username === 'hr' && currentPassword === 'hr123') ||
        (user.username === 'manager' && currentPassword === 'manager123') ||
        (user.username === 'employee' && currentPassword === 'employee123')
      ) {
        isCurrentPasswordValid = true;
      } else {
        // Otherwise, check against stored hashed password
        try {
          const scryptAsync = promisify(crypto.scrypt);
          const [hash, salt] = user.password.split('.');
          const keyBuffer = Buffer.from(hash, 'hex');
          const derivedKey = (await scryptAsync(currentPassword, salt, 64)) as Buffer;
          isCurrentPasswordValid = crypto.timingSafeEqual(keyBuffer, derivedKey);
        } catch (error) {
          console.error('Error verifying stored password:', error);
          isCurrentPasswordValid = false;
        }
      }
      
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password
      const scryptAsync = promisify(crypto.scrypt);
      const newSalt = crypto.randomBytes(16).toString('hex');
      const newHashBuffer = (await scryptAsync(newPassword, newSalt, 64)) as Buffer;
      const newHashedPassword = newHashBuffer.toString('hex') + '.' + newSalt;

      // Update password
      await storage.updateUser(user.id, { password: newHashedPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });

  // Update user permissions endpoint
  app.patch("/api/users/permissions", async (req, res, next) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admin users can modify permissions" });
      }

      const { userId, role, customPermissions } = req.body;
      
      if (!userId || !role) {
        return res.status(400).json({ message: "userId and role are required" });
      }

      const updatedUser = await storage.updateUser(userId, {
        role,
        customPermissions: customPermissions || []
      });

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't expose password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/departments/:departmentId/employees", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const departmentId = parseInt(req.params.departmentId);
      const employees = await storage.getUsersByDepartment(departmentId);
      
      // Filter out developer users unless the requesting user is also a developer
      const filteredEmployees = req.user?.role === 'developer' 
        ? employees 
        : employees.filter(employee => employee.role !== 'developer');
      
      // Don't expose passwords
      const employeesWithoutPasswords = filteredEmployees.map(({ password, ...employee }) => employee);
      res.json(employeesWithoutPasswords);
    } catch (error) {
      next(error);
    }
  });

  // Employee invitation routes
  app.post("/api/employees/invite", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only HR and admin can send invitations
      if (!['hr', 'admin'].includes(req.user.role)) {
        return res.status(403).json({ message: "Only HR and admin users can send invitations" });
      }

      const { firstName, lastName, email } = req.body;
      
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ message: "First name, last name, and email are required" });
      }

      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "A user with this email already exists" });
      }

      // Generate secure invitation token
      const invitationToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

      // Store invitation in database
      const invitation = await storage.createEmployeeInvitation({
        token: invitationToken,
        email,
        firstName,
        lastName,
        invitedById: req.user.id,
        expiresAt
      });

      // Generate and send email
      const emailTemplate = generateInvitationEmail(firstName, lastName, invitationToken);
      emailTemplate.to = email;
      
      const emailSent = await sendEmail(emailTemplate);
      
      // Send admin notification emails
      let adminEmailResults = { sent: 0, failed: 0, totalAdmins: 0 };
      
      try {
        // Get all admin users
        const allUsers = await storage.getUsers();
        const adminUsers = allUsers.filter(user => user.role === 'admin');
        adminEmailResults.totalAdmins = adminUsers.length;
        
        if (adminUsers.length > 0) {
          // Get inviter details
          const inviter = await storage.getUser(req.user.id);
          
          if (inviter) {
            const sentAt = new Date();
            const invitationUrl = `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/invitation/${invitationToken}`;
            
            // Send notification to each admin
            for (const admin of adminUsers) {
              try {
                const adminNotificationTemplate = generateAdminInvitationNotificationEmail(
                  { firstName, lastName, email },
                  { 
                    firstName: inviter.firstName, 
                    lastName: inviter.lastName, 
                    email: inviter.email, 
                    role: inviter.role 
                  },
                  { sentAt, expiresAt, invitationUrl },
                  emailSent
                );
                adminNotificationTemplate.to = admin.email;
                
                const adminEmailSent = await sendEmail(adminNotificationTemplate);
                if (adminEmailSent) {
                  adminEmailResults.sent++;
                } else {
                  adminEmailResults.failed++;
                }
              } catch (error) {
                console.warn(`Failed to send admin notification to ${admin.email}:`, error);
                adminEmailResults.failed++;
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error sending admin notifications:', error);
      }
      
      // Always save the invitation to JSON file, even if email fails
      res.status(201).json({
        message: emailSent ? "Invitation sent successfully" : "Invitation created (email delivery failed - please check SendGrid configuration)",
        invitation: {
          id: invitation.id,
          email,
          firstName,
          lastName,
          expiresAt,
          invitationUrl: `${process.env.REPLIT_DOMAINS || 'http://localhost:5000'}/invitation/${invitationToken}`
        },
        emailSent,
        adminNotifications: adminEmailResults
      });
    } catch (error) {
      console.error('Error sending invitation:', error);
      next(error);
    }
  });

  // Invitation acceptance routes
  app.get("/api/invitations/:token", async (req, res, next) => {
    try {
      const { token } = req.params;
      
      const invitation = await storage.getEmployeeInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation has already been used
      if (invitation.usedAt) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      
      res.json({
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        email: invitation.email,
        expiresAt: invitation.expiresAt
      });
    } catch (error) {
      console.error('Error fetching invitation:', error);
      next(error);
    }
  });

  app.post("/api/invitations/:token/accept", async (req, res, next) => {
    try {
      const { token } = req.params;
      const { firstName, lastName, password } = req.body;
      
      if (!firstName || !lastName || !password) {
        return res.status(400).json({ message: "First name, last name, and password are required" });
      }
      
      const invitation = await storage.getEmployeeInvitationByToken(token);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }
      
      // Check if invitation has expired
      if (new Date() > new Date(invitation.expiresAt)) {
        return res.status(400).json({ message: "Invitation has expired" });
      }
      
      // Check if invitation has already been used
      if (invitation.usedAt) {
        return res.status(400).json({ message: "Invitation has already been used" });
      }
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(invitation.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }
      
      // Hash the password using the proper hashing function
      const hashedPassword = await hashPassword(password);
      
      // Create the user account with basic profile (status: invited until they complete full profile)
      const newUser = await storage.createUser({
        username: invitation.email,
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'employee',
        status: 'invited', // Keep as invited until they complete their full profile
        departmentId: null,
        position: 'Employee',
        joinDate: new Date(),
        phoneNumber: null,
        address: null,
        dateOfBirth: null,
        gender: null,
        photoUrl: null,
        bankAccountNumber: null,
        bankAccountHolderName: null,
        bankName: null,
        bankIFSCCode: null,
        bankAccountType: null,
        salary: null,
        customPermissions: []
      });
      
      // Mark invitation as used
      await storage.updateEmployeeInvitation(invitation.id, {
        usedAt: new Date()
      });
      
      // Send confirmation email to all active admin users
      const allUsers = await storage.getUsers();
      const adminUsers = allUsers.filter((user: any) => 
        (user.role === 'hr' || user.role === 'admin') && user.isActive === true
      );
      
      // Get inviter details to include in the email
      let originalInviter = 'System Administrator';
      let inviterRole = 'Admin';
      try {
        const inviterUser = await storage.getUser(invitation.invitedById || 1);
        if (inviterUser) {
          originalInviter = `${inviterUser.firstName} ${inviterUser.lastName}`;
          inviterRole = inviterUser.role === 'hr' ? 'HR Manager' : 
                       inviterUser.role === 'admin' ? 'Administrator' : 'Manager';
        }
      } catch (error) {
        console.log('Could not find inviter details, using defaults');
      }
      
      // Send professional email notification to all admin users
      if (adminUsers.length > 0) {
        const registrationCompletionEmails = adminUsers.map(async (adminUser: any) => {
          const emailTemplate = generateEmployeeRegistrationCompletionEmail(
            {
              firstName: firstName,
              lastName: lastName,
              email: invitation.email,
              joinDate: new Date()
            },
            {
              originalInviter: originalInviter,
              inviterRole: inviterRole,
              completedAt: new Date()
            },
            'HR Connect'
          );
          
          // Set the recipient
          emailTemplate.to = adminUser.email;
          
          return sendEmail(emailTemplate);
        });
        
        // Send all emails concurrently
        try {
          await Promise.all(registrationCompletionEmails);
          console.log(`Registration completion emails sent to ${adminUsers.length} admin users`);
        } catch (emailError) {
          console.error('Error sending registration completion emails:', emailError);
          // Don't fail the registration if email fails
        }
      }
      
      res.status(201).json({
        message: "Registration completed successfully",
        user: {
          id: newUser.id,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          email: newUser.email,
          role: newUser.role
        }
      });
    } catch (error) {
      console.error('Error accepting invitation:', error);
      next(error);
    }
  });

  // Attendance routes
  app.get("/api/attendance", async (req, res, next) => {
    try {
      // Require authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { userId, date, month } = req.query;
      const userRole = req.user.role;
      const currentUserId = req.user.id;
      
      // Reject conflicting parameters
      if (date && month) {
        return res.status(400).json({ message: "Cannot specify both 'date' and 'month' parameters. Use one or the other." });
      }
      
      // Authorization logic based on user role
      if (userId) {
        const requestedUserId = parseInt(userId as string);
        
        // Employees can only access their own attendance
        if (userRole === 'employee' && requestedUserId !== currentUserId) {
          return res.status(403).json({ message: "Access denied. You can only view your own attendance records." });
        }
        
        // Validate month parameter format if provided
        if (month && !/^\d{4}-\d{2}$/.test(month as string)) {
          return res.status(400).json({ message: "Invalid month format. Use YYYY-MM format." });
        }
        
        const records = await storage.getAttendanceByUser(requestedUserId);
        
        // If month parameter is provided, filter by month
        if (month) {
          const [year, monthNum] = (month as string).split('-').map(Number);
          
          // Validate month number
          if (monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: "Invalid month number. Must be between 01-12." });
          }
          
          const filteredRecords = records.filter(record => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        }
        
        return res.json(records);
      }
      
      if (date) {
        // Only admin can query by date for system overview
        if (userRole !== 'admin') {
          return res.status(403).json({ message: "Access denied. Only administrators can query attendance by date." });
        }
        
        // Validate date format
        const dateObj = new Date(date as string);
        if (isNaN(dateObj.getTime())) {
          return res.status(400).json({ message: "Invalid date format." });
        }
        
        const records = await storage.getAttendanceByDate(dateObj);
        return res.json(records);
      }
      
      // Handle month parameter without userId
      if (month) {
        // Validate month parameter format
        if (!/^\d{4}-\d{2}$/.test(month as string)) {
          return res.status(400).json({ message: "Invalid month format. Use YYYY-MM format." });
        }
        
        const [year, monthNum] = (month as string).split('-').map(Number);
        
        // Validate month number
        if (monthNum < 1 || monthNum > 12) {
          return res.status(400).json({ message: "Invalid month number. Must be between 01-12." });
        }
        
        if (userRole === 'admin') {
          // Admin can get all records for a specific month
          const allRecords = await storage.getAllAttendance();
          const filteredRecords = allRecords.filter(record => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        } else {
          // Non-admin users get their own records for the specified month
          const records = await storage.getAttendanceByUser(currentUserId);
          const filteredRecords = records.filter(record => {
            if (!record.date) return false;
            const recordDate = new Date(record.date);
            return recordDate.getFullYear() === year && recordDate.getMonth() === monthNum - 1;
          });
          return res.json(filteredRecords);
        }
      }
      
      // No parameters provided - return user's own records based on role
      if (userRole === 'admin') {
        // Admin can see all records when no filters are specified
        const allRecords = await storage.getAllAttendance();
        return res.json(allRecords);
      } else {
        // All other roles (employee, hr, manager) get only their own records
        const records = await storage.getAttendanceByUser(currentUserId);
        return res.json(records);
      }
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attendance", async (req, res, next) => {
    try {
      // Require authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = req.user.role;
      const currentUserId = req.user.id;
      
      console.log("=== ATTENDANCE CREATE DEBUG ===");
      console.log("Raw request body:", JSON.stringify(req.body, null, 2));
      console.log("Body keys:", Object.keys(req.body));
      console.log("Body types:", Object.keys(req.body).map(k => `${k}: ${typeof req.body[k]}`));
      console.log("User role:", userRole, "User ID:", currentUserId);
      
      const validatedData = insertAttendanceSchema.parse(req.body);
      console.log("Validation SUCCESS, validated data:", JSON.stringify(validatedData, null, 2));
      
      // Authorization: Employees can only create attendance for themselves
      if (userRole === 'employee' && validatedData.userId !== currentUserId) {
        return res.status(403).json({ message: "Access denied. You can only create attendance records for yourself." });
      }
      
      // For employees, always override userId to ensure they can only create their own records
      if (userRole === 'employee') {
        validatedData.userId = currentUserId;
      }
      
      const attendance = await storage.createAttendance(validatedData);
      console.log("Storage create SUCCESS:", JSON.stringify(attendance, null, 2));
      console.log("=== END ATTENDANCE CREATE DEBUG ===");
      
      res.status(201).json(attendance);
    } catch (error) {
      console.log("=== ATTENDANCE CREATE ERROR ===");
      console.log("Error type:", typeof error);
      console.log("Error instanceof z.ZodError:", error instanceof z.ZodError);
      if (error instanceof z.ZodError) {
        console.log("Validation errors:", JSON.stringify(error.errors, null, 2));
      }
      console.log("Full error:", error);
      console.log("=== END ATTENDANCE CREATE ERROR ===");
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/attendance/:id", async (req, res, next) => {
    try {
      // Authentication and authorization check
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Only admin, HR, and manager can edit attendance records
      if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
        return res.status(403).json({ message: "Insufficient permissions to edit attendance records" });
      }
      
      const id = parseInt(req.params.id);
      
      // Validate the request body
      const validatedData = updateAttendanceSchema.partial().parse(req.body);
      
      // Get the existing record to check for time changes
      const existingRecord = await storage.getAttendance(id);
      if (!existingRecord) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      // Prepare update data
      let updateData = { ...validatedData };
      
      // Check if check-in or check-out times are being updated
      const hasTimeUpdate = updateData.checkInTime !== undefined || updateData.checkOutTime !== undefined;
      
      if (hasTimeUpdate) {
        // Safely normalize existing record times to Date objects
        const normalizeToDate = (time: any): Date | null => {
          if (!time) return null;
          if (time instanceof Date) return time;
          if (typeof time === 'string') {
            const date = new Date(time);
            return isNaN(date.getTime()) ? null : date;
          }
          return null;
        };
        
        // Determine final times after update
        const finalCheckInTime = updateData.checkInTime 
          ? normalizeToDate(updateData.checkInTime)
          : normalizeToDate(existingRecord.checkInTime);
        
        const finalCheckOutTime = updateData.checkOutTime 
          ? normalizeToDate(updateData.checkOutTime)
          : normalizeToDate(existingRecord.checkOutTime);
        
        // Recompute status based on working hours
        const computedStatus = computeAttendanceStatus(finalCheckInTime, finalCheckOutTime);
        updateData.status = computedStatus;
      }
      
      const result = await storage.updateAttendance(id, updateData);
      
      if (!result) {
        return res.status(404).json({ message: "Attendance record not found" });
      }
      
      console.log("Update successful:", result);
      console.log("=== END DEBUG ===");
      
      res.json(result);
    } catch (error) {
      console.log("=== ERROR ===");
      console.log("Error type:", typeof error);
      console.log("Error constructor:", error?.constructor?.name);
      console.log("Error message:", (error as any)?.message);
      console.log("Full error:", error);
      console.log("=== END ERROR ===");
      
      return res.status(500).json({ 
        message: "Internal server error", 
        error: (error as any)?.message || "Unknown error" 
      });
    }
  });

  app.post("/api/attendance/check-in", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const now = new Date();
      
      // Check if user has already checked in today
      const todayRecords = await storage.getAttendanceByDate(now);
      const userTodayRecord = todayRecords.find(record => record.userId === userId);
      
      if (userTodayRecord && userTodayRecord.checkInTime) {
        return res.status(400).json({ message: "Already checked in today" });
      }
      
      const attendance = await storage.createAttendance({
        userId,
        checkInTime: now,
        date: now,
        status: 'present',
        notes: ''
      });
      
      res.status(201).json(attendance);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/attendance/check-out", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const userId = req.user.id;
      const now = new Date();
      
      // Find today's check-in record
      const todayRecords = await storage.getAttendanceByDate(now);
      const userTodayRecord = todayRecords.find(record => record.userId === userId);
      
      if (!userTodayRecord) {
        return res.status(404).json({ message: "No check-in record found for today" });
      }
      
      if (userTodayRecord.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today" });
      }
      
      // Calculate status based on working hours
      const status = computeAttendanceStatus(userTodayRecord.checkInTime ? new Date(userTodayRecord.checkInTime) : null, now);
      
      const attendance = await storage.updateAttendance(userTodayRecord.id, {
        checkOutTime: now,
        status: status
      });
      
      res.json(attendance);
    } catch (error) {
      next(error);
    }
  });

  // Leave request routes
  app.get("/api/leave-requests", async (req, res, next) => {
    try {
      const { userId, status } = req.query;
      
      if (userId) {
        const requests = await storage.getLeaveRequestsByUser(parseInt(userId as string));
        return res.json(requests);
      }
      
      if (status === 'pending') {
        const requests = await storage.getPendingLeaveRequests();
        return res.json(requests);
      }
      
      // If no query params, return all requests (for admins/HR)
      if (req.user && (req.user.role === 'admin' || req.user.role === 'hr')) {
        const requests = await storage.getAllLeaveRequests();
        return res.json(requests);
      }
      
      res.status(400).json({ message: "Missing query parameters or insufficient permissions" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/leave-requests", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Set userId from authenticated user if not specified and convert dates
      const data = {
        ...req.body,
        userId: req.body.userId || req.user.id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate)
      };
      
      const validatedData = insertLeaveRequestSchema.parse(data);
      const leaveRequest = await storage.createLeaveRequest(validatedData);
      
      // Create notification for leave request submission
      try {
        await storage.createNotification({
          userId: leaveRequest.userId,
          type: 'leave_request',
          title: 'Leave Request Submitted',
          message: `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been submitted and is pending approval.`,
          isRead: false,
          relatedLeaveId: leaveRequest.id
        });
        
        // Notify admins about new leave request
        const adminUsers = await storage.getAdminUsers();
        const employee = await storage.getUser(leaveRequest.userId);
        for (const admin of adminUsers) {
          await storage.createNotification({
            userId: admin.id,
            type: 'leave_request',
            title: 'New Leave Request',
            message: `${employee?.firstName} ${employee?.lastName} has submitted a leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} for ${leaveRequest.type} leave.`,
            isRead: false,
            relatedLeaveId: leaveRequest.id,
            relatedUserId: leaveRequest.userId
          });
        }
      } catch (notificationError) {
        console.error('Failed to create leave request notification:', notificationError);
      }
      
      res.status(201).json(leaveRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/leave-requests/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert dates if they exist in the request body
      const data = { ...req.body };
      if (data.startDate) {
        data.startDate = new Date(data.startDate);
      }
      if (data.endDate) {
        data.endDate = new Date(data.endDate);
      }
      
      // For approvals, set the approver ID
      if (data.status === 'approved' && req.isAuthenticated()) {
        data.approvedById = req.user.id;
      }
      
      const validatedData = insertLeaveRequestSchema.partial().parse(data);
      const leaveRequest = await storage.updateLeaveRequest(id, validatedData);
      
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      // Create notification for leave status updates
      if (data.status && (data.status === 'approved' || data.status === 'rejected')) {
        try {
          const statusTitle = data.status === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected';
          const statusMessage = data.status === 'approved' 
            ? `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been approved.`
            : `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been rejected.`;
            
          await storage.createNotification({
            userId: leaveRequest.userId,
            type: data.status === 'approved' ? 'leave_approved' : 'leave_rejected',
            title: statusTitle,
            message: statusMessage,
            isRead: false,
            relatedLeaveId: leaveRequest.id,
            relatedUserId: req.user?.id
          });
        } catch (notificationError) {
          console.error('Failed to create leave status notification:', notificationError);
        }
      }
      
      res.json(leaveRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/leave-requests/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Get the leave request first to check ownership
      const leaveRequest = await storage.getLeaveRequest(id);
      
      if (!leaveRequest) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      // Users can only cancel their own requests, or admins/HR can cancel any
      if (leaveRequest.userId !== req.user.id && 
          req.user.role !== 'admin' && 
          req.user.role !== 'hr') {
        return res.status(403).json({ message: "You can only cancel your own leave requests" });
      }
      
      // Only allow cancellation of pending requests
      if (leaveRequest.status !== 'pending') {
        return res.status(400).json({ message: "Only pending leave requests can be canceled" });
      }
      
      const deleted = await storage.deleteLeaveRequest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Leave request not found" });
      }
      
      // Create notification for canceled leave request
      try {
        await storage.createNotification({
          userId: leaveRequest.userId,
          type: 'leave_request',
          title: 'Leave Request Canceled',
          message: `Your leave request from ${new Date(leaveRequest.startDate).toLocaleDateString()} to ${new Date(leaveRequest.endDate).toLocaleDateString()} has been canceled.`,
          isRead: false,
          relatedLeaveId: leaveRequest.id
        });
      } catch (notificationError) {
        console.error('Failed to create leave cancellation notification:', notificationError);
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Holiday routes
  app.get("/api/holidays", async (req, res, next) => {
    try {
      const holidays = await storage.getHolidays();
      res.json(holidays);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/holidays", async (req, res, next) => {
    try {
      // Convert date string to Date object before validation
      const bodyWithDateConversion = {
        ...req.body,
        date: new Date(req.body.date)
      };
      
      const validatedData = insertHolidaySchema.parse(bodyWithDateConversion);
      const holiday = await storage.createHoliday(validatedData);
      res.status(201).json(holiday);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.put("/api/holidays/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      
      // Convert date string to Date object before validation if date is provided
      const bodyWithDateConversion = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) })
      };
      
      const validatedData = insertHolidaySchema.partial().parse(bodyWithDateConversion);
      const holiday = await storage.updateHoliday(id, validatedData);
      
      if (!holiday) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      
      res.json(holiday);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/holidays/:id", async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHoliday(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Holiday not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Reports routes
  app.get("/api/reports/attendance", async (req, res, next) => {
    try {
      const { startDate, endDate, departmentId } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Get all attendance records
      const allUsers = await storage.getUsers();
      const allAttendance = [];
      
      // Filter users by department if specified
      let users = allUsers;
      if (departmentId) {
        users = allUsers.filter(user => user.departmentId === parseInt(departmentId as string));
      }
      
      // Build report data
      for (const user of users) {
        const userAttendance = await storage.getAttendanceByUser(user.id);
        const filteredAttendance = userAttendance.filter(record => {
          const recordDate = record.date ? new Date(record.date) : null;
          return recordDate && recordDate >= start && recordDate <= end;
        });
        
        if (filteredAttendance.length > 0) {
          allAttendance.push({
            user: { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName,
              position: user.position,
              departmentId: user.departmentId
            },
            records: filteredAttendance
          });
        }
      }
      
      res.json(allAttendance);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/reports/leave", async (req, res, next) => {
    try {
      const { startDate, endDate, departmentId, status } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "startDate and endDate are required" });
      }
      
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      // Get all users
      const allUsers = await storage.getUsers();
      const leaveReport = [];
      
      // Filter users by department if specified
      let users = allUsers;
      if (departmentId) {
        users = allUsers.filter(user => user.departmentId === parseInt(departmentId as string));
      }
      
      // Build report data
      for (const user of users) {
        const userLeaveRequests = await storage.getLeaveRequestsByUser(user.id);
        
        // Filter by date range and status if specified
        let filteredRequests = userLeaveRequests.filter(request => {
          const requestStart = new Date(request.startDate);
          const requestEnd = new Date(request.endDate);
          return (requestStart >= start && requestStart <= end) || 
                 (requestEnd >= start && requestEnd <= end);
        });
        
        if (status) {
          filteredRequests = filteredRequests.filter(request => request.status === status);
        }
        
        if (filteredRequests.length > 0) {
          leaveReport.push({
            user: { 
              id: user.id, 
              firstName: user.firstName, 
              lastName: user.lastName,
              position: user.position,
              departmentId: user.departmentId
            },
            leaveRequests: filteredRequests
          });
        }
      }
      
      res.json(leaveReport);
    } catch (error) {
      next(error);
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notifications = await storage.getNotificationsByUser(req.user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/notifications/unread", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const unreadNotifications = await storage.getUnreadNotificationsByUser(req.user.id);
      res.json(unreadNotifications);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/notifications", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const notification = await storage.createNotification(req.body);
      res.status(201).json(notification);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/notifications/:id/read", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.json({ message: "Notification marked as read" });
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/notifications/read-all", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.markAllNotificationsAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/notifications/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Payment record routes
  app.get("/api/payment-records", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { employeeId, month } = req.query;
      
      // Admin/HR can access all payment records
      if (hasPermission(req, "payroll.view")) {
        if (employeeId) {
          const records = await storage.getPaymentRecordsByEmployee(parseInt(employeeId as string));
          return res.json(records);
        }
        
        if (month) {
          const records = await storage.getPaymentRecordsByMonth(month as string);
          return res.json(records);
        }
        
        const records = await storage.getPaymentRecords();
        return res.json(records);
      }
      
      // Employees can only access their own payment records
      if (hasPermission(req, "payroll.view_own")) {
        const records = await storage.getPaymentRecordsByEmployee(req.user!.id);
        
        if (month) {
          // Filter by month on the server side for security
          const filteredRecords = records.filter(record => record.month === month);
          return res.json(filteredRecords);
        }
        
        return res.json(records);
      }
      
      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/payment-records", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const paymentRecord = await storage.createPaymentRecord(req.body);
      res.status(201).json(paymentRecord);
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/payment-records/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const id = parseInt(req.params.id);
      const updatedRecord = await storage.updatePaymentRecord(id, req.body);
      
      if (!updatedRecord) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      res.json(updatedRecord);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/payment-records/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      if (!hasPermission(req, "payroll.process")) {
        return res.status(403).json({ message: "Forbidden" });
      }

      const id = parseInt(req.params.id);
      const success = await storage.deletePaymentRecord(id);
      
      if (!success) {
        return res.status(404).json({ message: "Payment record not found" });
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Settings routes
  const SETTINGS_FILE_PATH = path.join(process.cwd(), 'data', 'system-settings.json');

  // Helper function to read settings from JSON file
  const readSettings = async () => {
    try {
      const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      // Return default settings if file doesn't exist
      return {
        organizationName: "HR Connect",
        organizationEmail: "admin@hrconnect.com",
        timeZone: "Asia/Kolkata",
        dateFormat: "DD/MM/YYYY",
        workingHours: {
          start: "09:00",
          end: "18:00"
        },
        notifications: {
          email: true,
          push: true,
          attendance: true,
          leave: true
        },
        systemLimits: {
          maxEmployees: 10,
          contactEmail: "support@hrconnect.com",
          contactPhone: "+1-234-567-8900",
          upgradeLink: "https://hrconnect.com/upgrade"
        },
        salaryComponents: {
          basicSalaryPercentage: 50,
          hraPercentage: 50,
          epfPercentage: 12,
          esicPercentage: 0.75,
          professionalTax: 200
        }
      };
    }
  };

  // Helper function to write settings to JSON file
  const writeSettings = async (settings: any) => {
    try {
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error writing settings:', error);
      return false;
    }
  };

  // Get system settings
  app.get("/api/settings/system", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only admin and developer users can access system settings
      if (req.user.role !== 'admin' && req.user.role !== 'developer') {
        return res.status(403).json({ message: "Forbidden: Admin or Developer access required" });
      }

      const settings = await readSettings();
      res.json(settings);
    } catch (error) {
      next(error);
    }
  });

  // Update system settings
  app.put("/api/settings/system", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Only admin and developer users can update system settings
      if (req.user.role !== 'admin' && req.user.role !== 'developer') {
        return res.status(403).json({ message: "Forbidden: Admin or Developer access required" });
      }

      // Validate the request body using the system settings schema
      const validationResult = systemSettingsSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid settings data", 
          errors: validationResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      const success = await writeSettings(validationResult.data);
      if (!success) {
        return res.status(500).json({ message: "Failed to save settings" });
      }

      res.json({ message: "Settings updated successfully", data: validationResult.data });
    } catch (error) {
      next(error);
    }
  });

  // Update user profile
  app.put("/api/user/profile", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { firstName, lastName, email, phone, address, department } = req.body;
      
      // Update user profile data
      const updateData: any = {
        firstName,
        lastName,
        email,
      };

      if (phone) updateData.phoneNumber = phone;
      if (address) updateData.address = address;
      if (department) updateData.departmentId = parseInt(department);

      const updatedUser = await storage.updateUser(req.user.id, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Don't expose password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Change password
  app.post("/api/user/change-password", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      const user = await storage.getUserByUsername(req.user.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Import password functions from auth
      const { comparePasswords, hashPassword } = await import("./auth");
      
      // Verify current password
      const isValidPassword = await comparePasswords(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      // Hash new password and update
      const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user.id, { password: hashedNewPassword });

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      next(error);
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
