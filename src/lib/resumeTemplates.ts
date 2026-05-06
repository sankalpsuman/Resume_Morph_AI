
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
      overflow-x: hidden;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #e2e8f0; /* Slightly darker workbench gray for better contrast */
      padding: 0; 
      scroll-behavior: smooth;
    }
    .preview-mode .preview-container-inner {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      overflow: visible;
    }
    .preview-mode .preview-scale {
      transform-origin: top center;
      will-change: transform;
      width: 850px; /* Wider to accommodate shadows */
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0 100px 0;
      overflow: visible;
    }
    .preview-mode #resume-preview {
      display: flex;
      flex-direction: column;
      gap: 50px; /* Increased gap */
      width: 794px;
    }
    .preview-mode .page {
      margin: 0;
      box-shadow: 0 20px 50px rgba(0,0,0,0.15); /* Stronger shadow for depth */
      border-radius: 4px;
      background: white;
      position: relative;
    }
    /* Page Labels on Hover */
    .preview-mode .page::after {
      content: "Page " attr(data-page);
      position: absolute;
      top: -28px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 10px;
      font-weight: 800;
      color: #64748b;
      background: #e2e8f0;
      padding: 4px 12px;
      border-radius: 100px;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      border: 1px solid #cbd5e1;
    }
    .preview-mode .page:hover::after {
      opacity: 1;
    }
    /* Printable Margin Guides */
    .preview-mode .page::before {
      content: "";
      position: absolute;
      top: 48px;
      left: 56px;
      right: 56px;
      bottom: 48px;
      border: 1px dashed rgba(99, 102, 241, 0.15);
      pointer-events: none;
      z-index: 1;
    }
    /* Overflow Detection */
    .preview-mode .page.overflow {
      box-shadow: 0 0 0 3px #ef4444 !important;
    }
    .preview-mode .page.overflow::after {
      content: "⚠️ PAGE OVERFLOW - CONTENT CLIPPED";
      background: #ef4444;
      color: white;
      opacity: 1;
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
      <div class="preview-container-inner" id="scrolling-limiter">
        <div class="preview-scale" id="scaling-container">
          <div id="resume-preview">
            ${contentHtml}
            ${resumeFooter}
          </div>
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
      const scaler = document.getElementById('scaling-container');
      if (!root || !scaler) return;

      // Anti-recursion guard
      if (root.getAttribute('data-paginating') === 'true') return;
      root.setAttribute('data-paginating', 'true');

      // 1. Temporarily disable scaling for accurate pixel measurement
      const originalTransform = scaler.style.transform;
      scaler.style.transform = 'scale(1)';
      scaler.style.transition = 'none';

      // Ensure no cropping during measurement
      const existingPages = Array.from(root.querySelectorAll('.page'));
      existingPages.forEach(p => {
        p.style.height = 'auto';
        p.style.minHeight = '1123px';
        const c = p.querySelector('.content');
        if (c) {
          c.style.height = 'auto';
          c.style.minHeight = '1027px';
        }
      });

      // Essential Usable height: 1123 - (48 * 2) = 1027
      const USABLE_HEIGHT = 1027; 
      const BUFFER = 5; // 5px buffer to prevent edge cases

      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(images.map(img => img.complete ? Promise.resolve() : new Promise(r => img.onload = img.onerror = r)));

      // 1.5 Detect and cache layout shell (sidebar, etc) if present
      let shellTemplate = null;
      if (existingPages.length > 0) {
        const firstC = existingPages[0].querySelector('.content');
        if (firstC && firstC.firstElementChild) {
           const firstChild = firstC.firstElementChild;
           // If it's a grid or flex with children, it's likely our shell
           if (firstChild instanceof HTMLElement && (firstChild.classList.contains('grid') || firstChild.classList.contains('flex')) && firstChild.children.length > 1) {
              shellTemplate = firstChild.cloneNode(false);
              // Clone the sidebar (first child)
              const sidebar = firstChild.firstElementChild.cloneNode(true);
              shellTemplate.appendChild(sidebar);
              // Clone the main column container (last child) but empty
              const mainCol = firstChild.lastElementChild.cloneNode(false);
              shellTemplate.appendChild(mainCol);
           }
        }
      }

      let initialNodes = [];
      if (existingPages.length > 0) {
        existingPages.forEach(p => {
          const c = p.querySelector('.content');
          if (c) {
            const shell = c.firstElementChild;
            if (shell instanceof HTMLElement && (shell.classList.contains('grid') || shell.classList.contains('flex')) && shell.children.length > 1) {
              // Extract from main column (last child)
              initialNodes.push(...Array.from(shell.lastElementChild.childNodes));
            } else {
              initialNodes.push(...Array.from(c.childNodes));
            }
          }
        });
      } else {
        initialNodes = Array.from(root.childNodes);
      }

      if (initialNodes.length === 0) {
        scaler.style.transform = originalTransform;
        scaler.style.transition = '';
        root.removeAttribute('data-paginating');
        return;
      }

      const fragment = document.createDocumentFragment();
      let currentPage = createPage();
      let currentContent = currentPage.querySelector('.content');
      
      // Target the main column if shell exists
      if (shellTemplate) {
        const shell = currentContent.firstElementChild;
        if (shell && shell.lastElementChild) {
          currentContent = shell.lastElementChild;
        }
      }
      
      // During pagination, allow content to grow for measurement
      currentContent.style.height = 'auto';
      
      let pageList = [currentPage];
      fragment.appendChild(currentPage);

      for (const node of initialNodes) {
        if (node.nodeType === 3 && !node.textContent?.trim()) continue;
        
        const el = node.cloneNode(true);
        if (el instanceof HTMLElement) {
          el.style.breakInside = 'avoid';
          el.style.pageBreakInside = 'avoid';
        }

        currentContent.appendChild(el);
        
        // Measure real content height using scrollHeight which is more reliable for hidden overflow content
        const currentHeight = currentContent.scrollHeight;

        if (currentHeight > (USABLE_HEIGHT - BUFFER)) {
          if (currentContent.childNodes.length > 1) {
            currentContent.removeChild(currentContent.lastChild!);
            
            currentPage = createPage();
            pageList.push(currentPage);
            fragment.appendChild(currentPage);
            
            currentContent = currentPage.querySelector('.content');
            if (shellTemplate) {
              const shell = currentContent.firstElementChild;
              if (shell && shell.lastElementChild) {
                currentContent = shell.lastElementChild;
              }
            }
            currentContent.style.height = 'auto';
            currentContent.appendChild(el);
          } else {
            currentPage.classList.add('overflow');
          }
        }
      }

      // Final cleanup: Restore fixed heights for display
      pageList.forEach((p, idx) => {
        p.setAttribute('data-page', (idx + 1) + ' of ' + pageList.length);
        p.style.height = '';
        p.style.minHeight = '';
        const c = p.querySelector('.content');
        if (c) {
          c.style.height = '';
          c.style.minHeight = '';
        }
      });

      root.innerHTML = '';
      root.appendChild(fragment);

      function createPage() {
        const p = document.createElement('div');
        p.className = 'page';
        const c = document.createElement('div');
        c.className = 'content';
        
        if (shellTemplate) {
          c.appendChild(shellTemplate.cloneNode(true));
        }
        
        p.appendChild(c);
        return p;
      }
      
      scaler.style.transform = originalTransform;
      scaler.style.transition = '';
      
      if (typeof adjustScale === 'function') adjustScale();
      
      // Release guard
      setTimeout(() => {
        root.removeAttribute('data-paginating');
      }, 500);
    }

    let currentZoomMode = 'fit-width';

    function adjustScale() {
      if (!document.body.classList.contains('preview-mode')) return;
      if (document.body.classList.contains('no-scale')) return;

      const element = document.getElementById('scaling-container');
      const wrapper = document.querySelector('.preview-wrapper');
      const limiter = document.getElementById('scrolling-limiter');
      if (!element || !wrapper || !limiter) return;
      
      const containerWidth = wrapper.clientWidth;
      const containerHeight = wrapper.clientHeight;
      
      // Calculate best fit scale
      const horizontalPadding = containerWidth < 768 ? 20 : 80;
      const verticalPadding = 40;
      
      let finalScale = (containerWidth - horizontalPadding) / 794;
      
      // If we want to fit a full page height
      if (currentZoomMode === 'fit-page') {
        const pageScale = (containerHeight - verticalPadding) / 1123;
        finalScale = Math.min(finalScale, pageScale);
      } else if (currentZoomMode === 'actual') {
        finalScale = 1;
        // On mobile, actual size might be too big, so we clamp it to fit-width if actual > fit-width
        const fitWidthScale = (containerWidth - 20) / 794;
        if (containerWidth < 800) finalScale = Math.min(1, fitWidthScale);
      }

      // Constrain scale for sanity
      finalScale = Math.max(0.2, Math.min(finalScale, 2.0));
      
      element.style.transform = 'scale(' + finalScale + ')';
      
      // Calculate real dimensions
      const unscaledHeight = element.offsetHeight;
      const scaledHeight = unscaledHeight * finalScale;
      const scaledWidth = 850 * finalScale;

      // The scaling container's own height must be reduced to the scaled height
      // transform: scale doesn't do this, so we must limit it via the limiter.
      element.style.height = unscaledHeight + 'px'; 
      element.style.marginBottom = '-' + (unscaledHeight - scaledHeight) + 'px';
      
      limiter.style.height = scaledHeight + 'px';
      limiter.style.overflow = 'hidden';

      element.style.opacity = '1';
      element.style.transition = 'opacity 0.4s ease-out, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    // Use ResizeObserver for more responsive scaling if supported
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(adjustScale);
      });
      resizeObserver.observe(document.body);
    }

    window.addEventListener('message', (event) => {
      if (event.data.type === 'SET_ZOOM_MODE') {
        currentZoomMode = event.data.mode;
        adjustScale();
      }
    });
    
    window.addEventListener('load', () => {
      const runPagination = () => {
        // Essential 100ms delay for full DOM render stabilization
        setTimeout(paginate, 100); 
      };

      // Force visibility immediately
      const sc = document.getElementById('scaling-container');
      if (sc) sc.style.opacity = '1';

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
      const root = document.getElementById('resume-preview');
      if (root && root.getAttribute('data-paginating') === 'true') return;
      
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
