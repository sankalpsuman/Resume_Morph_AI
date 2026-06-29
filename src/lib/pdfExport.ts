import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  pixelRatio?: number;
  onProgress?: (progress: number) => void;
}

/**
 * Optimizes an HTML element and exports it as a production-grade PDF.
 * This pipeline focus on small file size (1-3MB) and high visual quality.
 */
export async function exportElementToPDF(
  pages: HTMLElement[], 
  options: PDFExportOptions = {}
): Promise<jsPDF> {
  const {
    quality = 0.85,
    pixelRatio = 2,
    onProgress
  } = options;

  const pdf = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
    compress: true // Enable stream compression
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const standardA4HeightPx = 1123; // at 96dpi

  for (let i = 0; i < pages.length; i++) {
    try {
      const page = pages[i];
      const realHeight = page.offsetHeight;
      
      // Generate optimized JPEG instead of PNG for massive size reduction
      const imgData = await htmlToImage.toJpeg(page, {
        quality,
        pixelRatio,
        backgroundColor: '#ffffff',
        style: {
          margin: '0',
          boxShadow: 'none',
          border: 'none',
          transform: 'none',
          textRendering: 'optimizeLegibility'
        }
      });

      const pagesNeeded = Math.max(1, Math.ceil(realHeight / (standardA4HeightPx + 2)));

      for (let j = 0; j < pagesNeeded; j++) {
        if (i > 0 || j > 0) pdf.addPage();
        
        const position = -(j * pageHeight);
        const totalPdfHeight = (realHeight * pageWidth) / page.offsetWidth;
        
        // Use 'FAST' compression which is better for production-grade JPEGs in PDFs
        pdf.addImage(
          imgData, 
          'JPEG', 
          0, 
          position, 
          pageWidth, 
          totalPdfHeight, 
          undefined, 
          'FAST' 
        );
      }
      
      if (onProgress) {
        onProgress(((i + 1) / pages.length) * 100);
      }
    } catch (error) {
      console.error(`[PDF Export] Error processing page ${i}:`, error);
      // We continue to other pages if one fails, or we could throw. 
      // Given it's a resume, usually it's one page or linked pages.
      throw new Error(`Failed to process page ${i + 1} for PDF export.`);
    }
  }

  return pdf;
}

/**
 * Utility to process images in HTML for better PDF export
 */
export async function optimizeImagesForExport(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  await Promise.all(images.map(img => {
    if (img.complete) return Promise.resolve();
    return new Promise(resolve => {
      img.onload = resolve;
      img.onerror = resolve;
    });
  }));
}
