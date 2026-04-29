/**
 * Token-Oriented Object Notation (TOON)
 * A lightweight, token-efficient format for LLM communication.
 * Designed to reduce overhead of braces, quotes, and repetitive keys.
 */

export const TOON = {
  /**
   * System instruction for AI to understand TOON.
   */
  getSystemInstruction(): string {
    return `
TOKEN-ORIENTED OBJECT NOTATION (TOON) SPECIFICATION:
- Objects are enclosed in [TAG]...[/TAG].
- Fields are K:V pairs separated by | or ;.
- Arrays use - prefix or nested [ITEM] blocks.
- Keys are often shortened (e.g., n=name, c=company).
- Minimal use of quotes.
- Example: [RESUME]n:John Doe|e:j@j.com|exp:[ITEM]c:Google|r:SWE[/ITEM][/RESUME]`;
  },

  /**
   * Converts a JSON object to TOON string.
   */
  stringify(obj: any, tag: string = 'DATA'): string {
    if (obj === null || obj === undefined) return '';
    if (typeof obj !== 'object') return String(obj);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return `[${tag}][/${tag}]`;
      const items = obj.map(item => {
        if (typeof item === 'object') {
          return this.stringify(item, 'ITEM');
        }
        // Escape special characters instead of just replacing them
        return String(item).replace(/[|[\]~]/g, '\\$&');
      }).join('~');
      return `[${tag}]${items}[/${tag}]`;
    }

    const pairs = Object.entries(obj)
      .map(([k, v]) => {
        const shortKey = this.shortenKey(k);
        if (v === null || v === undefined) return null;
        if (typeof v === 'object') {
          return `${shortKey}:${this.stringify(v, k.toUpperCase())}`;
        }
        // Escape characters used by TOON structure
        return `${shortKey}:${String(v).replace(/[|:[\]~]/g, '\\$&')}`;
      })
      .filter(Boolean)
      .join('|');

    return `[${tag}]${pairs}[/${tag}]`;
  },

  /**
   * Shortens common keys to save tokens.
   */
  shortenKey(key: string): string {
    const map: Record<string, string> = {
      name: 'n',
      company: 'c',
      role: 'r',
      dates: 'd',
      location: 'l',
      bullets: 'b',
      description: 'desc',
      tech: 't',
      link: 'lnk',
      school: 's',
      degree: 'deg',
      year: 'y',
      title: 'ti',
      email: 'e',
      phone: 'p',
      summary: 'sum',
      experience: 'exp',
      projects: 'proj',
      education: 'edu',
      skills: 'sk',
      personalInfo: 'pi',
      certifications: 'cert',
      customSections: 'cs',
      content: 'cont',
      items: 'its',
      links: 'links',
      linkedin: 'li',
      github: 'gh',
      portfolio: 'port',
      address: 'addr',
      city: 'city',
      state: 'st',
      zip: 'zip',
      country: 'cntry',
      highlights: 'hl',
      responsibilities: 'resp',
      achievements: 'ach',
      keyword: 'kw',
    };
    return map[key] || key;
  },

  /**
   * Expands shortened keys back to full JSON keys.
   */
  expandKey(key: string): string {
    const map: Record<string, string> = {
      n: 'name',
      c: 'company',
      r: 'role',
      d: 'dates',
      l: 'location',
      b: 'bullets',
      desc: 'description',
      t: 'tech',
      lnk: 'link',
      s: 'school',
      deg: 'degree',
      y: 'year',
      ti: 'title',
      e: 'email',
      p: 'phone',
      sum: 'summary',
      exp: 'experience',
      proj: 'projects',
      edu: 'education',
      sk: 'skills',
      pi: 'personalInfo',
      cert: 'certifications',
      cs: 'customSections',
      cont: 'content',
      its: 'items',
      li: 'linkedin',
      gh: 'github',
      port: 'portfolio',
      addr: 'address',
      st: 'state',
      cntry: 'country',
      hl: 'highlights',
      resp: 'responsibilities',
      ach: 'achievements',
      kw: 'keyword',
    };
    return map[key.toLowerCase()] || key;
  },

  /**
   * Basic TOON to JSON parser.
   */
  parse(toon: string): any {
    if (!toon) return null;
    const trimmed = toon.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // Fall through to TOON parsing
      }
    }

    try {
      return this.recursiveParse(trimmed);
    } catch (e) {
      console.warn('TOON Parse failed, returning raw string', e);
      return toon;
    }
  },

  /**
   * Validates that the object has the minimum required resume structure.
   */
  validateResumeData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    // Very loose validation to ensure we don't block valid but sparse data
    // but strict enough to know it's a resume object
    const hasPI = !!(data.personalInfo || data.pi);
    const hasExp = Array.isArray(data.experience) || Array.isArray(data.exp);
    const hasSkills = Array.isArray(data.skills) || Array.isArray(data.sk);
    
    return hasPI || hasExp || hasSkills;
  },

  recursiveParse(text: string): any {
    // Helper to unescape characters
    const unescape = (s: string) => s.replace(/\\([|[\]:~])/g, '$1');

    // Extract top level tags [TAG]...[/TAG]
    const tagRegex = /\[(\w+)\]([\s\S]*?)\[\/\1\]/g;
    const matches = [...text.matchAll(tagRegex)];

    if (matches.length > 0) {
      const result: any = {};
      const arrayItems: any[] = [];

      for (const match of matches) {
        const tagName = match[1];
        const content = match[2];

        if (tagName === 'ITEM') {
          arrayItems.push(this.recursiveParse(content));
          continue;
        }

        const expandedTag = this.expandKey(tagName.toLowerCase());
        
        if (content.includes('[') && content.includes(']')) {
          const parsed = this.recursiveParse(content);
          if (expandedTag === 'experience' || expandedTag === 'projects' || expandedTag === 'education' || expandedTag === 'customsections' || expandedTag === 'bullets') {
             result[expandedTag] = Array.isArray(parsed) ? parsed : [parsed];
          } else {
             result[expandedTag] = parsed;
          }
        } else if (content.includes('~')) {
          result[expandedTag] = content.split('~').map(s => unescape(s.trim()));
        } else if (content.includes('|')) {
          const obj: any = {};
          // Improved pair splitting that respects escaped characters
          // For simplicity, we split by | but only if not preceded by \
          const pairs = this.splitIgnoringEscaped(content, '|');
          pairs.forEach(pair => {
            const separatorIndex = this.findUnescapedIndex(pair, ':');
            if (separatorIndex !== -1) {
              const k = pair.substring(0, separatorIndex).trim();
              const v = pair.substring(separatorIndex + 1).trim();
              const expandedK = this.expandKey(k);
              if (v.includes('~')) {
                obj[expandedK] = this.splitIgnoringEscaped(v, '~').map(s => unescape(s.trim()));
              } else {
                obj[expandedK] = unescape(v);
              }
            }
          });
          if (result[expandedTag]) {
            if (Array.isArray(result[expandedTag])) result[expandedTag].push(obj);
            else result[expandedTag] = [result[expandedTag], obj];
          } else {
            result[expandedTag] = obj;
          }
        } else {
          result[expandedTag] = unescape(content);
        }
      }

      if (arrayItems.length > 1) return arrayItems;
      if (arrayItems.length === 1) return arrayItems[0];
      
      // If we only have entries that match the standard resume structure but they aren't tagged, 
      // recursiveParse might have put them in 'result'.
      return result;
    }

    // Try to parse K:V if no tags but | exists
    if (text.includes('|') && text.includes(':')) {
       const obj: any = {};
       const pairs = this.splitIgnoringEscaped(text, '|');
       pairs.forEach(pair => {
         const separatorIndex = this.findUnescapedIndex(pair, ':');
         if (separatorIndex !== -1) {
           const k = pair.substring(0, separatorIndex).trim();
           const v = pair.substring(separatorIndex + 1).trim();
           obj[this.expandKey(k)] = unescape(v);
         }
       });
       return obj;
    }

    return unescape(text);
  },

  splitIgnoringEscaped(text: string, char: string): string[] {
    const result: string[] = [];
    let current = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === char && (i === 0 || text[i-1] !== '\\')) {
        result.push(current);
        current = '';
      } else {
        current += text[i];
      }
    }
    result.push(current);
    return result;
  },

  findUnescapedIndex(text: string, char: string): number {
    for (let i = 0; i < text.length; i++) {
      if (text[i] === char && (i === 0 || text[i-1] !== '\\')) {
        return i;
      }
    }
    return -1;
  }
};
