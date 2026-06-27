const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf8');

// replace ai-assistant with assistant
app = app.replace(/'ai-assistant'/g, "'assistant'");
app = app.replace(/id: 'ai-assistant'/g, "id: 'assistant'");
app = app.replace(/activeTab === 'ai-assistant'/g, "activeTab === 'assistant'");

// replace help-center with help
app = app.replace(/'help-center'/g, "'help'");
app = app.replace(/id: 'help-center'/g, "id: 'help'");
app = app.replace(/activeTab === 'help-center'/g, "activeTab === 'help'");

// Now, rewrite the footer section to use React Router Link
// We need to replace the footer button rendering block with Link
// Let's find the footer group map

const footerButtonRegex = /<button[\s\n]*onClick=\{\(\) => handleTabChange\(link\.id as Tab\)\}[\s\n]*className="text-xs font-semibold text-\[var\(--text-secondary\)\] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left sm:text-left inline-block"[\s\n]*>[\s\n]*\{link\.label\}[\s\n]*<\/button>/gm;

const linkReplacement = `<Link
                          to={link.id === 'builder' ? '/' : \`/\${link.id}\`}
                          onClick={(e) => {
                            const protectedTabs = ['assistant', 'smart-editor', 'portfolio', 'cover-letter', 'tracker', 'account'];
                            if (!user && protectedTabs.includes(link.id)) {
                              e.preventDefault();
                              triggerLogin();
                            } else {
                              setIsMenuOpen(false);
                              setIsResourcesOpen(false);
                              setIsUserDropdownOpen(false);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          className="text-xs font-semibold text-[var(--text-secondary)] hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left sm:text-left inline-block"
                        >
                          {link.label}
                        </Link>`;

app = app.replace(footerButtonRegex, linkReplacement);

// Make sure Link is imported
if (!app.includes("import { Link")) {
  app = app.replace("import { useLocation, useNavigate } from 'react-router-dom';", "import { useLocation, useNavigate, Link } from 'react-router-dom';");
}

fs.writeFileSync('src/App.tsx', app);
