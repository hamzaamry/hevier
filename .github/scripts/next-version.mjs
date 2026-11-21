#!/usr/bin/env node
// Decides the next version from the commits since the last release, for
// .github/workflows/release.yml. The rules are in CONTRIBUTING.md → Releases.
//
// Run it locally to see what the next release would be:
//   node scripts/next-version.mjs
//
// In CI it also writes the decision to $GITHUB_OUTPUT:
//   released=true|false, tag=v1.2.3, version=1.2.3, notes=<release body>

import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';

const STABLE_TAG = /^v(\d+)\.(\d+)\.(\d+)$/;
const SUBJECT = /^(feat|fix|perf|revert|refactor|docs|test|build|ci|chore|style)(\([^)]+\))?(!)?: (.+)$/;

const PATCH_TYPES = new Set(['fix', 'perf', 'revert']);
const FEATURE_TYPES = new Set(['feat']);

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

const output = process.env.GITHUB_OUTPUT;

function set(name, value) {
  if (output) appendFileSync(output, `${name}=${value}\n`);
  console.log(`${name}=${value}`);
}

function setNotes(notes) {
  if (!output) return;
  appendFileSync(output, `notes<<RELEASE_NOTES\n${notes}\nRELEASE_NOTES\n`);
}

function summary(line) {
  console.log(line);
  if (process.env.GITHUB_STEP_SUMMARY) {
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${line}\n`);
  }
}

// Tags reachable from HEAD, highest first. A tag on another branch is not a
// release of this line of work.
const tags = git('tag', '--merged', 'HEAD', '--list', 'v*', '--sort=-v:refname')
  .split('\n')
  .filter((tag) => STABLE_TAG.test(tag));

const latest = tags[0] ?? null;
const atHead = git('tag', '--points-at', 'HEAD', '--list', 'v*')
  .split('\n')
  .find((tag) => STABLE_TAG.test(tag));

// A re-run of the release workflow for the same commit: keep its tag.
if (atHead) {
  set('released', 'true');
  set('tag', atHead);
  set('version', atHead.slice(1));
  setNotes('');
  summary(`### Re-run: keeping ${atHead}`);
  process.exit(0);
}

const range = latest ? `${latest}..HEAD` : 'HEAD';
const commits = execFileSync('git', ['log', range, '--format=%s%x1f%b%x1e'], {
  encoding: 'utf8',
})
  .split('\x1e')
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => {
    const [subject, body = ''] = entry.split('\x1f');
    const match = SUBJECT.exec(subject);
    // The "Revert" button on GitHub writes `Revert "feat: ..."`.
    const type = match?.[1] ?? (/^Revert "/.test(subject) ? 'revert' : null);
    return {
      subject,
      type,
      breaking: Boolean(match?.[3]) || /^BREAKING[ -]CHANGE:/m.test(body),
    };
  });

// No release yet: the first one is 1.0.0 whatever the commits say.
if (!latest) {
  set('released', 'true');
  set('tag', 'v1.0.0');
  set('version', '1.0.0');
  setNotes(notesFor(commits, '1.0.0', null));
  summary('### First release: v1.0.0');
  process.exit(0);
}

let level = null;
if (commits.some((commit) => commit.breaking)) level = 'major';
else if (commits.some((commit) => FEATURE_TYPES.has(commit.type))) level = 'minor';
else if (commits.some((commit) => PATCH_TYPES.has(commit.type))) level = 'patch';

if (!level) {
  set('released', 'false');
  summary(`### No release: no feat, fix, perf or revert since ${latest}`);
  process.exit(0);
}

const [, major, minor, patch] = STABLE_TAG.exec(latest).map(Number);
let next;
if (level === 'major') next = `${major + 1}.0.0`;
else if (level === 'minor') next = `${major}.${minor + 1}.0`;
else next = `${major}.${minor}.${patch + 1}`;

set('released', 'true');
set('tag', `v${next}`);
set('version', next);
setNotes(notesFor(commits, next, latest));
summary(`### Releasing v${next} (${level} bump from ${latest})`);

function notesFor(list, version, previous) {
  const groups = [
    ['Breaking changes', (commit) => commit.breaking],
    ['Features', (commit) => !commit.breaking && FEATURE_TYPES.has(commit.type)],
    ['Fixes', (commit) => !commit.breaking && PATCH_TYPES.has(commit.type)],
    [
      'Other changes',
      (commit) => !commit.breaking && !FEATURE_TYPES.has(commit.type) && !PATCH_TYPES.has(commit.type),
    ],
  ];

  const sections = groups
    .map(([title, belongs]) => {
      const lines = list.filter(belongs).map((commit) => `- ${commit.subject}`);
      return lines.length ? `### ${title}\n${lines.join('\n')}` : null;
    })
    .filter(Boolean);

  const repo = process.env.GITHUB_REPOSITORY;
  const compare = repo && previous
    ? `\n\n**Full changelog**: https://github.com/${repo}/compare/${previous}...v${version}`
    : '';

  return `## What changed in ${version}\n\n${sections.join('\n\n')}${compare}`;
}
