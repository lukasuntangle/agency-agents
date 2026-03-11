#!/usr/bin/env node
/**
 * transform-agents.js
 *
 * Transforms verbose agent definitions into lean, actionable formats.
 * Target: 40-50% reduction in line count.
 *
 * Usage: node scripts/transform-agents.js [--dry-run] [--file <path>] [--preview <path>]
 */

const fs = require('fs');
const path = require('path');

const AGENT_DIRS = [
  'design', 'engineering', 'game-development', 'marketing', 'paid-media',
  'product', 'project-management', 'spatial-computing', 'specialized',
  'strategy', 'support', 'testing'
];

// Sections to remove entirely (filler content)
const SECTIONS_TO_REMOVE = [
  // Identity & Memory - filler
  /^#{2,3}\s*(?:🧠\s*)?(?:Your )?Identity (?:& |and )?Memory[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
  // Communication Style - filler
  /^#{2,3}\s*(?:💭\s*)?(?:Your )?Communication Style[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
  // Learning & Memory - fake, LLMs don't remember
  /^#{2,3}\s*(?:🔄\s*)?(?:Learning (?:& |and )?Memory|Build Expertise In)[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
  // Success Metrics - unmeasurable fantasy
  /^#{2,3}\s*(?:🎯\s*)?(?:Your )?Success Metrics[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
  // Advanced Capabilities - usually repeats core mission
  /^#{2,3}\s*(?:🚀\s*)?Advanced Capabilities[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
  // Pattern Recognition subsection
  /^#{3}\s*Pattern Recognition[\s\S]*?(?=^#{2,3}\s|$(?![\s\S]))/gim,
  // Workflow Process when generic
  /^#{2,3}\s*(?:🔄\s*)?(?:Your )?Workflow Process[\s\S]*?(?=^#{2}\s|\n#{2}\s|$(?![\s\S]))/gim,
];

