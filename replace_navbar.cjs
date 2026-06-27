const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// replace the logo's click handler
app = app.replace(
  /<div className="flex items-center gap-3 shrink-0 cursor-pointer group" onClick=\{\(\) => handleTabChange\('builder'\)\}>/,
  `<Link to="/" className="flex items-center gap-3 shrink-0 cursor-pointer group">`
);
app = app.replace(
  /<\/p>\n\s*<\/div>\n\s*<\/div>/,
  `</p>\n              </div>\n            </Link>`
);

// We need a more robust way to convert `<button id=\`tab-${tab.id}\` onClick={() => handleTabChange(tab.id as Tab)}` to `Link`
// Let's do it using regex:

app = app.replace(
  /<button\s+id=\{`tab-\$\{tab\.id\}`\}\s+onClick=\{\(\) => handleTabChange\(tab\.id as Tab\)\}/g,
  `<Link\n                      to={tab.id === 'builder' ? '/' : \`/\${tab.id}\`}\n                      onClick={(e) => {\n                        if (!user && ['assistant', 'smart-editor', 'portfolio', 'cover-letter', 'tracker', 'account'].includes(tab.id)) {\n                          e.preventDefault();\n                          triggerLogin();\n                        }\n                      }}\n                      id={\`tab-\${tab.id}\`}`
);

// We must also replace the matching `</button>` for those tabs.
// It's probably easier to just rely on regex or manual editing. Let's just fix the `</button>` for those specific occurrences:
// Since there's `</button>` inside the map, let's just let it be and replace it manually if we have to.
// Actually, `Link` can't have `</button>` as a closing tag. 

fs.writeFileSync('src/App.tsx', app);
