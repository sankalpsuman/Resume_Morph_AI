
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
  <script src="https://unpkg.com/lucide@latest"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    html {
      overflow-x: hidden;
    }
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
      min-height: 1123px;
      padding: 48px 56px; /* FIXED MARGINS: Top/Bottom 48px, Left/Right 56px */
      margin: 0 auto 20px auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      /* overflow: hidden; -- Removed to allow vertical growth during pagination */
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
      overflow: visible;
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
    .preview-mode body {
      background: #f1f5f9;
      padding: 0 !important;
      margin: 0 !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      overflow-x: hidden !important;
      overflow-y: auto !important;
    }
    .preview-mode #resume-preview {
      transform-origin: top center;
      transition: transform 0.2s ease-out;
      width: 794px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 40px 0;
      margin: 0 auto;
    }
    .preview-mode .page {
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-radius: 2px;
      page-break-after: always;
    }

    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; padding: 0; background: white; overflow: visible !important; height: auto !important; }
      #resume-preview { transform: none !important; width: 794px !important; padding: 0 !important; }
      .page { 
        margin: 0; 
        box-shadow: none; 
        width: 794px;
        height: 1123px;
        overflow: hidden !important;
        page-break-after: always;
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
  </style>
</head>
<body class="${previewMode ? 'preview-mode' : ''}">
  <div id="resume-preview" style="opacity: 0">
    ${contentHtml}
    ${resumeFooter}
  </div>
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    function updateScale() {
      if (!document.body.classList.contains('preview-mode')) return;
      const root = document.getElementById('resume-preview');
      if (!root) return;
      
      const containerWidth = document.documentElement.clientWidth;
      const targetWidth = 840; // 794 + some breathing room
      const scale = Math.min(1, (containerWidth - 10) / targetWidth);
      
      root.style.transform = "scale(" + scale + ")";
      
      // Update body height to match scaled content so scrolling works
      const scaledHeight = root.offsetHeight * scale;
      document.body.style.height = (scaledHeight + 40) + 'px';
      document.body.style.overflowY = 'auto';
    }

    async function paginate() {
      const root = document.getElementById('resume-preview');
      if (!root) return;

      if (window._paginating) return;
      window._paginating = true;

      try {
        const USABLE_HEIGHT = 1027; 
        const footer = document.querySelector('.resume-footer');
        
        // 1. Flatten all pages to get a clean stream of elements
        const existingPages = Array.from(root.querySelectorAll('.page'));
        if (existingPages.length > 0) {
          const fragment = document.createDocumentFragment();
          existingPages.forEach(p => {
             const content = p.querySelector('.content') || p;
             while(content.firstChild) fragment.appendChild(content.firstChild);
          });
          root.innerHTML = '';
          root.appendChild(fragment);
          if (footer) root.appendChild(footer);
        } else if (!root.querySelector('.page')) {
           // Initial wrap
           const contentNodes = Array.from(root.childNodes).filter(n => n !== footer);
           const p = createPageTemplate();
           const c = p.querySelector('.content') || p;
           contentNodes.forEach(n => c.appendChild(n));
           root.prepend(p);
        }

        function createPageTemplate() {
          const p = document.createElement('div');
          p.className = 'page';
          const c = document.createElement('div');
          c.className = 'content';
          p.appendChild(c);
          return p;
        }

        const elements = Array.from(root.childNodes).filter(n => !n.classList?.contains('page') && n !== footer);
        root.innerHTML = '';
        
        let currentPage = createPageTemplate();
        root.appendChild(currentPage);
        let currentContent = currentPage.querySelector('.content');

        // Distribution logic
        elements.forEach(node => {
          if (node.nodeType === 3 && !node.textContent.trim()) return; // Skip empty text
          
          currentContent.appendChild(node);
          
          const rect = currentContent.getBoundingClientRect();
          const children = currentContent.children;
          if (children.length > 0) {
            const lastChild = children[children.length - 1];
            const bottom = lastChild.getBoundingClientRect().bottom;
            const top = rect.top;
            const height = bottom - top;

            if (height > USABLE_HEIGHT && children.length > 1) {
              currentContent.removeChild(node);
              currentPage = createPageTemplate();
              root.appendChild(currentPage);
              currentContent = currentPage.querySelector('.content');
              currentContent.appendChild(node);
            }
          }
        });

        if (footer) root.appendChild(footer);

        // 3. Update Page Indicators
        const allPages = root.querySelectorAll('.page');
        allPages.forEach((pg, i) => {
          pg.setAttribute('data-page', 'Page ' + (i + 1) + ' of ' + allPages.length);
          const pageNumEl = pg.querySelector('.page-number');
          if (pageNumEl) pageNumEl.textContent = (i + 1) + ' / ' + allPages.length;
        });

        updateScale();
      } catch (err) {
        console.error("Pagination error:", err);
      } finally {
        window._paginating = false;
        const root = document.getElementById('resume-preview');
        if (root) root.style.opacity = '1';
      }
    }

    window.addEventListener('load', () => {
      if (window.lucide) window.lucide.createIcons();
      
      // Delay slightly to ensure fonts and layouts are settled
      setTimeout(paginate, 100);
      
      // Listen for window resizes
      window.addEventListener('resize', updateScale);
      
      // Initial scale attempt
      updateScale();
    });
  </script>
</body>
</html>
  `.trim();
}
