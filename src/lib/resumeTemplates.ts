
/**
 * Utility to wrap a generated resume HTML fragment into a full, self-contained HTML document.
 * This ensures that the resume looks the same in preview, saved history, and downloads.
 */
export function wrapResumeHtml(contentHtml: string, options: { name?: string, isGuest?: boolean, previewMode?: boolean, isPremium?: boolean } = {}) {
  const { name = 'Resume', isGuest = false, previewMode = false, isPremium = false } = options;
  
  const resumeFooter = !isPremium ? `
    <div class="resume-footer" style="
      font-size: 10px; 
      color: #94a3b8; 
      text-align: center; 
      margin-top: 30px; 
      padding-bottom: 20px;
      font-family: 'Inter', sans-serif;
      width: 100%;
      border-top: 1px solid #f1f5f9;
      padding-top: 15px;
      pointer-events: auto !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    ">
      Created by <a href="https://resume-morph.com" style="color: #6366f1; text-decoration: none; font-weight: 700;">Resume Morph</a> (Sankalp Suman)
    </div>
  ` : '';

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
      width: 794px;
      min-height: 1123px;
      padding: 0;
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      overflow: visible;
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
        width: 794px;
        height: 1123px;
        overflow: visible !important;
        transform: none !important;
        -webkit-print-color-adjust: exact; 
        print-color-adjust: exact; 
      }
      .watermark { display: none !important; }
      .resume-footer {
        break-inside: avoid;
        margin-top: 10px !important;
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

    /* Content Isolation and Reset */
    .resume-page {
      transform-origin: top center;
    }
    .resume-page * {
      box-sizing: border-box;
    }

    /* 
     * EXPORT MODE ISOLATION
     * We REMOVE all intrusive borders and paddings to ensure 100% WYSIWYG.
     * The AI-generated content should define its own layout entirely.
     */
    .export-mode .resume-page {
      box-shadow: none !important;
      margin: 0 !important;
      border: none !important;
    }
    
    .export-mode body {
      background: white !important;
      padding: 0 !important;
    }
  </style>
</head>
<body class="${previewMode ? 'preview-mode' : ''}">
  ${previewMode ? `
    <div class="preview-wrapper">
      <div class="preview-scale" id="scaling-container">
        <div class="resume-page">
          ${contentHtml}
          ${resumeFooter}
        </div>
      </div>
    </div>
  ` : `
    <div class="scale-wrapper">
      <div class="resume-page">
        ${contentHtml}
        ${resumeFooter}
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
