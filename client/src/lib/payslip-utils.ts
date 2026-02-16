import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import { format } from "date-fns";

export const COMPANY_NAME = "Cybaem Tech";
export const COMPANY_ADDRESS = "Plot no. 10B, Staff colony, Sector No. 27 Pradhikaran, Nigdi Pune Maharashtra 411035 India";
export const LOGO_URL = "/images/img.png";

const numberToWords = (num: number): string => {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num.toString().length > 9) return 'Overflow';
  
  const n = ('000000000' + num).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  
  let str = '';
  str += (parseInt(n[1]) !== 0) ? (a[parseInt(n[1])] || b[parseInt(n[1][0])] + ' ' + a[parseInt(n[1][1])]) + 'Crore ' : '';
  str += (parseInt(n[2]) !== 0) ? (a[parseInt(n[2])] || b[parseInt(n[2][0])] + ' ' + a[parseInt(n[2][1])]) + 'Lakh ' : '';
  str += (parseInt(n[3]) !== 0) ? (a[parseInt(n[3])] || b[parseInt(n[3][0])] + ' ' + a[parseInt(n[3][1])]) + 'Thousand ' : '';
  str += (parseInt(n[4]) !== 0) ? (a[parseInt(n[4])] || b[parseInt(n[4][0])] + ' ' + a[parseInt(n[4][1])]) + 'Hundred ' : '';
  str += (parseInt(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[parseInt(n[5])] || b[parseInt(n[5][0])] + ' ' + a[parseInt(n[5][1])]) : '';
  return str.trim();
};

export interface PayslipData {
  employeeName: string;
  employeeId: string;
  designation: string;
  department: string;
  dateOfJoining: string | Date;
  bankAccountNo: string;
  paidDays: string | number;
  lopDays: string | number;
  pfAccountNumber: string;
  uan: string;
  esiNumber: string;
  pan: string;
  workLocation: string;
  month: string;
  breakdown: {
    gross: number;
    basic: number;
    hra: number;
    specialAllowance: number;
    da: number;
    conveyance: number;
    medical: number;
    epf: number;
    esic: number;
    pt: number;
    deductions: number;
    net: number;
  };
}

