const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// Replace mobile bottom nav buttons (around line 1575)
const mobileBottomNavRegex = /<button[\s\S]*?onClick=\{\(\) => handleTabChange\(item\.id as Tab\)\}[\s\S]*?className=\{cn\([\s\S]*?"flex flex-col items-center justify-center w-full h-full space-y-1 relative z-10 transition-colors"[\s\S]*?\)\}[\s\S]*?>([\s\S]*?)<\/button>/g;
app = app.replace(mobileBottomNavRegex, (match, inner) => {
  return `<Link
                  key={item.id}
                  id={\`mobile-tab-\${item.id}\`}
                  to={item.id === 'builder' ? '/' : \`/\${item.id}\`}
                  onClick={(e) => {
                    if (isLocked) {
                      e.preventDefault();
                      triggerLogin();
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className={cn(
                    "flex flex-col items-center justify-center w-full h-full space-y-1 relative z-10 transition-colors",
                    isActive ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]",
                    isLocked && "opacity-50"
                  )}
                >${inner}</Link>`.replace(/key=\{item\.id\}\n\s*id=\{`mobile-tab-\$\{item\.id\}`\}\n\s*to=/g, 'to='); // Wait, key and id are already on the outer element? Ah, the original had key={item.id} on the button!
});

// Since the regex might be tricky, let's just do exact string replacements.

fs.writeFileSync('src/App.tsx', app);
