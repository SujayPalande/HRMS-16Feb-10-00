import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  addCompanyHeader, 
  addWatermark, 
  addHRSignature, 
  addFooter, 
  addDocumentDate, 
  generateReferenceNumber, 
  addReferenceNumber,
  COMPANY_NAME,
  COMPANY_ADDRESS,
  HR_NAME,
  HR_DESIGNATION
} from "@/lib/pdf-utils";

export const exportToExcel = (data: any[], fileName: string) => {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const exportToCSV = (data: any[], fileName: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
  ];
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToTxt = (data: any[], fileName: string, title: string) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  let content = `${title}\n`;
  content += `Generated on: ${new Date().toLocaleString()}\n`;
  content += "=".repeat(title.length) + "\n\n";
  
  data.forEach((row, index) => {
    content += `Record ${index + 1}:\n`;
    headers.forEach(header => {
      content += `${header}: ${row[header]}\n`;
    });
    content += "-".repeat(20) + "\n";
  });
  
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${fileName}.txt`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
