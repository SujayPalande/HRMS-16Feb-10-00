import jsPDF from "jspdf";
import "jspdf-autotable";
import { ASN_LOGO_BASE64 } from "./logo-data";

// Type definition for autoTable extension to jsPDF
export interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
  lastAutoTable: {
    finalY: number;
  };
}

export const COMPANY_NAME = "ASN HR Consultancy & Services";
export const COMPANY_TAGLINE = "Your Trusted HR Partner";
export const COMPANY_ADDRESS = "401, 4th Floor, Empire Arcade, Beside AV Manis, Sakore Nagar, Viman Nagar, Pune-411014";
export const COMPANY_WEBSITE = "www.asnhrconsultancy.com";
export const HR_NAME = "Nikita Nagargoje";
export const HR_DESIGNATION = "HR Manager";

export interface PDFConfig {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  showWatermark?: boolean;
  showSignature?: boolean;
  showHeader?: boolean;
  showFooter?: boolean;
}

const LOGIN_LOGO_URL = "/images/img.png";

export async function addCompanyHeader(doc: jsPDF, config: PDFConfig = { title: "" }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Clean header background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, 40, "F");
  
  try {
    // ASN Logo on the left
    doc.addImage(ASN_LOGO_BASE64, "PNG", 15, 8, 45, 25);
  } catch (e) {
    doc.setFontSize(22);
    doc.setTextColor(0, 51, 102);
    doc.setFont("helvetica", "bold");
    doc.text("ASN", 15, 25);
  }
  
  // Company Info on the right
  doc.setFontSize(14);
  doc.setTextColor(0, 51, 102);
  doc.setFont("helvetica", "bold");
  doc.text(COMPANY_NAME, pageWidth - 15, 18, { align: "right" });
  
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_TAGLINE, pageWidth - 15, 24, { align: "right" });
  doc.text(COMPANY_ADDRESS, pageWidth - 15, 30, { align: "right" });
  
  // Thin separator line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(15, 40, pageWidth - 15, 40);

  doc.setTextColor(0, 0, 0);
  
  if (config.title) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(config.title, pageWidth / 2, 50, { align: "center" });
    
    if (config.subtitle) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(config.subtitle, pageWidth / 2, 56, { align: "center" });
    }
  }
}

export function addWatermark(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.saveGraphicsState();
  
  try {
    const logoWidth = 80;
    const logoHeight = 50;
    const centerX = (pageWidth - logoWidth) / 2;
    const centerY = (pageHeight - logoHeight) / 2;
    
    // Use raw style for GState since the type might not be exposed correctly
    (doc as any).setGState(new (doc as any).GState({ opacity: 0.08 }));
    doc.addImage(ASN_LOGO_BASE64, "PNG", centerX, centerY, logoWidth, logoHeight);
  } catch (e) {
    doc.setTextColor(245, 245, 245);
    doc.setFontSize(50);
    doc.setFont("helvetica", "bold");
    
    const text = "ASN";
    const textWidth = doc.getTextWidth(text);
    
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    doc.text(text, centerX - textWidth / 2 + 30, centerY + 15, {
      angle: 45
    });
  }
  
  doc.restoreGraphicsState();
  doc.setTextColor(0, 0, 0);
}

export function addHRSignature(doc: jsPDF, yPosition?: number) {
  const pageHeight = doc.internal.pageSize.getHeight();
  const y = yPosition || pageHeight - 50;
  
  doc.setDrawColor(0, 0, 0);
  doc.line(20, y, 80, y);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.text("Authorized Signatory", 20, y + 8);
  
  doc.setFont("helvetica", "bold");
  doc.text(HR_NAME, 20, y + 16);
  
  doc.setFont("helvetica", "normal");
  doc.text(HR_DESIGNATION, 20, y + 24);
  
  doc.line(130, y, 190, y);
  doc.text("Company Seal", 130, y + 8);
}

export function addFooter(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.1);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  
  const footerText = `${COMPANY_NAME} | Email: info@asnhrconsultancy.com | Website: ${COMPANY_WEBSITE}`;
  doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: "center" });
}

export function addDocumentDate(doc: jsPDF, date?: string, yPosition: number = 68) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const currentDate = date || new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Date: ${currentDate}`, pageWidth - 15, yPosition, { align: "right" });
}

export function addReferenceNumber(doc: jsPDF, refNumber: string, yPosition: number = 68) {
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Ref No: ${refNumber}`, 15, yPosition);
}

export function generateReferenceNumber(prefix: string = "CYB"): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}/${year}${month}/${random}`;
}

export function initializePDF(config: PDFConfig): jsPDF {
  const doc = new jsPDF();
  
  if (config.showWatermark !== false) {
    addWatermark(doc);
  }
  
  if (config.showHeader !== false) {
    addCompanyHeader(doc, config);
  }
  
  if (config.showFooter !== false) {
    addFooter(doc);
  }
  
  return doc;
}

export function finalizePDF(doc: jsPDF, config: PDFConfig, signatureY?: number) {
  if (config.showSignature !== false) {
    addHRSignature(doc, signatureY);
  }
}
