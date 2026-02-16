# HR Connect - Comprehensive HR Management System

## Project Overview
HR Connect is a comprehensive HR management system built with React, TypeScript, Express.js, and Drizzle ORM. It provides complete employee lifecycle management, attendance tracking, leave management, and payroll features.

## Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM (currently using in-memory storage)
- **Authentication**: Session-based authentication with role-based access control

## Key Features
- **Employee Management**: Complete employee records with role-based access control
- **Attendance Tracking**: Web-based check-in/check-out system with status tracking
- **Leave Management**: Streamlined workflow for leave requests and approvals
- **Payroll System**: Payment record management with multiple payment modes
- **Notification System**: Real-time notifications for important events
- **Multi-role Support**: Admin, HR, Manager, Employee, and Developer roles

## Recent Changes
- **2026-01-28**: Enhanced CTC Calculator with statutory compliance tabs
  - Added tabbed interface for ESIC, PF, PT, MLWF in CTC Calculator with manual override capability
  - Renamed LWF to MLWF (Maharashtra Labour Welfare Fund) throughout the system
  - MLWF deductions: Half-yearly (June & December only), Employee ₹25, Employer ₹75
  - All statutory reports now display MLWF correctly with half-yearly breakdown
  - Master Data page updated with MLWF SubCode configuration

- **2026-01-28**: Payroll data sync across all statutory reports and separate report pages
  - Removed internal side navigation from Muster Roll page - now separate pages for Form II and Form 20
  - Muster Roll - Form II: Accessible at /reports/muster-roll with PDF and Excel export
  - Leave Register - Form 20: Accessible at /reports/leave-register with PDF and Excel export
  - Full payroll data synchronization across all reports:
    - Muster Roll now uses payroll records for wages calculation (basic, HRA, PF, ESI deductions)
    - Leave Register syncs with payroll data for daily rate calculations
    - Statutory Compliance (PF/ESI/Bonus) now fetches payroll and attendance data
  - PF Data: Uses actual payroll contributions when available, calculates from salary otherwise
  - ESI Data: Uses payroll gross wages and actual attendance days worked
  - Bonus Data: Uses monthly payroll basic salary for 8.33% calculation (capped at ₹7,000)
  - PDF export functionality on both Muster Roll and Leave Register pages
  - All statutory exports verified against government format requirements

- **2026-01-27**: Added Statutory Compliance reporting module
  - New PF/ESI/Bonus Reports page at /compliance/statutory with tabbed interface
  - PF Data: Export to Excel (.xlsx) and ECR text format (.txt) for EPFO portal upload
  - ESI Data: Excel import/export with automatic eligibility calculation (gross ≤ ₹21,000)
  - Bonus Data: Month-wise breakdown export with 8.33% calculation (capped at ₹7,000 basic)
  - All calculations sync with payroll system's salary components configuration
  - Added navigation link under Statutory Compliance section in sidebar

- **2025-12-01**: Configured for cPanel subdirectory hosting at /hrms
  - Added wouter Router wrapper with dynamic base path support from Vite's BASE_URL
  - API calls automatically use BASE_URL or custom VITE_API_BASE environment variable
  - Fixed sidebar scroll position preservation when navigating between pages
  - Added expand button visibility when sidebar is collapsed

- **2025-11-26**: Implemented comprehensive HRMS module pages
  - Created 26+ dedicated page components across all modules
  - Fixed profile-page.tsx to use correct user schema fields (departmentId, position, joinDate, managerId, personalPhone)
  - Created dedicated report pages (attendance, leave, payroll) instead of using generic ReportsPage
  - All routes properly registered in App.tsx with no LSP errors
  - Collapsible sidebar with data-driven NAV_SECTIONS structure
  
- **2025-09-29**: Successfully imported and configured for Replit environment
  - Fixed TypeScript compilation errors in schema and storage files
  - Added missing tsx dependency
  - Configured workflow for port 5000 with webview output
  - Set up deployment configuration for production
  - Ensured proper host configuration for Replit proxy compatibility

## User Accounts (for testing)
- **Admin**: username: `admin`, password: `admin123`
- **HR**: username: `hr`, password: `hr123`
- **Manager**: username: `manager`, password: `manager123`
- **Employee**: username: `employee`, password: `employee123`
- **Developer**: username: `developer`, password: `dev11`

## Project Structure
- `client/`: React frontend application
- `server/`: Express backend API
- `shared/`: Shared TypeScript schemas and types
- `data/`: JSON data files for initial setup

## Development
- **Start Application**: `npm run dev` (already configured as workflow)
- **Build**: `npm run build`
- **Production**: `npm run start`

## Configuration
- **Port**: 5000 (configured for Replit environment)
- **Database**: Currently using in-memory storage (MemStorage)
- **Email**: SendGrid integration available (requires API key configuration)

## User Preferences
- Using modern full-stack JavaScript architecture
- Emphasis on type safety with TypeScript
- Clean UI with shadcn/ui components
- Role-based access control for security

## Deployment

### Replit Deployment
- **Target**: Autoscale deployment configured
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

### cPanel Subdirectory Deployment (/hrms)
The app is fully configured to work at `cybaemtech.net/hrms`.

**Deployment Steps:**

1. **Build the app locally**: `npm run build`
   - Creates `dist/` folder with:
     - `dist/index.html` - React app entry point
     - `dist/assets/` - CSS and JavaScript bundles
     - `dist/images/` - Static images
     - `dist/index.js` - Node.js backend server

2. **Choose your hosting method:**

   **Option A: Backend & Frontend on Same cPanel Server**
   - Upload entire `dist/` folder to `/home/yourdomain/public_html/hrms/`
   - Create Node.js application in cPanel Passenger pointing to `/hrms/index.js`
   - Set environment variable: `APP_BASE_PATH=/hrms`
   - Access at: `cybaemtech.net/hrms`

   **Option B: Frontend on cPanel, Backend on Separate VPS**
   - Before building, set environment variable: `VITE_API_BASE=https://your-api-domain.com`
   - Run `npm run build` (rebuilds with API pointing to your VPS)
   - Upload only `dist/index.html`, `dist/assets/`, and `dist/images/` to `public_html/hrms/`
   - Run backend Node.js server on your VPS
   - Access frontend at: `cybaemtech.net/hrms`
   - Backend API handles requests at: `https://your-api-domain.com/api/*`

**Important Notes**:
- The app uses in-memory storage by default (data resets on server restart). For production, switch to PostgreSQL.
- All frontend routes are automatically relative to `/hrms` base path
- API requests automatically route through the configured VITE_API_BASE
- Test users: admin/admin123, hr/hr123, manager/manager123, employee/employee123