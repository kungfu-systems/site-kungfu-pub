import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  profiles,
  profileFor,
  recommendedEntries,
  practiceEntries,
} from '../src/data/learner-profiles.ts';
import { advancedPractices } from '../src/data/advanced-practices.ts';
import {
  emptyPractice,
  restorePractice,
  practiceReady,
  exportPractice,
  practiceKey,
} from '../src/lib/practice-workbook.ts';
import {
  referencePython,
  starterPython,
  acceptancePython,
  demoJobs,
} from '../src/data/practice-kits.ts';

test('unknown identities fall back to open discovery, while each identity has a concrete project', () => {
  assert.equal(profileFor('old-or-corrupt').id, 'explore');
  assert.equal(recommendedEntries(null).length, 3);
  for (const profile of profiles.slice(1)) {
    const entries = recommendedEntries(profile.id);
    assert.equal(entries.length, 1);
    assert.equal(entries[0].id, profile.practice);
    assert.equal(entries[0].roadmap, profile.roadmap);
  }
  assert.equal(new Set(practiceEntries.map((e) => e.id)).size, 3);
});

test('each workbook retains only its own learner fields and exports honest incomplete records', () => {
  assert.notEqual(practiceKey(advancedPractices[0].id), practiceKey(advancedPractices[1].id));
  for (const course of advancedPractices) {
    const state = emptyPractice(course);
    assert.equal(practiceReady(course, state), false);
    const empty = exportPractice(course, state);
    assert.match(empty, /未完成草稿/);
    assert.match(empty, /尚未填写/);
    assert.ok(!empty.includes(course.example));
    state.draft[course.fields[0].id] = 'MY ORIGINAL WORK';
    const restored = restorePractice(course, {
      ...state,
      step: 999,
      checks: [0, 0, 99],
      answers: { unknown: 0 },
    });
    assert.equal(restored.step, 0);
    assert.deepEqual(restored.checks, [0]);
    assert.deepEqual(restored.answers, {});
    assert.match(exportPractice(course, restored), /MY ORIGINAL WORK/);
    assert.throws(() => restorePractice(course, { version: 2 }));
    for (const field of course.fields) state.draft[field.id] = 'Actual learner record';
    state.checks = course.checks.map((_, i) => i);
    assert.equal(practiceReady(course, state), false);
    for (const quiz of course.quiz) state.answers[quiz.id] = quiz.answer;
    assert.equal(practiceReady(course, state), true);
  }
});

test('downloaded reference passes the actual CLI contract; unfinished starter fails it', () => {
  const folder = mkdtempSync(join(tmpdir(), 'kungfu-shortlist-contract-'));
  try {
    writeFileSync(join(folder, 'test_shortlist.py'), acceptancePython);
    writeFileSync(join(folder, 'jobs.json'), JSON.stringify(demoJobs));
    writeFileSync(join(folder, 'shortlist.py'), referencePython);
    const result = spawnSync('python3', ['-m', 'unittest', '-v', 'test_shortlist.py'], {
      cwd: folder,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || String(result.error));
    assert.match(result.stderr, /Ran 9 tests/);
    writeFileSync(join(folder, 'shortlist.py'), starterPython);
    const starter = spawnSync('python3', ['-m', 'unittest', '-v', 'test_shortlist.py'], {
      cwd: folder,
      encoding: 'utf8',
    });
    assert.notEqual(starter.status, 0, 'starter must not masquerade as a finished project');
  } finally {
    rmSync(folder, { recursive: true, force: true });
  }
});
