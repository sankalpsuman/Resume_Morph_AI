const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The mobile menu mainTabs
app = app.replace(
  /<button\n\s*key=\{item.id\}\n\s*onClick=\{\(\) => \{ handleTabChange\(item\.id as Tab\); setIsMenuOpen\(false\); \}\}/g,
  `<Link
                          key={item.id}
                          to={item.id === 'builder' ? '/' : \`/\${item.id}\`}
                          onClick={(e) => { 
                            if (isLocked) {
                              e.preventDefault();
                              triggerLogin();
                            } else {
                              setIsMenuOpen(false); 
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}`
);

// The mobile menu resourceTabs
app = app.replace(
  /<button\n\s*key=\{item\.id\}\n\s*onClick=\{\(\) => \{ handleTabChange\(item\.id as Tab\); setIsMenuOpen\(false\); \}\}/g,
  `<Link
                        key={item.id}
                        to={item.id === 'builder' ? '/' : \`/\${item.id}\`}
                        onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}`
);

// Explicit Resources Hub in mobile
app = app.replace(
  /<button\n\s*onClick=\{\(\) => \{ handleTabChange\('resources'\); setIsMenuOpen\(false\); \}\}/g,
  `<Link
                      to="/resources"
                      onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}`
);

// My Account Details in mobile
app = app.replace(
  /<button\n\s*onClick=\{\(\) => \{ handleTabChange\('account'\); setIsMenuOpen\(false\); \}\}/g,
  `<Link
                    to="/account"
                    onClick={() => { setIsMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}`
);

// Also we need to replace the `</button>` matching these tags.
// Since these are isolated in the mobile menu, we can just replace `</button>` with `</Link>` in the mobile menu section.
// Actually, it's safer to just replace all `</button>` in that exact region. But the simplest is:
app = app.replace(/<Lock className="w-4 h-4 text-zinc-400" \/>\n\s*<\/button>/g, '<Lock className="w-4 h-4 text-zinc-400" />\n                        </Link>');
app = app.replace(/\{item.label\}\n\s*<\/button>/g, '{item.label}\n                      </Link>');
app = app.replace(/Resources Hub\n\s*<\/button>/g, 'Resources Hub\n                    </Link>');
app = app.replace(/My Account Details\n\s*<\/button>/g, 'My Account Details\n                  </Link>');

// Now for the Desktop Resource Dropdown
app = app.replace(
  /<button\n\s*key=\{item\.id\}\n\s*onClick=\{\(\) => handleTabChange\(item\.id as Tab\)\}/g,
  `<Link
                            key={item.id}
                            to={item.id === 'builder' ? '/' : \`/\${item.id}\`}
                            onClick={() => { setIsResourcesOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}`
);
app = app.replace(/<\/p>\n\s*<\/div>\n\s*<\/button>/g, '</p>\n                            </div>\n                          </Link>');

// Replace Creator profile in Desktop Resource Dropdown
app = app.replace(
  /<button\n\s*onClick=\{\(\) => \{ window\.dispatchEvent\(new CustomEvent\('open-creator-about'\)\); setIsResourcesOpen\(false\); \}\}/g,
  `<button
                          onClick={() => { window.dispatchEvent(new CustomEvent('open-creator-about')); setIsResourcesOpen(false); }}`
); // Leave this one as a button since it triggers a modal via event, NOT a route change.

// Wait, there's another account dropdown?
app = app.replace(
  /<button\n\s*onClick=\{\(\) => handleTabChange\('account'\)\}\n\s*className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-\[var\(--bg-secondary\)\] transition-all group"/g,
  `<Link
                          to="/account"
                          onClick={() => { setIsUserDropdownOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[var(--bg-secondary)] transition-all group"`
);
// And its closing tag
app = app.replace(/My Account\n\s*<\/button>/g, 'My Account\n                        </Link>');

fs.writeFileSync('src/App.tsx', app);
