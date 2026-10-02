import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CustodyReport } from '../types';

export interface ExportPdfOptions {
  elementId?: string;
  report?: CustodyReport;
  filename?: string;
}

export async function exportReportToPdf(options: ExportPdfOptions = {}): Promise<boolean> {
  const { elementId = 'official-receipt-sheet', report, filename } = options;
  const targetElement = document.getElementById(elementId);

  if (!targetElement) {
    console.error(`Target element #${elementId} not found for PDF export.`);
    return false;
  }

  const cleanNum = report?.reportNumber
    ? report.reportNumber.replace(/[/\\?%*:|"<>]/g, '_')
    : '2026';
  const recipientName = report?.recipientName
    ? `_${report.recipientName.replace(/\s+/g, '_')}`
    : '';
  const finalFilename = filename || `محضر_استلام_عهدة_${cleanNum}${recipientName}.pdf`;

  try {
    // Render the element to a high-resolution canvas
    const canvas = await html2canvas(targetElement, {
      scale: 2.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetElement.scrollWidth || 1024,
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.98);

    // Initialize A4 PDF: 210mm x 297mm
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = 210;
    const pdfHeight = 297;

    // Canvas aspect ratio
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;

    // Calculate dimensions to fit inside A4 margins
    const margin = 5; // 5mm margin
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    let renderWidth = usableWidth;
    let renderHeight = renderWidth / ratio;

    if (renderHeight > usableHeight) {
      renderHeight = usableHeight;
      renderWidth = renderHeight * ratio;
    }

    const xOffset = margin + (usableWidth - renderWidth) / 2;
    const yOffset = margin + (usableHeight - renderHeight) / 2;

    pdf.addImage(imgData, 'JPEG', xOffset, yOffset, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(finalFilename);
    return true;
  } catch (error) {
    console.error('Error generating PDF with html2canvas and jsPDF:', error);
    return false;
  }
}
