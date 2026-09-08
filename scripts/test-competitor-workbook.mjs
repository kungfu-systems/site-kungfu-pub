import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyWorkbook,
  restoreWorkbook,
  readiness,
  portfolioText,
} from '../src/lib/competitor-workbook.ts';
import {
  downloads,
  sources,
  steps,
  fields,
  rubric,
  questions,
  example,
} from '../src/data/competitor-watch.ts';

test('an empty portfolio remains a draft and never inherits the example', () => {
  const state = emptyWorkbook(),
    output = portfolioText(state);
  assert.equal(readiness(state).ready, false);
  assert.match(output, /未完成草稿/);
  assert.match(output, /模拟练习，非实际工作经历/);
  assert.equal(output.includes(example.recommendation), false);
  assert.equal((output.match(/\[尚未填写\]/g) || []).length, fields.length);
});

test('self-check completion needs learner fields, source references and correct checks', () => {
  const state = emptyWorkbook();
  state.completed = steps.map((s) => s.id);
  state.checks = rubric.map((r) => r.id);
  assert.equal(readiness(state).ready, false, 'clicking completion boxes is insufficient');
  for (const f of fields) state.draft[f.id] = '这是测试填写的学员内容，不是参考答案。';
  state.draft.facts = '[S1] 学员事实一\n[S3] 学员事实二\n[S4] 学员事实三';
  for (const q of questions) state.answers[q.id] = q.answer;
  assert.equal(readiness(state).ready, true);
  assert.match(portfolioText(state), /自查完成，待他人反馈/);
  assert.match(portfolioText(state), /学员事实一/);
  state.draft.facts += '\n[S99] 不存在的来源';
  assert.equal(readiness(state).citationsReady, false);
});

test('restoration preserves learner text and filters malformed browser state', () => {
  const state = emptyWorkbook();
  state.draft.question = '我自己的问题';
  state.step = 3;
  assert.deepEqual(restoreWorkbook(JSON.parse(JSON.stringify(state))), state);
  const restored = restoreWorkbook({
    version: 1,
    step: 99,
    completed: ['brief', 'alien'],
    checks: ['alien'],
    answers: { price: 99 },
    draft: { facts: 3, reflection: '<script>not executable</script>' },
  });
  assert.equal(restored.step, 0);
  assert.deepEqual(restored.completed, ['brief']);
  assert.equal(restored.draft.facts, '');
  assert.deepEqual(restored.answers, {});
  assert.equal(restored.draft.reflection, '<script>not executable</script>');
  assert.throws(() => restoreWorkbook({ version: 2 }));
});

test('download packs remain complete and clearly distinguish fiction from recruitment', () => {
  assert.equal(sources.length, 6);
  assert.equal(steps.length, 5);
  for (const text of Object.values(downloads)) assert.match(text, /模拟材料/);
  for (const source of sources) assert.ok(downloads.materials.includes(`【${source.id}】`));
  for (const step of steps) assert.ok(downloads.prompts.includes(step.prompt));
  assert.match(downloads.example, /非真实模型日志/);
});
