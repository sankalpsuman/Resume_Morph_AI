
const fs = require('fs');
const content = fs.readFileSync('src/components/ResumeBuilder.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let mainBlock = [];
let inMain = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const lineNum = i + 1;
  
  if (line.includes('<main')) {
    inMain = true;
  }
  
  if (inMain) {
    // Very naive tag finder
    const tags = line.match(/<[a-zA-Z!/][^>]*>/g) || [];
    for (const tag of tags) {
      if (tag.startsWith('</')) {
        const tagName = tag.substring(2, tag.length - 1).split(' ')[0];
        if (stack.length > 0) {
          const top = stack.pop();
          if (top.name !== tagName) {
            console.log(`Mismatch at line ${lineNum}: expected </${top.name}> but found ${tag}`);
          }
        } else {
          console.log(`Unexpected closing tag at line ${lineNum}: ${tag}`);
        }
      } else if (tag.endsWith('/>')) {
        // self closing, ignore
      } else if (tag.startsWith('<!--')) {
         // comment
      } else {
        const tagName = tag.substring(1, tag.length - 1).split(' ')[0];
        if (!['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tagName.toLowerCase())) {
           stack.push({ name: tagName, line: lineNum });
        }
      }
    }
  }
  
  if (line.includes('</main>')) {
    inMain = false;
    break;
  }
}

console.log('Final stack:', stack);
