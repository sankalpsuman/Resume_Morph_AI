const fs = require('fs');
let code = fs.readFileSync('src/components/Resources.tsx', 'utf8');

// Replace button with Link for resource cards
code = code.replace(
  /<button\n\s*key=\{card\.id\}\n\s*onClick=\{\(\) => onTabChange\(card\.id\)\}/g,
  `<Link
              key={card.id}
              to={card.id === 'builder' ? '/' : \`/\${card.id}\`}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}`
);
code = code.replace(/<\/p>\n\s*<\/div>\n\s*<\/button>/g, '</p>\n            </div>\n          </Link>');

// Replace quick links
code = code.replace(
  /<button\n\s*key=\{link\.id\}\n\s*onClick=\{\(\) => \['privacy', 'guide', 'feedback', 'contact'\]\.includes\(link\.id\) \? onTabChange\(link\.id\) : null\}/g,
  `<Link
                  key={link.id}
                  to={['privacy', 'guide', 'feedback', 'contact'].includes(link.id) ? \`/\${link.id}\` : '#'}
                  onClick={(e) => {
                    if (!['privacy', 'guide', 'feedback', 'contact'].includes(link.id)) e.preventDefault();
                    else window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}`
);
code = code.replace(/\{link\.label\}\n\s*<\/button>/g, '{link.label}\n                </Link>');

// Replace feedback button at bottom
code = code.replace(
  /<button\n\s*onClick=\{\(\) => onTabChange\('feedback'\)\}\n\s*className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500\/20"\n\s*>\n\s*Submit Feedback\n\s*<\/button>/g,
  `<Link
            to="/feedback"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/20"
          >
            Submit Feedback
          </Link>`
);

// Add import Link if not present
if (!code.includes("import { Link")) {
  code = code.replace("import React", "import { Link } from 'react-router-dom';\nimport React");
}

fs.writeFileSync('src/components/Resources.tsx', code);
