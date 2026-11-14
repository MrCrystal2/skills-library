// Assumptions encoded by these tests:
// - Skills live at skills/<folder>/SKILL.md; folder names are kebab-case [a-z0-9][a-z0-9-]*
// - Frontmatter must define: name (kebab-case, equal to folder name, <= 64 chars)
//   and description (non-empty, <= 1024 chars)
// - Extra frontmatter fields (argument-hint, disable-model-invocation, metadata, license)
//   are allowed and ignored by the validator
// - No junk files (.DS_Store, *.zip, *.skill) anywhere under skills/
// - README.md must link the two intentionally excluded skills:
//   brainstormer (auditmos/brainstormer) and writes (auditmos/writes)
// - .claude-plugin/marketplace.json must exist and list every skill folder as a plugin
// - NOT tested in this iteration: content quality of the skills themselves,
//   real network installs via `npx skills add`, quirks of third-party importers

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateSkill, validateSkillsLibrary } from './validate.mjs';

async function makeTempDir() {
  return mkdtemp(join(tmpdir(), 'skills-library-test-'));
}

async function makeLibrary(skillFolders = {}, rootFiles = {}) {
  const root = await makeTempDir();
  for (const [folder, files] of Object.entries(skillFolders)) {
    for (const [name, content] of Object.entries(files)) {
      const filePath = join(root, 'skills', folder, name);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, content);
    }
  }
  const allFiles = {
    '.claude-plugin/plugin.json': JSON.stringify({ name: 'skills-library' }),
    ...rootFiles,
  };
  for (const [name, content] of Object.entries(allFiles)) {
    if (content === null) continue; // explicit null = deliberately absent
    const filePath = join(root, name);
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, content);
  }
  return root;
}

const README_WITH_LINKS =
  '# skills-library\nExcluded: [brainstormer](https://github.com/auditmos/brainstormer) and [writes](https://github.com/auditmos/writes).\n';

const MARKETPLACE_ROOT_PLUGIN = JSON.stringify({
  plugins: [{ name: 'skills-library', source: './' }],
});

async function makeSkill(files, folder = 'my-skill') {
  const dir = await makeTempDir();
  const skillDir = join(dir, folder);
  for (const [name, content] of Object.entries(files)) {
    const filePath = join(skillDir, name);
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, content);
  }
  return skillDir;
}

const VALID_SKILL_MD =
  '---\nname: my-skill\ndescription: Does a thing.\n---\n\n# My Skill\n';

test('valid skill folder reports no errors', async () => {
  const dir = await makeSkill({ 'SKILL.md': VALID_SKILL_MD });
  assert.deepEqual(await validateSkill(dir), []);
});

test('missing SKILL.md is reported', async () => {
  const dir = await makeSkill({ 'README.md': '# not a skill\n' });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /SKILL\.md/);
});

