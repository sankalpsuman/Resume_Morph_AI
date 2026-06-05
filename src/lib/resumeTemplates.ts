
/**
 * Utility to wrap a generated resume HTML fragment into a full, self-contained HTML document.
 * This ensures that the resume looks the same in preview, saved history, and downloads.
 */
export function wrapResumeHtml(contentHtml: string, options: { name?: string, isGuest?: boolean, previewMode?: boolean, isPremium?: boolean } = {}) {
  const { name = 'Resume', isGuest = false, previewMode = false, isPremium = false } = options;
  
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
    /* PDF Consistency Overrides */
    .page * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* Prevent section headers and blocks from splitting weirdly */
    .section-title, h1, h2, h3, .experience-item, .education-item, .project-item, .skill-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
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
      transform-origin: top left;
      transition: transform 0.2s ease-out;
      width: 794px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 40px 0;
      margin: 0;
    }
    .preview-mode .page {
      margin: 0 auto;
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      border-radius: 2px;
      page-break-after: always;
    }
    .page-break-indicator {
      position: absolute;
      left: -80px;
      right: -80px;
      height: 24px;
      background: #f1f5f9;
      border-top: 1px solid #cbd5e1;
      border-bottom: 1px solid #cbd5e1;
      box-shadow: 
        0 -4px 6px -1px rgba(0, 0, 0, 0.05),
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        inset 0 3px 6px rgba(0, 0, 0, 0.02),
        inset 0 -3px 6px rgba(0, 0, 0, 0.02);
      pointer-events: none;
      z-index: 9999;
    }
    .page-break-indicator::after {
      content: 'PAGE BREAK';
      position: absolute;
      right: 48px;
      top: 4px;
      background: #f1f5f9;
      padding: 2px 10px;
      font-size: 8px;
      font-weight: 800;
      color: #6366f1;
      border-radius: 4px;
      letter-spacing: 0.1em;
      border: 1px solid #c7d2fe;
      z-index: 10000;
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
  <div id="resume-preview-container" class="print-resume-center" style="position: relative; width: 794px; margin: 0 auto; overflow: visible;">
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
      
      const containerWidth = document.documentElement.clientWidth;
      const targetWidth = 840; // 794 + some breathing room
      const scale = Math.min(1, (containerWidth - 24) / targetWidth);
      
      root.style.transform = "scale(" + scale + ")";
      root.style.transformOrigin = "top left";
      
      // Get unscaled element height
      const unscaledHeight = root.offsetHeight;
      
      // Update parent container dimensions to perfectly match visible scale footprint
      container.style.width = (794 * scale) + "px";
      container.style.height = (unscaledHeight * scale) + "px";
      container.style.overflow = "hidden";
      container.style.margin = "0 auto";
      
      document.body.style.height = 'auto';
      document.body.style.minHeight = '100vh';
      document.body.style.overflowY = 'auto';
    }

    async function paginate() {
      const root = document.getElementById('resume-preview');
      if (!root) return;

      if (window._paginating) return;
      window._paginating = true;

      console.log("[Paginator Debug] Initializing cascading page pagination...");

      // Reset scale and width to allow pristine layout measurements
      root.style.transform = 'none';
      root.style.width = '794px';
      
      const container = document.getElementById('resume-preview-container');
      if (container) {
        container.style.width = '794px';
        container.style.height = 'auto';
        container.style.overflow = 'visible';
      }

      function getContainerContentHeight(col) {
        const children = Array.from(col.children);
        if (children.length === 0) return 0;
        
        const containerRect = col.getBoundingClientRect();
        const top = containerRect.top;
        
        let maxBottom = top;
        children.forEach(child => {
          const childRect = child.getBoundingClientRect();
          if (childRect.bottom > maxBottom) {
            maxBottom = childRect.bottom;
          }
        });
        
        return maxBottom - top;
      }

      function getPageColumns(page) {
        const sidebar = page.querySelector('.layout-sidebar') || page.querySelector('.sidebar');
        const main = page.querySelector('.layout-main') || page.querySelector('.main-column') || page.querySelector('.main');
        
        if (sidebar && main) {
          return [sidebar, main];
        }
        
        const content = page.querySelector('.content') || page;
        return [content];
      }

      function isSplitable(node) {
        if (node.nodeType !== 1) return false;
        const tag = node.tagName.toUpperCase();
        const atomicTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'LI', 'A', 'SPAN', 'IMG', 'BUTTON', 'I', 'B', 'STRONG', 'EM', 'svg', 'path'];
        if (atomicTags.includes(tag)) return false;
        
        // If it has children and is not a small button/icon container
        if (node.children.length === 0) return false;
        
        return true;
      }

      function splitNode(node, availableHeight) {
        const fits = node.cloneNode(false);
        const overflow = node.cloneNode(false);
        
        const tempContainer = document.createElement('div');
        tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 794px; opacity: 0;';
        document.body.appendChild(tempContainer);
        tempContainer.appendChild(fits);
        
        const children = Array.from(node.childNodes);
        let splitPointReached = false;
        
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          
          if (splitPointReached) {
            overflow.appendChild(child.cloneNode(true));
            continue;
          }
          
          const childClone = child.cloneNode(true);
          fits.appendChild(childClone);
          
          const currentHeight = fits.getBoundingClientRect().height;
          
          if (currentHeight <= availableHeight || i === 0) {
            // keep it
          } else {
            fits.removeChild(childClone);
            splitPointReached = true;
            
            // Try sub-splitting this child
            if (child.nodeType === 1 && isSplitable(child)) {
              const currentFitsHeight = fits.getBoundingClientRect().height;
              const remainingSpace = availableHeight - currentFitsHeight;
              
              if (remainingSpace > 60) {
                const subSplit = splitNode(child, remainingSpace);
                if (subSplit.fits && subSplit.fits.children.length > 0) {
                  fits.appendChild(subSplit.fits);
                }
                if (subSplit.overflow && subSplit.overflow.childNodes.length > 0) {
                  overflow.appendChild(subSplit.overflow);
                }
                continue;
              }
            }
            
            overflow.appendChild(child.cloneNode(true));
          }
        }
        
        document.body.removeChild(tempContainer);
        return { fits, overflow };
      }

      try {
        const SAFE_INNER_HEIGHT = 1010; // 1123px standard page minus padding buffer
        
        // Ensure there is at least one page wrapper
        let firstPage = root.querySelector('.page');
        if (!firstPage) {
          console.log("[Paginator Debug] Wrapping naked HTML in .page");
          const originalHTML = root.innerHTML;
          root.innerHTML = '<div class="page"><div class="content">' + originalHTML + '</div></div>';
          firstPage = root.querySelector('.page');
        }

        // Add proper styling overrides to pages to allow visible overflow
        root.querySelectorAll('.page').forEach(p => {
          p.style.minHeight = '1123px';
          p.style.height = '1123px';
          p.style.maxHeight = '1123px';
          p.style.overflow = 'visible';
          p.style.boxSizing = 'border-box';
          
          const c = p.querySelector('.content');
          if (c) c.style.overflow = 'visible';
          
          const s = p.querySelector('.layout-sidebar') || p.querySelector('.sidebar');
          if (s) s.style.overflow = 'visible';
          
          const m = p.querySelector('.layout-main') || p.querySelector('.main-column') || p.querySelector('.main');
          if (m) m.style.overflow = 'visible';
        });

        // Loop over pages. Remember new pages can be created dynamically.
        let pageIdx = 0;
        while (pageIdx < root.children.length) {
          const currentPage = root.children[pageIdx];
          
          // Ensure classes are applied
          if (!currentPage.classList.contains('page')) {
            currentPage.classList.add('page');
          }
          
          const cols = getPageColumns(currentPage);
          console.log("[Paginator Debug] Processing Page " + (pageIdx + 1) + " with " + cols.length + " columns.");
          
          let nextPageCreated = false;
          let nextPage = null;
          let nextCols = null;

          cols.forEach((col, colIdx) => {
            const children = Array.from(col.children);
            let overflowStartIndex = -1;
            
            // Check heights by rebuilding column children list
            col.innerHTML = '';
            
            for (let i = 0; i < children.length; i++) {
              const child = children[i];
              col.appendChild(child);
              
              const height = getContainerContentHeight(col);
              console.log("[Paginator Debug] Page " + (pageIdx + 1) + " col " + colIdx + " height after item " + i + ": " + height + "px (limit: " + SAFE_INNER_HEIGHT + "px)");
              
              if (height > SAFE_INNER_HEIGHT) {
                // Orphan/infinite loop defense
                if (i === 0) {
                  console.log("[Paginator Debug] First item overflows page! Retaining to avoid infinite loop.");
                  continue;
                }
                
                col.removeChild(child);
                
                // Check if we can split this item
                if (isSplitable(child)) {
                  const currentFitsHeight = getContainerContentHeight(col);
                  const remainingSpace = SAFE_INNER_HEIGHT - currentFitsHeight;
                  
                  if (remainingSpace > 80) {
                    const splitResult = splitNode(child, remainingSpace);
                    if (splitResult.fits && splitResult.fits.children.length > 0) {
                      col.appendChild(splitResult.fits);
                      children[i] = splitResult.overflow;
                      overflowStartIndex = i;
                      console.log("[Paginator Debug] Successfully split overflowing node.");
                      break;
                    }
                  }
                }
                
                overflowStartIndex = i;
                break;
              }
            }

            // Move any overflowing nodes to next page
            if (overflowStartIndex !== -1) {
              if (!nextPageCreated) {
                console.log("[Paginator Debug] Overflow detected! Creating Page " + (pageIdx + 2));
                nextPage = currentPage.cloneNode(true);
                
                // Cleanup header on non-first page
                const header = nextPage.querySelector('.resume-header') || nextPage.querySelector('.profile-header');
                if (header) {
                  header.remove();
                }
                
                nextCols = getPageColumns(nextPage);
                nextCols.forEach(c => {
                  c.innerHTML = '';
                  c.style.overflow = 'visible';
                });
                nextPageCreated = true;
              }
              
              const targetCol = nextCols[colIdx];
              for (let k = overflowStartIndex; k < children.length; k++) {
                targetCol.appendChild(children[k]);
              }
            }
          });

          if (nextPageCreated && nextPage) {
            currentPage.parentNode.insertBefore(nextPage, currentPage.nextSibling);
            
            // Apply layout styles to newly created page
            nextPage.style.minHeight = '1123px';
            nextPage.style.height = '1123px';
            nextPage.style.maxHeight = '1123px';
            nextPage.style.overflow = 'visible';
            nextPage.style.boxSizing = 'border-box';
          }

          pageIdx++;
        }

        // 5. Update Page Numbers and break indicators
        const pages = root.querySelectorAll('.page');
        pages.forEach((pg, i) => {
          let pageNumEl = pg.querySelector('.page-number');
          if (!pageNumEl) {
            pageNumEl = document.createElement('div');
            pageNumEl.className = 'page-number';
            pageNumEl.style.cssText = 'position: absolute; bottom: 20px; right: 56px; font-size: 9px; font-weight: 600; color: #94a3b8; font-family: sans-serif;';
            pg.appendChild(pageNumEl);
          }
          pageNumEl.textContent = (i + 1) + ' / ' + pages.length;
        });

        // Add visual page-break-indicators
        pages.forEach((pg, i) => {
          pg.querySelectorAll('.page-break-indicator').forEach(el => el.remove());
          if (i < pages.length - 1) {
            const indicator = document.createElement('div');
            indicator.className = 'page-break-indicator';
            indicator.style.top = '1123px'; // Place directly at the bottom boundary of the A4 page
            pg.appendChild(indicator);
          }
        });

        if (window.lucide) window.lucide.createIcons();
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
      
      // Recalculate once fonts are fully ready
      if (document.fonts) {
        document.fonts.ready.then(() => {
          setTimeout(paginate, 200);
        });
      }
      
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
