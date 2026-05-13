
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
      padding: 40px 0;
      display: block;
      height: auto;
      min-height: 100vh;
      overflow-y: auto;
    }
    .preview-mode #resume-preview {
      margin: 0 auto;
      width: 794px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .preview-mode .page {
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-radius: 2px;
      page-break-after: always;
      height: auto; /* Allow growth for measurement */
    }
    .preview-mode .page-finished {
      height: 1123px;
      overflow: hidden;
    }

    @media print {
      @page { margin: 0; size: A4; }
      body { margin: 0; padding: 0; background: white; }
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
  <div id="resume-preview">
    ${contentHtml}
    ${resumeFooter}
  </div>
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    async function paginate() {
      const root = document.getElementById('resume-preview');
      if (!root) return;

      if (window._paginating) return;
      window._paginating = true;

      try {
        const USABLE_HEIGHT = 1027; 
        const footer = document.querySelector('.resume-footer');
        
        // 1. Initial Wrap: If no .page exists, wrap all root children (except footer) into a single page
        const existingPages = root.querySelectorAll('.page');
        if (existingPages.length === 0) {
          const wrapperPage = document.createElement('div');
          wrapperPage.className = 'page';
          const content = document.createElement('div');
          content.className = 'content';
          
          const nodes = Array.from(root.childNodes);
          nodes.forEach(node => {
            if (node !== footer && node !== wrapperPage) {
              content.appendChild(node);
            }
          });
          
          wrapperPage.appendChild(content);
          root.prepend(wrapperPage);
        }

        // 2. Multi-page Flow Logic
        let pageIndex = 0;
        let safetyCounter = 0;
        
        // Cache the first page's structure and classes to use as template for new pages
        const firstPage = root.querySelector('.page');
        if (!firstPage) return; // Should not happen after wrap logic

        while (pageIndex < root.querySelectorAll('.page').length && safetyCounter < 50) {
          safetyCounter++;
          const currentPage = root.querySelectorAll('.page')[pageIndex];
          const content = currentPage.querySelector('.content') || currentPage;
          
          currentPage.style.height = 'auto';
          currentPage.style.overflow = 'visible';
          
          if (content.scrollHeight > USABLE_HEIGHT + 2) {
            let nextPage = root.querySelectorAll('.page')[pageIndex + 1];
            if (!nextPage) {
              // CLONE TEMPLATE: Clone the first page but empty its content area
              nextPage = firstPage.cloneNode(true);
              nextPage.classList.remove('page-finished');
              const nextContent = nextPage.querySelector('.content') || nextPage;
              nextContent.innerHTML = ''; // Clear cloned content
              
              if (footer) {
                root.insertBefore(nextPage, footer);
              } else {
                root.appendChild(nextPage);
              }
            }
            
            const nextContent = nextPage.querySelector('.content') || nextPage;
            const children = Array.from(content.children);
            
            // Move items that cause overflow to the next container
            for (let j = children.length - 1; j >= 0; j--) {
              const child = children[j];
              nextContent.insertBefore(child, nextContent.firstChild);
              
              if (content.scrollHeight <= USABLE_HEIGHT) {
                break;
              }
            }
          }
          
          currentPage.classList.add('page-finished');
          currentPage.style.height = ''; 
          currentPage.style.overflow = '';
          
          pageIndex++;
        }

        // 3. Update Page Indicators
        const allPages = root.querySelectorAll('.page');
        allPages.forEach((pg, i) => {
          pg.setAttribute('data-page', 'Page ' + (i + 1) + ' of ' + allPages.length);
          // If there's a visible page number element, update its text
          const pageNumEl = pg.querySelector('.page-number');
          if (pageNumEl) pageNumEl.textContent = (i + 1) + ' / ' + allPages.length;
        });
      } catch (err) {
        console.error("Pagination error:", err);
      } finally {
        window._paginating = false;
        root.style.opacity = '1';
      }
    }

    window.addEventListener('load', () => {
      if (window.lucide) window.lucide.createIcons();
      
      // Delay slightly to ensure fonts and layouts are settled
      setTimeout(paginate, 100);
      
      // Visibility lock
      document.getElementById('resume-preview').style.opacity = '1';
    });
  </script>
</body>
</html>
  `.trim();
}
