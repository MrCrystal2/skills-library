// Validates the skills-library repository layout so AI skill importers
// (skills CLI, Claude Code plugin marketplace) can ingest every skill.
//
// Public interface:
//   validateSkill(dir)        -> string[]  errors for one skill folder
//   validateSkillsLibrary(root) -> string[] errors for the whole repo (later cycles)

import { readFile, readdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const NAME_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const EXCLUDED_SKILL_REPOS = ['auditmos/brainstormer', 'auditmos/writes'];

export async function validateSkill(dir) {
  const skillMdPath = join(dir, 'SKILL.md');
  let content;
  try {
    content = await readFile(skillMdPath, 'utf8');
  } catch {
    return [`missing SKILL.md in ${dir}`];
  }
  const block = extractFrontmatterBlock(content);
  if (block === null) {
    return ['SKILL.md must start with "---" frontmatter delimiters'];
  }
  let frontmatter;
  try {
    frontmatter = parseYaml(block) ?? {};
  } catch (err) {
    return [`SKILL.md frontmatter is not valid YAML: ${err.message.split('\n')[0]}`];
  }
  const folder = basename(dir);
  const errors = [];
  const { name, description } = frontmatter;
  if (!name || !description) {
    return ['SKILL.md frontmatter must define name and description'];
  }
  if (name !== folder) {
    errors.push(`frontmatter name "${name}" does not match folder name "${folder}"`);
  }
  if (!NAME_PATTERN.test(name)) {
    errors.push(`name "${name}" is not kebab-case`);
  }
  if (name.length > NAME_MAX) {
    errors.push(`name is longer than ${NAME_MAX} chars`);
  }
  if (description.length > DESCRIPTION_MAX) {
    errors.push(`description is longer than ${DESCRIPTION_MAX} chars`);
  }
  return errors;
}

// Extracts the text between the opening and closing "---" delimiters,
// or null when the file has no frontmatter.
function extractFrontmatterBlock(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  return content.slice(4, end);
}

// Validates the whole repository: every skills/<folder>/ passes validateSkill,
// no junk files anywhere under skills/, README links the excluded skill repos,
// and .claude-plugin/marketplace.json lists every skill as an installable plugin.
export async function validateSkillsLibrary(root) {
  const errors = [];
  const skillsDir = join(root, 'skills');
  let entries;
  try {
    entries = await readdir(skillsDir, { withFileTypes: true });
  } catch {
    return [`missing skills/ directory in ${root}`];
  }
  const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);

  for (const folder of folders) {
    const skillErrors = await validateSkill(join(skillsDir, folder));
    errors.push(...skillErrors.map((err) => `${folder}: ${err}`));
  }

  for (const junkPath of await findJunkFiles(skillsDir)) {
    errors.push(`junk file: ${junkPath}`);
  }

  let readme = '';
  try {
    readme = await readFile(join(root, 'README.md'), 'utf8');
  } catch {
    // missing README is reported by the repo-link checks below
  }
  for (const repo of EXCLUDED_SKILL_REPOS) {
    if (!readme.includes(repo)) {
      errors.push(`README.md must link the excluded skill repo ${repo}`);
    }
  }

  let marketplaceOk = false;
  try {
    const manifest = JSON.parse(
      await readFile(join(root, '.claude-plugin', 'marketplace.json'), 'utf8'),
    );
    marketplaceOk = (manifest.plugins ?? []).some((p) => p.source === './');
  } catch {
    // reported below
  }
  if (!marketplaceOk) {
    errors.push('marketplace.json must list a root plugin (source "./") covering skills/');
  }

  try {
    const plugin = JSON.parse(
      await readFile(join(root, '.claude-plugin', 'plugin.json'), 'utf8'),
    );
    if (!plugin.name) errors.push('plugin.json must define a name');
  } catch {
    errors.push('missing or invalid .claude-plugin/plugin.json');
  }

  return errors;
}

function isJunkFile(name) {
  return name === '.DS_Store' || /\.(zip|skill|wfp)$/i.test(name);
}

async function findJunkFiles(dir) {
  const junk = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const entryPath = join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(entryPath);
      } else if (isJunkFile(entry.name)) {
        junk.push(entryPath);
      }
    }
  }
  await walk(dir);
  return junk;
}

const invokedDirectly =
  import.meta.url === pathToFileURL(process.argv[1] ?? '').href;
if (invokedDirectly) {
  const root = process.argv[2] ?? join(import.meta.dirname, '..');
  const errors = await validateSkillsLibrary(root);
  if (errors.length > 0) {
    for (const error of errors) console.log(error);
    process.exit(1);
  }
}
