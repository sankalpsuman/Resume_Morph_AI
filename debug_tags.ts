import fs from 'fs';
const content = fs.readFileSync('src/components/ResumeBuilder.tsx', 'utf8');

const tags = [];
const regex = /<(\/?[a-z0-9]+|AnimatePresence|motion\.[a-z0-9]+)/gi;
let match;

let openDivs = 0;
let closeDivs = 0;

let openMotion = 0;
let closeMotion = 0;

while ((match = regex.exec(content)) !== null) {
    const tag = match[1];
    const tagContent = content.substring(match.index, content.indexOf('>', match.index) + 1);
    const isSelfClosing = tagContent.endsWith('/>');

    if (tag === 'div' && !isSelfClosing) openDivs++;
    if (tag === '/div') closeDivs++;
    if (tag === 'motion.div' && !isSelfClosing) openMotion++;
    if (tag === '/motion.div') closeMotion++;
    
    if (['string', 'number', 'boolean', 'any', 'void', 'File', 'Blob', 'FileData', 'HTMLDivElement', 'HTMLCanvasElement', 'HTMLIFrameElement', 'Star', 'FileText', 'RefreshCw', 'Zap', 'Globe', 'Maximize2', 'Minimize2', 'Layout', 'CheckCircle', 'Download', 'X', 'Sparkles', 'Settings', 'Rocket', 'LogIn', 'Linkedin', 'FileCode', 'FileType', 'ImageIcon', 'MousePointerClick', 'Lock', 'Target', 'Loader2', 'Files', 'ShieldCheck', 'Layers'].includes(tag)) {
        continue;
    }
    if (tag.startsWith('/')) {
        const last = tags.pop();
        console.log(`Popping ${last} because found ${tag} at index ${match.index}. Stack size: ${tags.length}`);
        if (last !== tag.substring(1)) {
            console.log(`Mismatch: expected ${last}, found ${tag} at index ${match.index}`);
            console.log('Context:', content.substring(match.index - 100, match.index + 100));
        }
    } else {
        if (!isSelfClosing) {
            tags.push(tag);
            console.log(`Pushing ${tag} at index ${match.index}. Stack size: ${tags.length}`);
        }
    }
}

if (tags.length > 0) {
    console.log('Unclosed tags (unpopped):', tags);
}
console.log(`Divs: ${openDivs} open, ${closeDivs} closed. Diff: ${openDivs - closeDivs}`);
console.log(`Motion: ${openMotion} open, ${closeMotion} closed. Diff: ${openMotion - closeMotion}`);
