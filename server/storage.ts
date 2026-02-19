import { 
  Unit, InsertUnit,
  User, InsertUser, Department, InsertDepartment, 
  Attendance, InsertAttendance, LeaveRequest, InsertLeaveRequest,
  Holiday, InsertHoliday, Notification, InsertNotification,
  PaymentRecord, InsertPaymentRecord, EmployeeInvitation, InsertEmployeeInvitation,
  LeaveBalance,
  BankMaster, InsertBankMaster, CategoryMaster, InsertCategoryMaster,
  CompanyMaster, InsertCompanyMaster, CostCenter, InsertCostCenter,
  DocumentApproval, InsertDocumentApproval, EmployeeDeduction, InsertEmployeeDeduction
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { differenceInMonths, startOfYear, endOfYear, addMonths } from "date-fns";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Master data methods
  getUnits(): Promise<Unit[]>;
  createUnit(unit: InsertUnit): Promise<Unit>;
  getBankMasters(): Promise<BankMaster[]>;
  createBankMaster(bank: InsertBankMaster): Promise<BankMaster>;
  getCategoryMasters(): Promise<CategoryMaster[]>;
  createCategoryMaster(category: InsertCategoryMaster): Promise<CategoryMaster>;
  getCompanyMasters(): Promise<CompanyMaster[]>;
  createCompanyMaster(company: InsertCompanyMaster): Promise<CompanyMaster>;
  getCostCenters(): Promise<CostCenter[]>;
  createCostCenter(costCenter: InsertCostCenter): Promise<CostCenter>;
  getDocumentApprovals(): Promise<DocumentApproval[]>;
  createDocumentApproval(approval: InsertDocumentApproval): Promise<DocumentApproval>;
  getEmployeeDeductions(): Promise<EmployeeDeduction[]>;
  createEmployeeDeduction(deduction: InsertEmployeeDeduction): Promise<EmployeeDeduction>;

  // User/Employee methods
  getUser(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getUsersByDepartment(departmentId: number): Promise<User[]>;
  
  // Department methods
  getDepartment(id: number): Promise<Department | undefined>;
  getDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<Department>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Attendance methods
  getAttendance(id: number): Promise<Attendance | undefined>;
  getAttendanceByUser(userId: number): Promise<Attendance[]>;
  getAttendanceByDate(date: Date): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: number, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Leave methods
  getLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]>;
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  createLeaveRequest(leaveRequest: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: number, leaveRequest: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  deleteLeaveRequest(id: number): Promise<boolean>;
  
  getSystemSettings(): Promise<any>;

  // Holiday methods
  getHoliday(id: number): Promise<Holiday | undefined>;
  getHolidays(): Promise<Holiday[]>;
  createHoliday(holiday: InsertHoliday): Promise<Holiday>;
  updateHoliday(id: number, holiday: Partial<Holiday>): Promise<Holiday | undefined>;
  deleteHoliday(id: number): Promise<boolean>;
  
  // Notification methods
  getNotification(id: number): Promise<Notification | undefined>;
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  deleteNotification(id: number): Promise<boolean>;
  
  // Employee invitation methods
  getEmployeeInvitation(id: number): Promise<EmployeeInvitation | undefined>;
  getEmployeeInvitationByToken(token: string): Promise<EmployeeInvitation | undefined>;
  getEmployeeInvitations(): Promise<EmployeeInvitation[]>;
  createEmployeeInvitation(invitation: InsertEmployeeInvitation): Promise<EmployeeInvitation>;
  updateEmployeeInvitation(id: number, invitation: Partial<EmployeeInvitation>): Promise<EmployeeInvitation | undefined>;
  deleteEmployeeInvitation(id: number): Promise<boolean>;
  
  // Payment record methods
  getPaymentRecord(id: number): Promise<PaymentRecord | undefined>;
  getPaymentRecords(): Promise<PaymentRecord[]>;
  getPaymentRecordsByEmployee(employeeId: number): Promise<PaymentRecord[]>;
  getPaymentRecordsByMonth(month: string): Promise<PaymentRecord[]>;
  createPaymentRecord(paymentRecord: InsertPaymentRecord): Promise<PaymentRecord>;
  updatePaymentRecord(id: number, paymentRecord: Partial<PaymentRecord>): Promise<PaymentRecord | undefined>;
  deletePaymentRecord(id: number): Promise<boolean>;
  
  // Leave balance calculation methods
  calculateLeaveBalance(userId: number, asOfDate?: Date): Promise<LeaveBalance>;
  
  // Session store
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private units: Map<number, Unit>;
  private users: Map<number, User>;
  private departments: Map<number, Department>;
  private attendanceRecords: Map<number, Attendance>;
  private leaveRequests: Map<number, LeaveRequest>;
  private holidayRecords: Map<number, Holiday>;
  private notifications: Map<number, Notification>;
  private paymentRecords: Map<number, PaymentRecord>;
  private employeeInvitations: Map<number, EmployeeInvitation>;
  private bankMasters: Map<number, BankMaster>;
  private categoryMasters: Map<number, CategoryMaster>;
  private companyMasters: Map<number, CompanyMaster>;
  private costCenters: Map<number, CostCenter>;
  private documentApprovals: Map<number, DocumentApproval>;
  private employeeDeductions: Map<number, EmployeeDeduction>;
  
  currentUnitId: number;
  currentUserId: number;
  currentDepartmentId: number;
  currentAttendanceId: number;
  currentLeaveRequestId: number;
  currentHolidayId: number;
  currentNotificationId: number;
  currentPaymentRecordId: number;
  currentInvitationId: number;
  currentBankMasterId: number;
  currentCategoryMasterId: number;
  currentCompanyMasterId: number;
  currentCostCenterId: number;
  currentDocumentApprovalId: number;
  currentEmployeeDeductionId: number;
  sessionStore: session.Store;

  constructor() {
    this.units = new Map();
    this.users = new Map();
    this.departments = new Map();
    this.attendanceRecords = new Map();
    this.leaveRequests = new Map();
    this.holidayRecords = new Map();
    this.notifications = new Map();
    this.paymentRecords = new Map();
    this.employeeInvitations = new Map();
    this.bankMasters = new Map();
    this.categoryMasters = new Map();
    this.companyMasters = new Map();
    this.costCenters = new Map();
    this.documentApprovals = new Map();
    this.employeeDeductions = new Map();
    
    this.currentUnitId = 1;
    this.currentUserId = 1;
    this.currentDepartmentId = 1;
    this.currentAttendanceId = 1;
    this.currentLeaveRequestId = 1;
    this.currentHolidayId = 1;
    this.currentNotificationId = 1;
    this.currentPaymentRecordId = 1;
    this.currentInvitationId = 1;
    this.currentBankMasterId = 1;
    this.currentCategoryMasterId = 1;
    this.currentCompanyMasterId = 1;
    this.currentCostCenterId = 1;
    this.currentDocumentApprovalId = 1;
    this.currentEmployeeDeductionId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Initialize with sample units
    this.createUnit({
      code: "CB",
      name: "Cybaemtech",
      description: "Main development and operations hub"
    });

    // Initialize with sample departments
    this.createDepartment({ 
      code: "HR",
      name: "Human Resources", 
      description: "Manages employee relations, hiring, and company policies",
      unitId: 1
    } as any);
    this.createDepartment({ 
      code: "ENG",
      name: "Engineering", 
      description: "Software development and technical operations",
      unitId: 1
    } as any);
    this.createDepartment({ 
      code: "MKT",
      name: "Marketing", 
      description: "Handles brand awareness and promotional activities",
      unitId: 1
    } as any);
    this.createDepartment({ 
      code: "FIN",
      name: "Finance", 
      description: "Manages financial planning and accounting",
      unitId: 1
    } as any);
    
    // Initialize with users for each role with pre-hashed passwords
    // Passwords are hashed in the same format as hashPassword in auth.ts
    
    // Admin user - Password: admin123
    this.initializeUser({
      id: 1,
      employeeId: "EMP001",
      username: "admin",
      password: "c56a7d8799d79a96bd917d2aea44a92cd3525c4313b14bf45467e40ee4a5b4b4b2d9cab3fe0aac89a56a4c00060a28226ef445e9969fce314e41a9fffd1b3ff4.6a2da20943931e46",
      email: "admin@hrconnect.com",
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      photoUrl: null,
      role: "admin",
      departmentId: 1,
      position: "HR Director",
      joinDate: new Date(),
      workLocation: null,
      reportingTo: null,
      phoneNumber: "123-456-7890",
      address: "123 Main St, Anytown, USA",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: null,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: false,
      overtimeApplicable: true,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });
    
    // HR user - Password: hr123
    this.initializeUser({
      id: 2,
      employeeId: "EMP002",
      username: "hr",
      password: "4ed0c57d4e5b87cd80d3a2060e82c30e6e8cddea45e9655bd2eb471192c1e8bb6e7a15d7f8134c04dcbe56f5ee49b249f38a63ddcd4d81a64ca0c8c06aa67154.b1d6f9fdf91e77c8",
      email: "hr@hrconnect.com",
      firstName: "HR",
      lastName: "Manager",
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      photoUrl: null,
      role: "hr",
      departmentId: 1,
      position: "HR Manager",
      joinDate: new Date(),
      workLocation: null,
      reportingTo: 1,
      phoneNumber: "123-456-7891",
      address: "124 Main St, Anytown, USA",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: null,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: false,
      overtimeApplicable: true,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });
    
    // Manager user - Password: manager123
    this.initializeUser({
      id: 3,
      employeeId: "EMP003",
      username: "manager",
      password: "f064cc778f9ee67f2a3b2d8a7a0e4a8f06e1b12e7d68b1cb0b5c87ca3ad13cefc8e22f3bb8a0d9f5ce23b1b7122dea5562d7c1b83d66a5d76deb7f092ab7df283e4.ba4b61d276ab9d68",
      email: "manager@hrconnect.com",
      firstName: "Department",
      lastName: "Manager",
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      photoUrl: null,
      role: "manager",
      departmentId: 2,
      position: "Engineering Manager",
      joinDate: new Date(),
      workLocation: null,
      reportingTo: 1,
      phoneNumber: "123-456-7892",
      address: "125 Main St, Anytown, USA",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: null,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: false,
      overtimeApplicable: true,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });
    
    // Regular employee - Password: employee123
    this.initializeUser({
      id: 4,
      employeeId: "EMP004",
      username: "employee",
      password: "2d8e6f2a8dd8c5ec52e499bbc1415cff0ea8af36aca4cac16d8bcbe5c967f0cbf5af81f0c1b5ce23b1b7122dea5562d7c1b83d66a5d76deb7f092ab7df283e4.ba4b61d276ab9d68",
      email: "employee@hrconnect.com",
      firstName: "Regular",
      lastName: "Employee",
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      photoUrl: null,
      role: "employee",
      departmentId: 2,
      position: "Software Developer",
      joinDate: new Date(),
      workLocation: null,
      reportingTo: 3,
      phoneNumber: "123-456-7893",
      address: "126 Main St, Anytown, USA",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: null,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: false,
      overtimeApplicable: true,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });
    
    // Developer user - Password: dev11
    this.initializeUser({
      id: 5,
      employeeId: "EMP005",
      username: "developer",
      password: "5c1bb8f1cca8b54c086f720b1c3616b9be56d696b2563f521343f7d28694707d74ce7efbe358ef720c011fb3ec7fe08908d77dff72091292c37f2710101b48e4.401adc71233892502550112bc7b4f180",
      email: "developer@hrconnect.com",
      firstName: "System",
      lastName: "Developer",
      dateOfBirth: null,
      gender: null,
      maritalStatus: null,
      photoUrl: null,
      role: "developer",
      departmentId: 2,
      position: "System Developer",
      joinDate: new Date(),
      workLocation: null,
      reportingTo: 3,
      phoneNumber: "123-456-7894",
      address: "127 Main St, Anytown, USA",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: null,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: false,
      overtimeApplicable: true,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });

    // Super Admin - Navnath - Password: hr123
    this.initializeUser({
      id: 7,
      employeeId: "SA001",
      username: "navnath",
      password: "4ed0c57d4e5b87cd80d3a2060e82c30e6e8cddea45e9655bd2eb471192c1e8bb6e7a15d7f8134c04dcbe56f5ee49b249f38a63ddcd4d81a64ca0c8c06aa67154.b1d6f9fdf91e77c8",
      email: "navnath@cybaemtech.com",
      firstName: "Navnath",
      lastName: "Admin",
      dateOfBirth: null,
      gender: "male",
      maritalStatus: "married",
      photoUrl: null,
      role: "admin",
      departmentId: 1,
      position: "Super Admin",
      joinDate: new Date(),
      workLocation: "Corporate Office",
      reportingTo: null,
      phoneNumber: "999-999-9999",
      address: "Corporate HQ",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: 150000,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: true,
      overtimeApplicable: false,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });

    // HR user - Santosh Kelkar - Password: hr123 (hashed)
    this.initializeUser({
      id: 6,
      employeeId: "EMP006",
      username: "santosh",
      password: "4ed0c57d4e5b87cd80d3a2060e82c30e6e8cddea45e9655bd2eb471192c1e8bb6e7a15d7f8134c04dcbe56f5ee49b249f38a63ddcd4d81a64ca0c8c06aa67154.b1d6f9fdf91e77c8",
      email: "santosh@cybaemtech.com",
      firstName: "Santosh",
      lastName: "Kelkar",
      dateOfBirth: null,
      gender: "male",
      maritalStatus: "married",
      photoUrl: null,
      role: "hr",
      departmentId: 1,
      position: "HR Manager",
      joinDate: new Date(),
      workLocation: "Main Office",
      reportingTo: 1,
      phoneNumber: "987-654-3210",
      address: "Pune, Maharashtra",
      bankAccountNumber: null,
      bankName: null,
      bankIFSCCode: null,
      bankAccountType: null,
      aadhaarCard: null,
      panCard: null,
      salary: 75000,
      uanNumber: null,
      esicNumber: null,
      employmentType: 'permanent',
      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      mlwfApplicable: true,
      incomeTaxApplicable: true,
      overtimeApplicable: false,
      bonusApplicable: true,
      isActive: true,
      status: "active",
      customPermissions: [],
      documents: []
    });
  }
  
  // For initializing users with pre-hashed passwords
  private initializeUser(user: User) {
    this.users.set(user.id, user);
    if (user.id >= this.currentUserId) {
      this.currentUserId = user.id + 1;
    }
    return user;
  }

  async getSystemSettings(): Promise<any> {
    return {
      salaryComponents: {
        basicSalaryPercentage: 50,
        hraPercentage: 20,
        epfPercentage: 12,
        esicPercentage: 0.75,
        professionalTax: 200
      }
    };
  }

  async getUnits(): Promise<Unit[]> {
    return Array.from(this.units.values());
  }

  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const id = this.currentUnitId++;
    const unit: Unit = { 
      ...insertUnit, 
      id,
      description: insertUnit.description ?? null
    };
    this.units.set(id, unit);
    return unit;
  }

  async getBankMasters(): Promise<BankMaster[]> {
    return Array.from(this.bankMasters.values());
  }

  async createBankMaster(insertBank: InsertBankMaster): Promise<BankMaster> {
    const id = this.currentBankMasterId++;
    const bank: BankMaster = { 
      ...insertBank, 
      id,
      branchCode: insertBank.branchCode ?? null,
      address: insertBank.address ?? null,
      accountNo: insertBank.accountNo ?? null,
      ifscCode: insertBank.ifscCode ?? null,
      micrCode: insertBank.micrCode ?? null,
    };
    this.bankMasters.set(id, bank);
    return bank;
  }

  async getCategoryMasters(): Promise<CategoryMaster[]> {
    return Array.from(this.categoryMasters.values());
  }

  async createCategoryMaster(insertCategory: InsertCategoryMaster): Promise<CategoryMaster> {
    const id = this.currentCategoryMasterId++;
    const category: CategoryMaster = { ...insertCategory, id };
    this.categoryMasters.set(id, category);
    return category;
  }

  async getCompanyMasters(): Promise<CompanyMaster[]> {
    return Array.from(this.companyMasters.values());
  }

  async createCompanyMaster(insertCompany: InsertCompanyMaster): Promise<CompanyMaster> {
    const id = this.currentCompanyMasterId++;
    const company: CompanyMaster = { 
      ...insertCompany, 
      id,
      address: insertCompany.address ?? null,
      state: insertCompany.state ?? null,
      pinCode: insertCompany.pinCode ?? null,
      regdNo: insertCompany.regdNo ?? null,
      pfcCode: insertCompany.pfcCode ?? null,
      esicCode: insertCompany.esicCode ?? null,
      panNo: insertCompany.panNo ?? null,
      tanNo: insertCompany.tanNo ?? null,
      gstNo: insertCompany.gstNo ?? null,
      email: insertCompany.email ?? null,
      natureOfBusiness: insertCompany.natureOfBusiness ?? null,
      esiEmployeeContribution: insertCompany.esiEmployeeContribution ?? null,
      esiEmployerContribution: insertCompany.esiEmployerContribution ?? null,
      pfEmployerContribution: insertCompany.pfEmployerContribution ?? null,
    };
    this.companyMasters.set(id, company);
    return company;
  }

  async getCostCenters(): Promise<CostCenter[]> {
    return Array.from(this.costCenters.values());
  }

  async createCostCenter(insertCostCenter: InsertCostCenter): Promise<CostCenter> {
    const id = this.currentCostCenterId++;
    const costCenter: CostCenter = { ...insertCostCenter, id };
    this.costCenters.set(id, costCenter);
    return costCenter;
  }

  async getDocumentApprovals(): Promise<DocumentApproval[]> {
    return Array.from(this.documentApprovals.values());
  }

  async createDocumentApproval(insertApproval: InsertDocumentApproval): Promise<DocumentApproval> {
    const id = this.currentDocumentApprovalId++;
    const approval: DocumentApproval = { 
      ...insertApproval, 
      id,
      status: insertApproval.status ?? 'pending',
      remarks: insertApproval.remarks ?? null
    };
    this.documentApprovals.set(id, approval);
    return approval;
  }

  async getEmployeeDeductions(): Promise<EmployeeDeduction[]> {
    return Array.from(this.employeeDeductions.values());
  }

  async createEmployeeDeduction(insertDeduction: InsertEmployeeDeduction): Promise<EmployeeDeduction> {
    const id = this.currentEmployeeDeductionId++;
    const deduction: EmployeeDeduction = { ...insertDeduction, id };
    this.employeeDeductions.set(id, deduction);
    return deduction;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      joinDate: insertUser.joinDate || new Date(),
      isActive: true,
      role: insertUser.role || 'employee',
      departmentId: insertUser.departmentId ?? null,
      position: insertUser.position ?? null,
      phoneNumber: insertUser.phoneNumber ?? null,
      address: insertUser.address ?? null,
      customPermissions: insertUser.customPermissions ?? [],
      employeeId: insertUser.employeeId ?? null,
      workLocation: insertUser.workLocation ?? null,
      reportingTo: insertUser.reportingTo ?? null,
      dateOfBirth: insertUser.dateOfBirth ?? null,
      gender: insertUser.gender ?? null,
      maritalStatus: insertUser.maritalStatus ?? null,
      photoUrl: insertUser.photoUrl ?? null,
      bankAccountNumber: insertUser.bankAccountNumber ?? null,
      bankName: insertUser.bankName ?? null,
      bankIFSCCode: insertUser.bankIFSCCode ?? null,
      bankAccountType: (insertUser.bankAccountType as "savings" | "current" | "salary" | null) ?? null,
      salary: insertUser.salary ?? null,
      uanNumber: insertUser.uanNumber ?? null,
      esicNumber: insertUser.esicNumber ?? null,
      employmentType: insertUser.employmentType ?? 'permanent',
      pfApplicable: insertUser.pfApplicable ?? true,
      esicApplicable: insertUser.esicApplicable ?? true,
      ptApplicable: insertUser.ptApplicable ?? true,
      incomeTaxApplicable: (insertUser as any).incomeTaxApplicable ?? false,
      mlwfApplicable: (insertUser as any).mlwfApplicable ?? false,
      overtimeApplicable: (insertUser as any).overtimeApplicable ?? false,
      bonusApplicable: (insertUser as any).bonusApplicable ?? false,
      status: insertUser.status || 'active',
      documents: insertUser.documents ?? []
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      ...userData,
      documents: userData.documents ?? user.documents ?? [],
      bankIFSCCode: userData.bankIFSCCode ?? user.bankIFSCCode ?? null,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getUsersByDepartment(departmentId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(
      (user) => user.departmentId === departmentId,
    );
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = { 
      ...insertDepartment, 
      id,
      description: insertDepartment.description ?? null,
      manager: insertDepartment.manager ?? null,
      location: insertDepartment.location ?? null,
      unitId: insertDepartment.unitId ?? null
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, departmentData: Partial<Department>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;
    
    const updatedDepartment = { 
      ...department, 
      ...departmentData,
      manager: departmentData.manager ?? department.manager ?? null,
      location: departmentData.location ?? department.location ?? null,
    };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }

  // Attendance methods
  async getAttendance(id: number): Promise<Attendance | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getAttendanceByUser(userId: number): Promise<Attendance[]> {
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => record.userId === userId,
    );
  }

  async getAttendanceByDate(date: Date): Promise<Attendance[]> {
    const dateString = date.toDateString();
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => new Date(record.date!).toDateString() === dateString,
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentAttendanceId++;
    const attendance: Attendance = { 
      ...insertAttendance, 
      id,
      date: insertAttendance.date ?? null,
      status: insertAttendance.status ?? 'present',
      checkInTime: insertAttendance.checkInTime ?? null,
      checkOutTime: insertAttendance.checkOutTime ?? null,
      notes: insertAttendance.notes ?? null
    };
    this.attendanceRecords.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: number, attendanceData: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendanceRecords.get(id);
    if (!attendance) return undefined;
    
    const updatedAttendance = { ...attendance, ...attendanceData };
    this.attendanceRecords.set(id, updatedAttendance);
    return updatedAttendance;
  }

  // Leave methods
  async getLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getLeaveRequestsByUser(userId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(
      (request) => request.userId === userId,
    );
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values());
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(
      (request) => request.status === 'pending',
    );
  }

  async createLeaveRequest(insertLeaveRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = this.currentLeaveRequestId++;
    const leaveRequest: LeaveRequest = { 
      ...insertLeaveRequest, 
      id,
      status: insertLeaveRequest.status ?? 'pending',
      reason: insertLeaveRequest.reason ?? null,
      approvedById: insertLeaveRequest.approvedById ?? null,
      createdAt: new Date()
    };
    this.leaveRequests.set(id, leaveRequest);
    return leaveRequest;
  }

  async updateLeaveRequest(id: number, leaveRequestData: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const leaveRequest = this.leaveRequests.get(id);
    if (!leaveRequest) return undefined;
    
    const updatedLeaveRequest = { ...leaveRequest, ...leaveRequestData };
    this.leaveRequests.set(id, updatedLeaveRequest);
    return updatedLeaveRequest;
  }

  async deleteLeaveRequest(id: number): Promise<boolean> {
    return this.leaveRequests.delete(id);
  }

  // Holiday methods
  async getHoliday(id: number): Promise<Holiday | undefined> {
    return this.holidayRecords.get(id);
  }

  async getHolidays(): Promise<Holiday[]> {
    return Array.from(this.holidayRecords.values());
  }

  async createHoliday(insertHoliday: InsertHoliday): Promise<Holiday> {
    const id = this.currentHolidayId++;
    const holiday: Holiday = { 
      ...insertHoliday, 
      id,
      description: insertHoliday.description ?? null
    };
    this.holidayRecords.set(id, holiday);
    return holiday;
  }

  async updateHoliday(id: number, holidayData: Partial<Holiday>): Promise<Holiday | undefined> {
    const holiday = this.holidayRecords.get(id);
    if (!holiday) return undefined;
    
    const updatedHoliday = { ...holiday, ...holidayData };
    this.holidayRecords.set(id, updatedHoliday);
    return updatedHoliday;
  }

  async deleteHoliday(id: number): Promise<boolean> {
    return this.holidayRecords.delete(id);
  }

  // Notification methods
  async getNotification(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getUnreadNotificationsByUser(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && !notification.isRead)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      isRead: insertNotification.isRead ?? false,
      createdAt: new Date(),
      relatedUserId: insertNotification.relatedUserId ?? null,
      relatedLeaveId: insertNotification.relatedLeaveId ?? null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return true;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const userNotifications = Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userId === userId && !notification.isRead);
    
    userNotifications.forEach(([id, notification]) => {
      const updatedNotification = { ...notification, isRead: true };
      this.notifications.set(id, updatedNotification);
    });
    
    return true;
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Payment Record methods  
  async getPaymentRecord(id: number): Promise<PaymentRecord | undefined> {
    return this.paymentRecords.get(id);
  }

  async getPaymentRecords(): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values());
  }

  async getPaymentRecordsByEmployee(employeeId: number): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values()).filter(pr => pr.employeeId === employeeId);
  }

  async getPaymentRecordsByMonth(month: string): Promise<PaymentRecord[]> {
    return Array.from(this.paymentRecords.values()).filter(pr => pr.month === month);
  }

  async createPaymentRecord(paymentRecord: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = this.currentPaymentRecordId++;
    const newPaymentRecord: PaymentRecord = {
      ...paymentRecord,
      id,
      createdAt: new Date(),
      paymentStatus: paymentRecord.paymentStatus || 'pending',
      paymentDate: paymentRecord.paymentDate ?? null,
      paymentMode: paymentRecord.paymentMode ?? null,
      referenceNo: paymentRecord.referenceNo ?? null,
    };
    
    this.paymentRecords.set(id, newPaymentRecord);
    return newPaymentRecord;
  }

  async updatePaymentRecord(id: number, paymentRecord: Partial<PaymentRecord>): Promise<PaymentRecord | undefined> {
    const existing = this.paymentRecords.get(id);
    if (!existing) return undefined;
    
    const updatedRecord = { ...existing, ...paymentRecord };
    this.paymentRecords.set(id, updatedRecord);
    return updatedRecord;
  }

  async deletePaymentRecord(id: number): Promise<boolean> {
    return this.paymentRecords.delete(id);
  }

  // Employee invitation methods
  async getEmployeeInvitation(id: number): Promise<EmployeeInvitation | undefined> {
    return this.employeeInvitations.get(id);
  }

  async getEmployeeInvitationByToken(token: string): Promise<EmployeeInvitation | undefined> {
    return Array.from(this.employeeInvitations.values()).find(invitation => invitation.token === token);
  }

  async getEmployeeInvitations(): Promise<EmployeeInvitation[]> {
    return Array.from(this.employeeInvitations.values());
  }

  async createEmployeeInvitation(insertInvitation: InsertEmployeeInvitation): Promise<EmployeeInvitation> {
    const id = this.currentInvitationId++;
    const invitation: EmployeeInvitation = { 
      ...insertInvitation, 
      id,
      usedAt: null,
      createdAt: new Date()
    };
    this.employeeInvitations.set(id, invitation);
    return invitation;
  }

  async updateEmployeeInvitation(id: number, invitationData: Partial<EmployeeInvitation>): Promise<EmployeeInvitation | undefined> {
    const invitation = this.employeeInvitations.get(id);
    if (!invitation) return undefined;
    
    const updatedInvitation = { ...invitation, ...invitationData };
    this.employeeInvitations.set(id, updatedInvitation);
    return updatedInvitation;
  }

  async deleteEmployeeInvitation(id: number): Promise<boolean> {
    return this.employeeInvitations.delete(id);
  }

  // Leave Balance Calculation Method
  async calculateLeaveBalance(userId: number, asOfDate?: Date): Promise<LeaveBalance> {
    // Get the user to access joinDate
    const user = await this.getUser(userId);
    if (!user || !user.joinDate) {
      throw new Error(`User not found or missing join date for userId: ${userId}`);
    }

    // Use current date if no asOfDate provided
    const calculationDate = asOfDate || new Date();
    const joinDate = new Date(user.joinDate);
    
    // Handle edge case: calculation date before join date
    if (calculationDate < joinDate) {
      throw new Error('Calculation date cannot be before join date');
    }

    // Calculate months worked from joinDate to asOfDate
    const monthsWorked = differenceInMonths(calculationDate, joinDate);
    
    // Calculate total accrued days (1.5 days per month)
    const totalAccrued = monthsWorked * 1.5;
    
    // Get all leave requests for this user
    const userLeaveRequests = await this.getLeaveRequestsByUser(userId);
    
    // Filter for paid leave types that reduce balance
    const paidLeaveTypes = ['annual', 'sick', 'personal'];
    const relevantLeaveRequests = userLeaveRequests.filter(request => 
      paidLeaveTypes.includes(request.type)
    );
    
    // Calculate total taken (approved requests only)
    let totalTaken = 0;
    const approvedRequests = relevantLeaveRequests.filter(request => request.status === 'approved');
    
    for (const request of approvedRequests) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // Calculate duration in days
      const duration = differenceInMonths(endDate, startDate) === 0 ? 1 : 
                      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Apply leave type multiplier
      if (request.type === 'halfday') {
        totalTaken += 0.5;
      } else {
        totalTaken += duration;
      }
    }
    
    // Calculate pending requests (pending status only)
    let pendingRequests = 0;
    const pendingRequestsList = relevantLeaveRequests.filter(request => request.status === 'pending');
    
    for (const request of pendingRequestsList) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // Calculate duration in days
      const duration = differenceInMonths(endDate, startDate) === 0 ? 1 : 
                      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Apply leave type multiplier
      if (request.type === 'halfday') {
        pendingRequests += 0.5;
      } else {
        pendingRequests += duration;
      }
    }
    
    // Calculate remaining balance
    const remainingBalance = totalAccrued - totalTaken;
    
    // Calculate next accrual date (first day of next month)
    const nextAccrualDate = addMonths(calculationDate, 1);
    nextAccrualDate.setDate(1); // Set to first day of month
    
    // Calculate this year's accrual and taken amounts
    const yearStart = startOfYear(calculationDate);
    const yearEnd = endOfYear(calculationDate);
    
    // Calculate months worked this year
    const yearStartForCalculation = joinDate > yearStart ? joinDate : yearStart;
    const monthsWorkedThisYear = differenceInMonths(calculationDate, yearStartForCalculation);
    const accruedThisYear = monthsWorkedThisYear * 1.5;
    
    // Calculate taken this year (approved requests within this year)
    let takenThisYear = 0;
    const thisYearApprovedRequests = approvedRequests.filter(request => {
      const requestDate = new Date(request.startDate);
      return requestDate >= yearStart && requestDate <= yearEnd;
    });
    
    for (const request of thisYearApprovedRequests) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // Calculate duration in days
      const duration = differenceInMonths(endDate, startDate) === 0 ? 1 : 
                      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      // Apply leave type multiplier
      if (request.type === 'halfday') {
        takenThisYear += 0.5;
      } else {
        takenThisYear += duration;
      }
    }
    
    return {
      asOfDate: calculationDate,
      totalAccrued,
      totalTaken,
      pendingRequests,
      remainingBalance,
      nextAccrualDate,
      accruedThisYear,
      takenThisYear
    };
  }
}

import { FileStorage } from "./file-storage";

export const storage = new FileStorage();

// Initialize the file storage
storage.initialize().catch(console.error);