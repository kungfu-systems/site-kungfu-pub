import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { selectResources } from '../src/lib/resource-library.ts';
import { profiles } from '../src/data/learner-profiles.ts';
const { resources } = JSON.parse(
  readFileSync(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
);
const defaults = {
  query: '',
  category: '',
  type: '',
  language: '',
  recommendedOnly: false,
  recommendedIds: [],
  savedOnly: false,
  savedIds: [],
};

test('every identity can discover the complete library without opting out of hidden filtering', () => {
  const originalIds = resources.map((r) => r.id);
  for (const profile of profiles) {
    const results = selectResources(resources, {
      ...defaults,
      recommendedIds: profile.resourceIds,
    });
    assert.equal(results.length, resources.length);
    assert(results.some((r) => r.id === 'hf-agents'));
    assert(results.some((r) => r.id === 'hello-agents'));
    if (profile.resourceIds.length) assert.equal(results[0].id, profile.resourceIds[0]);
    for (const id of profile.resourceIds)
      assert(originalIds.includes(id), `Unknown recommendation: ${id}`);
  }
  assert.deepEqual(
    resources.map((r) => r.id),
    originalIds,
    'sorting must not mutate canonical data',
  );
});
test('search finds authors and tolerates spaces and hyphens in course names', () => {
  for (const [query, ids] of [
    ['datawhale', ['hello-agents', 'llm-universe', 'all-in-rag']],
    ['Hugging   Face', ['hf-agents', 'hf-mcp']],
    ['hello agents', ['hello-agents']],
    ['微软', ['microsoft-agents']],
  ]) {
    assert.deepEqual(
      selectResources(resources, { ...defaults, query })
        .map((r) => r.id)
        .sort(),
      ids.sort(),
    );
  }
});
test('novice recommendations do not label Python framework courses as prerequisites to Agent use', () => {
  const recommendedIds = profiles.find((p) => p.id === 'business').resourceIds;
  const results = selectResources(resources, {
    ...defaults,
    recommendedIds,
    recommendedOnly: true,
  });
  assert(results.some((r) => r.id === 'workbuddy'));
  assert(results.some((r) => r.id === 'hermes'));
  assert(results.every((r) => ['直接使用 Agent', '可视化搭建'].includes(r.category)));
  assert(!results.some((r) => r.id === 'hf-agents' || r.id === 'hello-agents'));
});
test('language, direction, course form and saved filters intersect', () => {
  const results = selectResources(resources, {
    ...defaults,
    category: '原理与工程',
    type: '系统课程',
    language: '中文',
    savedOnly: true,
    savedIds: ['hello-agents', 'workbuddy', 'dl-agentic-ai', 'retired-id'],
  });
  assert.deepEqual(
    results.map((r) => r.id),
    ['hello-agents'],
  );
  assert.equal(
    selectResources(resources, { ...defaults, query: 'no-such-resource-xyz' }).length,
    0,
  );
});
