
/**
 * Utility to wrap a generated resume HTML fragment into a full, self-contained HTML document.
 * This ensures that the resume looks the same in preview, saved history, and downloads.
 */
export function wrapResumeHtml(contentHtml: string, options: { name?: string, isGuest?: boolean, previewMode?: boolean, isPremium?: boolean, showA4Border?: boolean } = {}) {
  const { name = 'Resume', isGuest = false, previewMode = false, isPremium = false, showA4Border = false } = options;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet" crossorigin="anonymous">
  <style>
    /* Prevent potential CSS rule reading errors from breaking the preview */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap');
    
    html {
      height: 100%;
      background: #f1f5f9;
    }
    body { 
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #f1f5f9; 
      color: #1a1a1a; 
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100%;
      width: 100%;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      text-rendering: geometricPrecision;
      overflow-y: auto !important;
      scroll-behavior: smooth;
    }
    .page { 
      background: white;
      width: 794px;
      height: 1123px;
      padding: 24px 32px;
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      position: relative;
      box-sizing: border-box;
      font-variant-ligatures: none;
      letter-spacing: normal;
      word-spacing: normal;
      page-break-after: always;
      flex-shrink: 0;
    }
    /* PDF Consistency Overrides */
    .page * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Prevent section headers and blocks from splitting weirdly */
    .section-title, h1, h2, h3, h4, h5, h6, 
    section, article, .section, .resume-section, .section-container,
    .experience-item, .experience-card, .experience-block, .job-item, .job-card,
    .education-item, .education-card, .education-block, .edu-item, .edu-card,
    .project-item, .project-card, .project-block,
    .skill-item, .skill-group, .skill-card, .skill-category,
    .cert-item, .certification-item, .cert-card, .award-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .content {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      position: relative;
    }
    /* Compatibility with old templates that might not have .page yet */
    .resume-page {
      width: 794px;
      min-height: 1123px;
      padding: 24px 32px;
      background: white;
      margin: 0 auto;
      box-sizing: border-box;
    }
    /* New Scaling approach ONLY for preview */
    .preview-mode body {
      background: #f8fafc;
      padding: 0 !important;
      margin: 0 !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
      width: 100%;
      overflow-y: auto;
    }
    .preview-mode #resume-preview-container {
      width: 100% !important;
      margin: 0 auto !important;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 0 !important;
      box-sizing: border-box;
      min-height: 100vh;
    }
    .preview-mode #resume-preview {
      transform-origin: top center;
      width: 794px;
      display: flex;
      flex-direction: column;
      gap: 60px;
      padding: 0;
      margin: 0;
      opacity: 0;
      transition: opacity 0.4s ease;
      position: relative;
    }
    .preview-mode .page {
      background: white;
      margin: 0 auto;
      width: 794px;
      height: 1123px;
      page-break-after: always;
      position: relative;
      flex-shrink: 0;
      box-shadow: 0 12px 60px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.1);
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.02);
      transition: all 0.3s ease;
    }
    .preview-mode .page:hover {
      box-shadow: 0 30px 80px rgba(0,0,0,0.1), 0 0 1px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .page-number-float {
      position: absolute;
      bottom: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      color: #6366f1;
      padding: 6px 16px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2ff;
      z-index: 50;
      pointer-events: none;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-number-float::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #6366f1;
      border-radius: 50%;
    }
    .page-break-indicator {
      position: absolute;
      left: -20px;
      right: -20px;
      height: 1px;
      border-bottom: 1px dashed #cbd5e1;
      bottom: -16px;
      pointer-events: none;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .page-break-indicator::after {
      content: 'PAGE BREAK';
      background: #f1f5f9;
      padding: 0 8px;
      font-size: 8px;
      font-weight: 800;
      color: #94a3b8;
      letter-spacing: 0.1em;
    }

    @media print {
      @page { 
        margin: 0 !important; 
        size: A4; 
      }
      body { 
        margin: 0 !important; 
        padding: 0 !important; 
        background: white; 
        overflow: visible !important; 
        height: auto !important; 
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      #resume-preview { 
        transform: none !important; 
        width: 794px !important; 
        padding: 0 !important; 
        margin: 0 !important;
      }
      .page { 
        margin: 0 !important; 
        box-shadow: none !important; 
        width: 794px !important; 
        min-height: 1123px !important;
        height: auto !important;
        overflow: visible !important;
        page-break-after: always !important;
        border: none !important;
      }
      .page-break-indicator { display: none !important; }
      .watermark { display: none !important; }
      .resume-footer { display: none !important; }

      /* Print utility to scale and center layout perfectly on physical standard pages */
      .print-resume-center {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        justify-content: flex-start !important;
        margin: 0 auto !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        transform: scale(0.96) !important;
        transform-origin: top center !important;
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
<body class="${previewMode ? 'preview-mode' : ''}">
  <div id="resume-preview-container" class="print-resume-center" style="position: relative; width: 100%; margin: 0 auto; overflow: visible; display: flex; flex-direction: column; align-items: center; min-height: 100vh;">
    <div id="resume-preview" style="opacity: 0">
      ${contentHtml}
    </div>
  </div>
  ${isGuest ? '<div class="watermark">MORPH ENGINE GUEST</div>' : ''}
  <script>
    function updateScale() {
      if (!document.body.classList.contains('preview-mode')) return;
      const root = document.getElementById('resume-preview');
      const container = document.getElementById('resume-preview-container');
      if (!root || !container) return;
      
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const padding = 20; 
      const pageHeight = 1123;
      const pageWidth = 794;

      let scale = 1;
      if (viewportWidth < pageWidth + padding) {
        scale = (viewportWidth - padding) / pageWidth;
      }
      
      scale = Math.max(0.1, Math.min(scale, 2.0));

      root.style.transform = "scale(" + scale + ")";
      root.style.transformOrigin = "top center";
      
      const pages = root.querySelectorAll('.page');
      const GAP = 60;
      const totalUnscaledHeight = pages.length > 0 
        ? (pages.length * pageHeight + (pages.length - 1) * GAP)
        : root.scrollHeight;
      
      const scaledHeight = totalUnscaledHeight * scale;

      window.parent.postMessage({ 
        type: 'RESUME_HEIGHT_UPDATE', 
        height: scaledHeight + 100,
        totalPages: pages.length 
      }, '*');
      
      window.parent.postMessage({ type: 'RESUME_ZOOM_UPDATE', zoom: Math.round(scale * 100) }, '*');
    }

    window.onerror = function(msg, url, line, col, error) {
      if (msg && (msg.includes('CSSRules') || msg.includes('SecurityError'))) return true;
      return false;
    };

    window.addEventListener('message', (event) => {
      if (event.data?.type === 'SCROLL_TO_PAGE') {
        const root = document.getElementById('resume-preview');
        if (!root) return;
        const scaleStr = root.style.transform;
        const match = scaleStr.match(/scale\(([^)]+)\)/);
        const scale = match ? parseFloat(match[1]) : 1;
        const pageHeight = 1123;
        const GAP = 60;
        
        window.parent.postMessage({ 
          type: 'REQUEST_PARENT_SCROLL', 
          top: (event.data.page - 1) * (pageHeight + GAP) * scale + 40
        }, '*');
      }
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(updateScale, 50);
    });

    async function paginate() {
      const root = document.getElementById('resume-preview');
      if (!root || window._paginating) return;
      window._paginating = true;

      if (!window._originalHTML) {
        window._originalHTML = root.innerHTML;
      } else {
        root.innerHTML = window._originalHTML;
      }

      // Clean up any existing pagination artifacts that might have leaked into _originalHTML
      const artifacts = root.querySelectorAll('.page-number-float, .page-break-indicator');
      artifacts.forEach(a => a.remove());

      root.style.transform = 'none';
      root.style.width = '794px';
      root.style.opacity = '0';
      
      const container = document.getElementById('resume-preview-container');
      if (container) {
        container.style.width = '100%';
        container.style.height = 'auto';
      }

      const PAGE_HEIGHT = 1123;
      const MARGIN_VERTICAL = 24;
      const SAFE_HEIGHT = PAGE_HEIGHT - (MARGIN_VERTICAL * 2) - 10; 

      function getPageColumns(page) {
        const sidebar = page.querySelector('.sidebar, .layout-sidebar, aside, [class*="sidebar"], [class*="layout-sidebar"]');
        const main = page.querySelector('.main, .layout-main, .main-column, [class*="main"], [class*="layout-main"]');
        if (sidebar && main) return [sidebar, main];
        const content = page.querySelector('.content') || page;
        return [content];
      }

      function getElementHeight(el, relativeTo) {
        if (!el) return 0;
        let top = 0;
        let current = el;
        let found = false;
        while (current) {
          if (current === relativeTo) {
            found = true;
            break;
          }
          top += current.offsetTop || 0;
          current = current.offsetParent;
        }
        if (found) {
          return top + el.offsetHeight;
        }
        const rect = el.getBoundingClientRect();
        const baseRect = relativeTo.getBoundingClientRect();
        return rect.bottom - baseRect.top;
      }

      function isHeader(el) {
        if (!el || el.nodeType !== 1) return false;
        const classes = el.className || '';
        const tag = el.tagName.toUpperCase();
        return /section-title|section-header|heading|title|header/i.test(classes) || 
               ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(tag);
      }

      function splitElement(el, currentPage, maxHeight) {
        if (!el || el.nodeType !== 1) return null;
        
        const classes = el.className || '';
        
        // Leaf-level content blocks that we should avoid splitting internally unless they are extremely large
        const isLeafBlock = /experience-item|job-item|education-item|project-item|skill-item|cert-item|bullet-item/i.test(classes) ||
                            /experience-card|job-card|education-card|project-card|skill-card|cert-card/i.test(classes) ||
                            /item-row|grid-cols|flex-row/i.test(classes);
        
        if (isLeafBlock && el.offsetHeight < maxHeight) {
          return null;
        }

        const children = Array.from(el.children);
        if (children.length === 0) return null;

        // Find the first child that overflows
        let firstOverflowIdx = -1;
        for (let i = 0; i < children.length; i++) {
          if (getElementHeight(children[i], currentPage) > maxHeight) {
            firstOverflowIdx = i;
            break;
          }
        }

        if (firstOverflowIdx === -1) {
          return null;
        }

        // Try to recursively split the overflowing child first
        const overflowChild = children[firstOverflowIdx];
        const clonedChild = splitElement(overflowChild, currentPage, maxHeight);
        if (clonedChild) {
          overflowChild.parentNode.insertBefore(clonedChild, overflowChild.nextSibling);
          firstOverflowIdx = firstOverflowIdx + 1;
        }

        // Now split the current element el at firstOverflowIdx
        if (firstOverflowIdx <= 0) {
          return null;
        }

        // Avoid orphan headers: if firstOverflowIdx is 1 and the first child is a header, don't split!
        if (firstOverflowIdx === 1 && isHeader(children[0])) {
          return null;
        }

        // Move overflowing children to a cloned container
        const clonedEl = el.cloneNode(false);
        if (clonedEl.id) clonedEl.removeAttribute('id');
        
        const currentChildren = Array.from(el.children);
        for (let i = firstOverflowIdx; i < currentChildren.length; i++) {
          clonedEl.appendChild(currentChildren[i]);
        }

        return clonedEl;
      }

      async function processPagination() {
        let firstPage = root.querySelector('.page');
        if (!firstPage) {
          const content = root.innerHTML;
          root.innerHTML = '<div class="page"><div class="content">' + content + '</div></div>';
        }

        let currentPageIdx = 0;
        while (currentPageIdx < root.children.length) {
          const currentPage = root.children[currentPageIdx];
          const cols = getPageColumns(currentPage);
          let nextPage = null;
          let nextCols = null;

          for (let colIdx = 0; colIdx < cols.length; colIdx++) {
            const col = cols[colIdx];
            let children = Array.from(col.children);
            if (children.length === 0) continue;

            let splitIdx = -1;
            for (let i = 0; i < children.length; i++) {
              if (getElementHeight(children[i], currentPage) > SAFE_HEIGHT) {
                // Try to split this element recursively
                const clonedEl = splitElement(children[i], currentPage, SAFE_HEIGHT);
                if (clonedEl) {
                  children[i].parentNode.insertBefore(clonedEl, children[i].nextSibling);
                  children = Array.from(col.children);
                  splitIdx = i + 1;
                } else {
                  // Standard element level split determination
                  // Safety: if the very first element overflows, moving it to next page 
                  // only helps if the current page has a header taking up space.
                  // If we're already on a sub-page (no header) or it's just too big, 
                  // we must keep it here to avoid infinite pagination loops.
                  const hasHeader = !!currentPage.querySelector('.resume-header, .profile-header, header');
                  if (i === 0 && !hasHeader) {
                    splitIdx = -1;
                  } else if (i > 0 && isHeader(children[i-1])) {
                    splitIdx = i - 1;
                  } else {
                    splitIdx = i;
                  }
                }
                break;
              }
            }

            if (splitIdx !== -1 && splitIdx < children.length) {
              if (!nextPage) {
                nextPage = currentPage.cloneNode(true);
                const header = nextPage.querySelector('.resume-header, .profile-header, header');
                if (header) header.remove();
                nextCols = getPageColumns(nextPage);
                nextCols.forEach(c => c.innerHTML = '');
                root.insertBefore(nextPage, currentPage.nextSibling);
              }
              const targetCol = nextCols[colIdx];
              for (let i = splitIdx; i < children.length; i++) {
                targetCol.appendChild(children[i]);
              }
            }
          }
          currentPageIdx++;
          if (currentPageIdx > 40) break; // Increased safety limit slightly for very long legitimate resumes
        }

        // Remove trailing empty pages
        let currentPages = Array.from(root.querySelectorAll('.page'));
        for (let i = currentPages.length - 1; i >= 1; i--) {
          const page = currentPages[i];
          const cols = getPageColumns(page);
          const hasContent = cols.some(col => col.children.length > 0);
          if (!hasContent) {
            page.remove();
          } else {
            break;
          }
        }

        const finalPages = root.querySelectorAll('.page');
        finalPages.forEach((page, i) => {
          page.style.height = PAGE_HEIGHT + 'px';
          page.style.overflow = 'hidden';
          
          let num = page.querySelector('.page-number-float');
          if (!num) {
            num = document.createElement('div');
            num.className = 'page-number-float';
            page.appendChild(num);
          }
          num.textContent = (i + 1) + ' / ' + finalPages.length;

          if (i < finalPages.length - 1) {
            const indicator = document.createElement('div');
            indicator.className = 'page-break-indicator';
            page.appendChild(indicator);
          }
        });

        window.parent.postMessage({ type: 'RESUME_PAGINATION_UPDATE', totalPages: finalPages.length }, '*');

        if (window.lucide) window.lucide.createIcons();
        updateScale();
        root.style.opacity = '1';
        window._paginating = false;
      }

      const images = Array.from(root.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
      }));
      if (document.fonts) await document.fonts.ready;
      await processPagination();
    }

    window.addEventListener('load', () => {
      setTimeout(paginate, 100);
      window.addEventListener('resize', updateScale);
      updateScale();
    });
  </script>
</body>
</html>
  `.trim();
}