// Section header rewrites (remove emojis, simplify)
const HEADER_REWRITES = [
  [/^##\s*🎯\s*(?:Your )?Core Mission\s*$/gm, '## Do'],
  [/^##\s*🚨\s*(?:Critical Rules|Your Mandatory Process|Rules You Must Follow).*$/gm, '## Rules'],
  [/^##\s*📋\s*(?:Your )?(?:Technical )?Deliverables?.*$/gm, '## Output'],
  [/^##\s*📋\s*Your [\w\s]+ Template\s*$/gm, '## Output'],
  [/^##\s*(?:🔍|🚫|📊|🔄|📸|🧪)\s*/gm, '## '],
  [/^###\s*(?:🎯|📋|🔍|⚡|♿|🎨)\s*/gm, '### '],
];

// Entire lines/paragraphs to remove
const PATTERNS_TO_REMOVE = [
  // Default requirement lines
  /^-?\s*\*\*Default requirement\*\*:.*$/gm,
  // Instructions Reference footer
  /^\*\*Instructions Reference\*\*:.*$/gm,
  /^---\s*\n\*\*Instructions Reference\*\*:[\s\S]*$/gm,
  // Trailing agent signature blocks
  /^---\s*\n\*\*[\w\s]+\*\*:\s*[\w\s]+\n\*\*[\w\s]+\*\*:.*$/gm,
  // Remember and build expertise lists
  /^Remember and build expertise in:[\s\S]*?(?=^#{2,3}\s|^-\s|$(?![\s\S]))/gm,
  // "You're successful when" lists
  /^You're successful when:[\s\S]*?(?=^#{2,3}\s|$(?![\s\S]))/gm,
  // Verbose intro paragraphs that just repeat the name
  /^You are \*\*[\w\s]+\*\*,\s*(?:a|an|the)\s+[\w\s,]+(?:who|that)\s+[\w\s,]+\.\s*/gm,
];

// Compress verbose bullet points (only outside code blocks)
const BULLET_COMPRESSIONS = [
  // Remove "Be X: " prefixes in communication style
  [/^-\s*\*\*Be \w+\*\*:\s*"/gm, '- '],
];

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { frontmatter: {}, body: content };

  const frontmatterStr = match[1];
  const frontmatter = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      frontmatter[key] = value;
    }
  }

  const body = content.slice(match[0].length).trim();
  return { frontmatter, body };
}

function generateTriggers(name, description) {
  const triggers = [];
  const nameLower = name.toLowerCase();

  // Add name as primary trigger
  triggers.push(nameLower);

  // Add short form if name has multiple words
  const words = nameLower.split(/[\s-]+/);
  if (words.length >= 2) {
    triggers.push(words.slice(-1)[0]); // Last word often most specific
  }

  return [...new Set(triggers)].slice(0, 3);
}

function extractAntiPatterns(body) {
  const antiPatterns = [];

  // Look for "never", "don't", "avoid" patterns
  const neverPatterns = body.match(/never\s+[^.!?\n]{10,80}[.!?]?/gi) || [];
  const dontPatterns = body.match(/(?:don't|do not)\s+[^.!?\n]{10,80}[.!?]?/gi) || [];
  const avoidPatterns = body.match(/avoid\s+[^.!?\n]{10,80}[.!?]?/gi) || [];

  const allPatterns = [...neverPatterns, ...dontPatterns, ...avoidPatterns];

  for (const p of allPatterns.slice(0, 4)) {
    let cleaned = p
      .replace(/^(never|don't|do not|avoid)\s+/i, '')
      .replace(/[.!?]$/, '')
      .trim();

    if (cleaned.length > 15 && cleaned.length < 80) {
      antiPatterns.push(cleaned.charAt(0).toUpperCase() + cleaned.slice(1));
    }
  }

  return [...new Set(antiPatterns)];
}

function extractEscalationPoints(body) {
  const escalations = [];

  // Look for escalation indicators
  const patterns = [
    /escalate\s+(?:to|when)\s+[^.!?\n]+/gi,
    /bring in\s+[^.!?\n]+/gi,
    /requires?\s+(?:human|manual|senior)\s+[^.!?\n]+/gi,
    /when\s+(?:unclear|uncertain|complex)\s*[,:]?\s*[^.!?\n]+/gi,
  ];

  for (const pattern of patterns) {
    const matches = body.match(pattern) || [];
    escalations.push(...matches.map(m => m.trim()));
  }

  return escalations.slice(0, 3);
}

function compressCodeBlocks(body) {
  // Keep code blocks but remove excessive comments
  return body.replace(/```[\s\S]*?```/g, (codeBlock) => {
    const lines = codeBlock.split('\n');
    const compressed = lines.filter(line => {
      // Remove comment-only lines that are just filler
      if (/^\s*\/\/\s*[-=]+\s*$/.test(line)) return false;
      if (/^\s*\/\/\s*$/.test(line)) return false;
      if (/^\s*#\s*[-=]+\s*$/.test(line)) return false;
      return true;
    });
    return compressed.join('\n');
  });
}

function transformAgent(content) {
  let { frontmatter, body } = extractFrontmatter(content);

  // Add triggers to frontmatter
  if (frontmatter.name && frontmatter.description) {
    frontmatter.triggers = generateTriggers(frontmatter.name, frontmatter.description);
  }

  // Remove vibe (LinkedIn fluff)
  delete frontmatter.vibe;

  // Remove filler sections
  for (const pattern of SECTIONS_TO_REMOVE) {
    body = body.replace(pattern, '\n');
  }

  // Remove filler patterns
  for (const pattern of PATTERNS_TO_REMOVE) {
    body = body.replace(pattern, '');
  }

  // Rewrite headers
  for (const [pattern, replacement] of HEADER_REWRITES) {
    body = body.replace(pattern, replacement);
  }

  // Compress bullet points
  for (const [pattern, replacement] of BULLET_COMPRESSIONS) {
    body = body.replace(pattern, replacement);
  }

  // Compress code blocks
  body = compressCodeBlocks(body);

  // Extract anti-patterns for Don't section
  const antiPatterns = extractAntiPatterns(body);

  // Extract escalation points
  const escalations = extractEscalationPoints(body);

  // Clean up the title
  body = body.replace(/^#\s*[\w\s]+Agent Personality\s*\n/m, (match) => {
    return `# ${frontmatter.name}\n`;
  });

  // Simplify verbose opening
  body = body.replace(
    /^(# [\w\s]+)\n+You are \*\*[\w\s]+\*\*,?\s*(?:a |an |the )?(?:senior |expert |specialist )?[\w\s,]+(?:who |that |specializing )/m,
    '$1\n\n'
  );

  // Clean up multiple blank lines
  body = body.replace(/\n{3,}/g, '\n\n');

  // Build Don't section if we found anti-patterns
  let dontSection = '';
  if (antiPatterns.length > 0) {
    dontSection = '\n## Don\'t\n\n' + antiPatterns.map(p => `- ${p}`).join('\n') + '\n';
  }

  // Build Escalate section if found
  let escalateSection = '';
  if (escalations.length > 0) {
    escalateSection = '\n## Escalate When\n\n' + escalations.map(e => `- ${e}`).join('\n') + '\n';
  }

  // Insert sections after Rules (or at end)
  if (dontSection || escalateSection) {
    const rulesMatch = body.match(/^## Rules[\s\S]*?(?=^## |\n## |$(?![\s\S]))/m);
    if (rulesMatch) {
      const insertPoint = rulesMatch.index + rulesMatch[0].length;
      body = body.slice(0, insertPoint) + dontSection + escalateSection + body.slice(insertPoint);
    } else {
      body = body + dontSection + escalateSection;
    }
  }

  // Final cleanup
  body = body.replace(/\n{3,}/g, '\n\n').trim();

  // Rebuild frontmatter
  let newFrontmatter = '---\n';
  newFrontmatter += `name: ${frontmatter.name}\n`;
  newFrontmatter += `description: ${frontmatter.description}\n`;
  if (frontmatter.color) newFrontmatter += `color: ${frontmatter.color}\n`;
  if (frontmatter.emoji) newFrontmatter += `emoji: ${frontmatter.emoji}\n`;
  if (frontmatter.triggers && frontmatter.triggers.length > 0) {
    newFrontmatter += 'triggers:\n';
    for (const t of frontmatter.triggers) {
      newFrontmatter += `  - "${t}"\n`;
    }
  }
  newFrontmatter += '---\n';

  return newFrontmatter + '\n' + body + '\n';
}

function processFile(filePath, dryRun = false, preview = false) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Skip non-agent files (no frontmatter)
  if (!content.startsWith('---')) {
    console.log(`SKIP: ${filePath} (no frontmatter)`);
    return { skipped: true };
  }

  const originalLines = content.split('\n').length;
  const transformed = transformAgent(content);
  const newLines = transformed.split('\n').length;
  const reduction = Math.round((1 - newLines / originalLines) * 100);

  if (preview) {
    console.log('='.repeat(60));
    console.log(`PREVIEW: ${filePath}`);
    console.log(`Lines: ${originalLines} → ${newLines} (-${reduction}%)`);
    console.log('='.repeat(60));
    console.log(transformed);
    console.log('='.repeat(60));
    return { originalLines, newLines, reduction };
  }

  if (dryRun) {
    console.log(`DRY-RUN: ${path.relative(process.cwd(), filePath)}`);
    console.log(`  Lines: ${originalLines} → ${newLines} (-${reduction}%)`);
  } else {
    fs.writeFileSync(filePath, transformed);
    console.log(`UPDATED: ${path.relative(process.cwd(), filePath)} (${originalLines} → ${newLines}, -${reduction}%)`);
  }

  return { originalLines, newLines, reduction };
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const previewIdx = args.indexOf('--preview');
  const fileIdx = args.indexOf('--file');

  const previewFile = previewIdx >= 0 ? args[previewIdx + 1] : null;
  const singleFile = fileIdx >= 0 ? args[fileIdx + 1] : null;

  const repoRoot = path.resolve(__dirname, '..');
  process.chdir(repoRoot);

  let files = [];

  if (previewFile) {
    const result = processFile(path.resolve(repoRoot, previewFile), false, true);
    return;
  }

  if (singleFile) {
    files = [path.resolve(repoRoot, singleFile)];
  } else {
    for (const dir of AGENT_DIRS) {
      const dirPath = path.join(repoRoot, dir);
      if (!fs.existsSync(dirPath)) continue;

      const findFiles = (d) => {
        const entries = fs.readdirSync(d, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(d, entry.name);
          if (entry.isDirectory()) {
            findFiles(fullPath);
          } else if (entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      };
      findFiles(dirPath);
    }
  }

  console.log(`\nTransforming ${files.length} agent files${dryRun ? ' (DRY RUN)' : ''}...\n`);

  let totalOriginal = 0;
  let totalNew = 0;
  let processed = 0;

  for (const file of files) {
    const result = processFile(file, dryRun);
    if (!result.skipped) {
      totalOriginal += result.originalLines;
      totalNew += result.newLines;
      processed++;
    }
  }

  const totalReduction = Math.round((1 - totalNew / totalOriginal) * 100);

  console.log(`\n${'='.repeat(50)}`);
  console.log(`SUMMARY: ${processed} files processed`);
  console.log(`Total lines: ${totalOriginal} → ${totalNew} (-${totalReduction}%)`);

  if (dryRun) {
    console.log(`\nRun without --dry-run to apply changes.`);
  }
}

main();
