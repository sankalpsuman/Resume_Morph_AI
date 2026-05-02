
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
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
    }
    .page { 
      background: white;
      width: 794px;
      height: 1123px;
      padding: 48px 56px; /* FIXED MARGINS: Top/Bottom 48px, Left/Right 56px */
      margin: 0 auto 20px auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      /* Consistency Lock */
      font-variant-ligatures: none;
      letter-spacing: normal;
      word-spacing: normal;
      page-break-after: always;
    }
    .content {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      overflow: hidden;
      position: relative;
    }
    /* Compatibility with old templates that might not have .page yet */
    .resume-page {
      width: 794px;
      min-height: 1123px;
      padding: 48px 56px;
      background: white;
      margin: 0 auto;
      box-sizing: border-box;
    }
    /* Fixed usable height constant: 1123 - (48 * 2) = 1027px */
    
    /* New Scaling approach ONLY for preview */
    .preview-mode .preview-wrapper {
      width: 100vw;
      height: 100vh;
      overflow: auto; /* Allow scrolling between pages in preview */
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #f1f5f9;
      padding: 20px 0;
    }
    .preview-mode .preview-scale {
      transform-origin: top center;
      will-change: transform;
      width: 794px;
      /* Height will be dynamic based on page count */
    }
    .preview-mode #resume-preview {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .preview-mode .page {
      margin: 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
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
    
    /* Section Header Spacing Standards */
    .section-title {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section-header-divider {
      border-bottom: 1px solid currentColor;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .manual-divider {
      margin-top: 6px;
      margin-bottom: 10px;
      height: 1px;
      background-color: currentColor;
    }
  </style>
</head>
<body class="${previewMode ? 'preview-mode' : ''}">
  ${previewMode ? `
    <div class="preview-wrapper">
      <div class="preview-scale" id="scaling-container">
        <div id="resume-preview">
          ${contentHtml}
          ${resumeFooter}
        </div>
      </div>
    </div>
  ` : `
    <div class="scale-wrapper">
      <div id="resume-preview">
        ${contentHtml}
        ${resumeFooter}
      </div>
    </div>
  `}
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    async function paginate() {
      const root = document.getElementById('resume-preview');
      if (!root) return;

      // 1. Wait for images to load for accurate sizing
      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));

      // 2. Flatten any existing pagination for a clean re-run
      const existingPages = Array.from(root.querySelectorAll('.page'));
      if (existingPages.length > 0) {
        const flatContent = document.createDocumentFragment();
        existingPages.forEach(p => {
          const c = p.querySelector('.content');
          if (c) {
            while (c.firstChild) flatContent.appendChild(c.firstChild);
          }
        });
        root.innerHTML = '';
        root.appendChild(flatContent);
      }

      const elements = Array.from(root.children);
      root.innerHTML = '';

      const USABLE_HEIGHT = 1027; // 1123 - (48 * 2)
      const BUFFER = 4; // 4px safety buffer

      let currentPage = createPage();
      root.appendChild(currentPage);
      let currentContent = currentPage.querySelector('.content');

      for (const el of elements) {
        if (el instanceof HTMLElement) {
          el.style.breakInside = 'avoid';
          el.style.pageBreakInside = 'avoid';
        }

        currentContent.appendChild(el);
        
        // Precise measurement using relative bottom position
        const lastChild = currentContent.lastElementChild;
        const currentHeight = lastChild 
          ? Math.ceil(lastChild.getBoundingClientRect().bottom - currentContent.getBoundingClientRect().top) 
          : 0;

        if (currentHeight > (USABLE_HEIGHT - BUFFER)) {
          // If this is not the only element, move it to a new page
          if (currentContent.children.length > 1) {
            currentContent.removeChild(el);
            
            currentPage = createPage();
            root.appendChild(currentPage);
            currentContent = currentPage.querySelector('.content');
            currentContent.appendChild(el);
          }
        }
      }

      function createPage() {
        const p = document.createElement('div');
        p.className = 'page';
        const c = document.createElement('div');
        c.className = 'content';
        p.appendChild(c);
        return p;
      }
      
      if (typeof adjustScale === 'function') adjustScale();
    }

    function adjustScale() {
      if (!document.body.classList.contains('preview-mode')) return;

      const element = document.getElementById('scaling-container');
      if (!element) return;
      
      const containerWidth = window.innerWidth;
      
      // Scale based on WIDTH only if we want to scroll vertically
      const widthScale = (containerWidth - 60) / 794;
      const finalScale = Math.min(widthScale, 1.1); 
      
      element.style.transform = 'scale(' + finalScale + ')';
    }
    
    window.addEventListener('load', () => {
      const runPagination = () => {
        // Essential 100ms delay for full DOM render stabilization
        setTimeout(paginate, 100); 
      };

      if (document.fonts) {
        document.fonts.ready.then(runPagination);
      } else {
        runPagination();
      }
    });

    if (document.body.classList.contains('preview-mode')) {
      window.addEventListener('resize', adjustScale);
    }

    // Mutation observer to handle late-arriving content updates from React
    const observer = new MutationObserver((mutations) => {
      let shouldRepaginate = false;
      mutations.forEach(m => {
        if (m.type === 'childList') {
          const hasPages = Array.from(m.target.children || []).some(child => child.classList?.contains('page'));
          if (!hasPages && m.target.id === 'resume-preview' && m.addedNodes.length > 0) {
            shouldRepaginate = true;
          }
        }
      });
      if (shouldRepaginate) setTimeout(paginate, 100);
    });
    
    setTimeout(() => {
      const root = document.getElementById('resume-preview');
      if (root) observer.observe(root, { childList: true });
    }, 500);
  </script>
</body>
</html>
  `.trim();
}
