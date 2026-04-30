
/**
 * Utility to wrap a generated resume HTML fragment into a full, self-contained HTML document.
 * This ensures that the resume looks the same in preview, saved history, and downloads.
 */
export function wrapResumeHtml(contentHtml: string, options: { name?: string, isGuest?: boolean, previewMode?: boolean } = {}) {
  const { name = 'Resume', isGuest = false, previewMode = false } = options;
  
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
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      transform-origin: top center;
      transition: opacity 0.3s ease;
    }
    /* New Scaling approach ONLY for preview */
    .preview-mode .preview-wrapper {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      background: transparent;
    }
    .preview-mode .preview-scale {
      transform-origin: top center;
      will-change: transform;
      width: 794px;
      height: 1123px;
    }
    .preview-mode .resume-page {
      margin: 0;
      box-shadow: none;
      width: 794px;
      height: 1123px;
    }

    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; padding: 0; background: white; }
      .resume-page { 
        margin: 0; 
        box-shadow: none; 
        width: 210mm;
        height: 297mm;
        overflow: visible !important;
        transform: none !important;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      .watermark { display: none !important; }
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
    /* Default wrapper for non-preview */
    .scale-wrapper {
      width: 100%;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      overflow: auto;
      background: #f8fafc;
    }
  </style>
</head>
<body class="${previewMode ? 'preview-mode' : ''}">
  ${previewMode ? `
    <div class="preview-wrapper">
      <div class="preview-scale" id="scaling-container">
        <div class="resume-page">
          ${contentHtml}
        </div>
      </div>
    </div>
  ` : `
    <div class="scale-wrapper">
      <div class="resume-page">
        ${contentHtml}
      </div>
    </div>
  `}
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    function adjustScale() {
      if (!document.body.classList.contains('preview-mode')) return;

      const element = document.getElementById('scaling-container');
      if (!element) return;
      
      const containerWidth = window.innerWidth;
      const containerHeight = window.innerHeight;
      
      // Base resume size MUST remain: 794x1123
      const scale = Math.min(containerWidth / 794, containerHeight / 1123);
      
      element.style.transform = 'scale(' + scale + ')';
    }
    
    if (document.body.classList.contains('preview-mode')) {
      window.addEventListener('resize', adjustScale);
      window.addEventListener('load', () => setTimeout(adjustScale, 50));
      
      // Initial call
      adjustScale();
    }
  </script>
</body>
</html>
  `.trim();
}