export const generateProfessionalPayslip = (data: PayslipData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const b = data.breakdown;
  const selectedMonth = data.month;

  const renderPdf = () => {
    // Header Section
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(COMPANY_NAME, 20, 20);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    const splitAddress = doc.splitTextToSize(COMPANY_ADDRESS, 100);
    doc.text(splitAddress, 20, 30);

    // Add Logo
    try {
      doc.addImage(img, 'PNG', pageWidth - 50, 10, 30, 15);
    } catch (e) {
      console.error("Logo could not be added", e);
    }

    // Title
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(`Payslip for the month of ${selectedMonth}`, pageWidth / 2, 55, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 58, pageWidth - 20, 58);

    // Pay Summary
    doc.setFontSize(10);
    doc.text("PAY SUMMARY", 20, 68);
    
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    
    const joinDateStr = data.dateOfJoining instanceof Date ? format(data.dateOfJoining, 'dd MMM yyyy') : data.dateOfJoining;

    const leftLabels = ["Employee Name", "Designation", "Date of Joining", "Paid Days", "PF A/C Number", "ESI Number", "Work Location"];
    const leftValues = [data.employeeName, data.designation, joinDateStr, data.paidDays.toString(), data.pfAccountNumber, data.esiNumber, data.workLocation];
    
    const rightLabels = ["Employee ID", "Department", "Bank Account No", "LOP Days", "UAN", "PAN"];
    const rightValues = [data.employeeId, data.department, data.bankAccountNo, data.lopDays.toString(), data.uan, data.pan];

    let y = 78;
    leftLabels.forEach((label, i) => {
      doc.setTextColor(100, 116, 139);
      doc.text(label, 20, y);
      doc.setTextColor(30, 41, 59);
      doc.text(": " + leftValues[i], 55, y);
      y += 6;
    });

    y = 78;
    rightLabels.forEach((label, i) => {
      doc.setTextColor(100, 116, 139);
      doc.text(label, 110, y);
      doc.setTextColor(30, 41, 59);
      doc.text(": " + rightValues[i], 145, y);
      y += 6;
    });

    // Standard Payroll Calculation Logic (Aligned with Statutory Requirements)
    const monthlyGross = b.gross || 0;
    const basicLimit = 15000;
    const basic = b.basic || 0;
    
    // Employee Side (for Deductions)
    const epfEmployee = Math.min(basic, basicLimit) * 0.12;
    const esicEmployee = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0075) : 0;
    const professionalTax = 200;
    // MLWF - Half yearly (June & December only) - Employee: 25, Employer: 75
    const mlwfMonthNum = new Date().getMonth() + 1;
    const isMlwfMonth = mlwfMonthNum === 6 || mlwfMonthNum === 12;
    const mlwfEmployee = isMlwfMonth ? 25 : 0;
    
    // Employer Side (for CTC information if needed in future, but payslip focuses on Net Pay)
    const epfEmployer = Math.min(basic, basicLimit) * 0.13;
    const esicEmployer = monthlyGross <= 21000 ? Math.round(monthlyGross * 0.0325) : 0;
    const mlwfEmployer = isMlwfMonth ? 75 : 0;

    // Overtime Calculation Formula: (Basic+DA)/26/8 * 2
    // For now we use the provided overtime from breakdown, but keeping formula in mind for future dynamic OT entries

    // Table Data mapping to provided structure
    const tableData = [
      ["Basic Salary", `Rs. ${Math.round(b.basic || 0).toLocaleString()}`, "0.00", "Employee PF", `Rs. ${Math.round(epfEmployee).toLocaleString()}`, "0.00"],
      ["Dearness Allowance (DA)", `Rs. ${Math.round(b.da || 0).toLocaleString()}`, "0.00", "Professional Tax (PT)", `Rs. ${Math.round(professionalTax).toLocaleString()}`, "0.00"],
      ["House Rent Allowance (HRA)", `Rs. ${Math.round(b.hra || 0).toLocaleString()}`, "0.00", "ESIC", `Rs. ${Math.round(esicEmployee).toLocaleString()}`, "0.00"],
      ["Conveyance Allowance", `Rs. ${Math.round(b.conveyance || 0).toLocaleString()}`, "0.00", "Income Tax (TDS)", "0.00", "0.00"],
      ["Medical Allowance", `Rs. ${Math.round(b.medical || 0).toLocaleString()}`, "0.00", "MLWF (Half-yearly Jun/Dec)", `Rs. ${mlwfEmployee}`, "0.00"],
      ["Special Allowance", `Rs. ${Math.round(b.specialAllowance || 0).toLocaleString()}`, "0.00", "Loan / Advance Recovery", "0.00", "0.00"],
      ["Bonus / Incentives", "0.00", "0.00", "Other Deductions", "0.00", "0.00"],
      ["Overtime (OT) / Arrears", "0.00", "0.00", "", "", ""],
      ["Gross Earnings", `Rs. ${Math.round(monthlyGross).toLocaleString()}`, "0.00", "Total Deductions", `Rs. ${Math.round(epfEmployee + esicEmployee + professionalTax + mlwfEmployee).toLocaleString()}`, "0.00"],
    ];

    autoTable(doc, {
      startY: 125,
      head: [["EARNINGS", "AMOUNT (Rs.)", "YTD", "DEDUCTIONS", "AMOUNT (Rs.)", "YTD"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [200, 200, 200], halign: 'center' },
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' } },
      didParseCell: function(data) { if (data.row.index === 8) data.cell.styles.fontStyle = 'bold'; }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(248, 250, 252);
    doc.rect(20, finalY, pageWidth - 40, 15, 'F');
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    const netAmount = Math.round(b.net || 0);
    const amountInWords = numberToWords(netAmount);
    const netPayText = `Total Net Payable ₹${netAmount.toLocaleString()}.00 (Indian Rupee ${amountInWords} Only)`;
    
    doc.text(netPayText, pageWidth / 2, finalY + 10, { align: "center" });

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("**Total Net Payable = Gross Earnings - Total Deductions", pageWidth / 2, finalY + 25, { align: "center" });

    doc.save(`Payslip_${data.employeeId}_${selectedMonth.replace(' ', '_')}.pdf`);
  };

  const img = new Image();
  img.src = LOGO_URL;
  if (img.complete) renderPdf();
  else {
    img.onload = renderPdf;
    img.onerror = renderPdf;
  }
};