test('frontmatter without name is reported', async () => {
  const dir = await makeSkill({
    'SKILL.md': '---\ndescription: Does a thing.\n---\n\n# x\n',
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /name/);
});

test('frontmatter without description is reported', async () => {
  const dir = await makeSkill({
    'SKILL.md': '---\nname: my-skill\n---\n\n# x\n',
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /description/);
});

test('file without frontmatter delimiters is reported', async () => {
  const dir = await makeSkill({
    'SKILL.md': '# just markdown, no frontmatter\n',
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /frontmatter/);
});

test('name differing from folder name is reported', async () => {
  const dir = await makeSkill({
    'SKILL.md': '---\nname: other-name\ndescription: Does a thing.\n---\n',
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /my-skill/);
});

test('name that is not kebab-case is reported', async () => {
  const dir = await makeSkill(
    { 'SKILL.md': '---\nname: My Skill\ndescription: Does a thing.\n---\n' },
    'My Skill',
  );
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /kebab-case/);
});

test('name longer than 64 chars is reported', async () => {
  const longName = 'a'.repeat(65);
  const dir = await makeSkill(
    {
      'SKILL.md': `---\nname: ${longName}\ndescription: Does a thing.\n---\n`,
    },
    longName,
  );
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /64/);
});

test('description longer than 1024 chars is reported', async () => {
  const longDescription = 'x'.repeat(1025);
  const dir = await makeSkill({
    'SKILL.md': `---\nname: my-skill\ndescription: ${longDescription}\n---\n`,
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /1024/);
});

test('block scalar description parses and passes', async () => {
  const dir = await makeSkill({
    'SKILL.md':
      '---\nname: my-skill\ndescription: |\n  Line one.\n  Line two.\n---\n',
  });
  assert.deepEqual(await validateSkill(dir), []);
});

test('extra frontmatter fields are allowed', async () => {
  const dir = await makeSkill({
    'SKILL.md':
      '---\nname: my-skill\ndescription: Does a thing.\nargument-hint: "[area]"\nmetadata:\n  author: someone\n---\n',
  });
  assert.deepEqual(await validateSkill(dir), []);
});

describe('validateSkillsLibrary', () => {
  test('library with one valid skill reports no errors', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD } },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': MARKETPLACE_ROOT_PLUGIN,
      },
    );
    assert.deepEqual(await validateSkillsLibrary(root), []);
  });

  test('junk files under skills/ are reported', async () => {
    const root = await makeLibrary(
      {
        'my-skill': { 'SKILL.md': VALID_SKILL_MD, 'bundle.skill': 'zip' },
        'other-skill': { 'SKILL.md': VALID_SKILL_MD.replace('my-skill', 'other-skill'), '.DS_Store': '' },
      },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': MARKETPLACE_ROOT_PLUGIN,
      },
    );
    const errors = await validateSkillsLibrary(root);
    assert.equal(errors.length, 2);
    assert.match(errors[0], /bundle\.skill/);
    assert.match(errors[1], /\.DS_Store/);
  });

  test('README missing a link to an excluded skill repo is reported', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD } },
      {
        'README.md': '# skills-library\nno links here',
        '.claude-plugin/marketplace.json': MARKETPLACE_ROOT_PLUGIN,
      },
    );
    const errors = await validateSkillsLibrary(root);
    assert.equal(errors.length, 2);
    assert.ok(errors.some((e) => /brainstormer/.test(e)));
    assert.ok(errors.some((e) => /writes/.test(e)));
  });

  test('marketplace.json without a root plugin entry is reported', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD } },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': JSON.stringify({
          plugins: [{ name: 'elsewhere', source: './elsewhere' }],
        }),
      },
    );
    const errors = await validateSkillsLibrary(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /marketplace\.json/);
  });

  test('missing plugin.json is reported', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD } },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': JSON.stringify({
          plugins: [{ name: 'skills-library', source: './' }],
        }),
        '.claude-plugin/plugin.json': null,
      },
    );
    const errors = await validateSkillsLibrary(root);
    assert.equal(errors.length, 1);
    assert.match(errors[0], /plugin\.json/);
  });
});

test('the real repository passes full validation', async () => {
  const repoRoot = join(import.meta.dirname, '..');
  assert.deepEqual(await validateSkillsLibrary(repoRoot), []);
});

describe('CLI', () => {
  test('exits 0 on a valid library', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD } },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': MARKETPLACE_ROOT_PLUGIN,
      },
    );
    const cli = join(import.meta.dirname, 'validate.mjs');
    const result = spawnSync(process.execPath, [cli, root]);
    assert.equal(result.status, 0);
  });

  test('exits 1 and prints errors on a broken library', async () => {
    const root = await makeLibrary(
      { 'my-skill': { 'SKILL.md': VALID_SKILL_MD, 'trash.zip': '' } },
      {
        'README.md': README_WITH_LINKS,
        '.claude-plugin/marketplace.json': MARKETPLACE_ROOT_PLUGIN,
      },
    );
    const cli = join(import.meta.dirname, 'validate.mjs');
    const result = spawnSync(process.execPath, [cli, root]);
    assert.equal(result.status, 1);
    assert.match(result.stdout.toString(), /trash\.zip/);
  });
});

test('frontmatter that strict YAML rejects is reported', async () => {
  const dir = await makeSkill({
    'SKILL.md':
      '---\nname: my-skill\ndescription: Does a thing.\nargument-hint: [opis zmiany | #issue]\n---\n',
  });
  const errors = await validateSkill(dir);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /YAML/);
});
