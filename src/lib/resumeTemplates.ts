
/**
 * Utility to wrap a generated resume HTML fragment into a full, self-contained HTML document.
 * This ensures that the resume looks the same in preview, saved history, and downloads.
 */
export function wrapResumeHtml(contentHtml: string, options: { name?: string, isGuest?: boolean } = {}) {
  const { name = 'Resume', isGuest = false } = options;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    body { 
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #f1f5f9; 
      color: #1a1a1a; 
      display: flex;
      justify-content: center;
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
    }
    .resume-page { 
      background: white;
      width: 210mm;
      min-height: 297mm;
      padding: 0;
      margin: 2rem auto;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transform-origin: top center;
    }
    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; padding: 0; background: white; }
      .resume-page { 
        margin: 0; 
        box-shadow: none; 
        width: 100%;
        height: 100%;
        overflow: visible !important;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      .watermark { display: none !important; }
    }
    @media screen and (max-width: 210mm) {
      body { padding: 0; }
      .resume-page {
        margin: 0;
      }
    }
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 80px;
      font-weight: 900;
      color: rgba(0, 0, 0, 0.05);
      white-space: nowrap;
      pointer-events: none;
      z-index: 1000;
      font-family: sans-serif;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="resume-page">
    ${contentHtml}
  </div>
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    function adjustScale() {
      const page = document.querySelector('.resume-page');
      if (!page) return;
      const width = window.innerWidth;
      const targetWidth = 210 * 3.7795275591; // 210mm in pixels at 96dpi (~794px)
      if (width < targetWidth + 40) {
        const scale = (width - 40) / targetWidth;
        page.style.transform = 'scale(' + Math.min(scale, 1) + ')';
      } else {
        page.style.transform = 'none';
      }
    }
    window.addEventListener('resize', adjustScale);
    window.addEventListener('load', adjustScale);
    // Initial call
    adjustScale();
  </script>
</body>
</html>
  `.trim();
}
