import {
  course,
  fields,
  questions,
  rubric,
  sources,
  type FieldId,
} from '../data/competitor-watch.ts';

export const STORAGE_KEY = 'kungfu.pub:competitor-watch:v1';
export interface Workbook {
  version: 1;
  step: number;
  completed: string[];
  answers: Record<string, number>;
  draft: Record<FieldId, string>;
  checks: string[];
}
export function emptyWorkbook(): Workbook {
  return {
    version: 1,
    step: 0,
    completed: [],
    answers: {},
    checks: [],
    draft: Object.fromEntries(fields.map((f) => [f.id, ''])) as Record<FieldId, string>,
  };
}
export function restoreWorkbook(value: unknown): Workbook {
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 1)
    throw new Error('无法识别保存的练习版本');
  const input = value as Partial<Workbook>,
    result = emptyWorkbook();
  result.step =
    typeof input.step === 'number' &&
    Number.isInteger(input.step) &&
    input.step >= 0 &&
    input.step < 5
      ? input.step
      : 0;
  result.completed = Array.isArray(input.completed)
    ? [
        ...new Set(
          input.completed.filter((id) =>
            ['brief', 'extract', 'verify', 'recommend', 'portfolio'].includes(id),
          ),
        ),
      ]
    : [];
  result.checks = Array.isArray(input.checks)
    ? [...new Set(input.checks.filter((id) => rubric.some((r) => r.id === id)))]
    : [];
  for (const field of fields) {
    const v = input.draft?.[field.id];
    result.draft[field.id] = typeof v === 'string' ? v.slice(0, 10000) : '';
  }
  for (const question of questions) {
    const a = input.answers?.[question.id];
    if (typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < question.options.length)
      result.answers[question.id] = a;
  }
  return result;
}
export function readiness(state: Workbook) {
  const missing = fields.filter((f) => !state.draft[f.id].trim()).map((f) => f.label);
  const factLines = state.draft.facts.split('\n').filter((line) => /\[S[1-6]\]/.test(line));
  const unknownSources = [...state.draft.facts.matchAll(/\[S(\d+)\]/g)].some(
    (m) => !sources.some((s) => s.id === `S${m[1]}`),
  );
  const citationsReady = factLines.length >= 3 && !unknownSources;
  const quizReady = questions.every((q) => state.answers[q.id] === q.answer);
  const checksReady = rubric.every((r) => state.checks.includes(r.id));
  return {
    missing,
    citationsReady,
    quizReady,
    checksReady,
    ready: !missing.length && citationsReady && quizReady && checksReady,
  };
}
export function portfolioText(state: Workbook): string {
  const status = readiness(state).ready ? '自查完成，待他人反馈' : '未完成草稿';
  return `我的竞品观察作品｜${status}
项目类型：功夫酒馆模拟练习，非实际工作经历
${course.boundary}
课程版本：${course.id} v${course.version}
\n${fields.map((f) => `## ${f.label}\n${state.draft[f.id].trim() || '[尚未填写]'}`).join('\n\n')}
\n## 我的自查记录（非站点认证）\n${rubric.map((r) => `[${state.checks.includes(r.id) ? 'x' : ' '}] ${r.text}`).join('\n')}
\n## 材料索引\n${sources.map((s) => `${s.id}｜${s.product}｜${s.title}｜${s.date}｜${s.kind}`).join('\n')}
\n课程与资料：/practice/competitor-watch/；材料包：/practice/competitor-watch/download/materials.txt
本文件只导出学员填写的内容，不自动填入参考答案。核查记录与业务结果需由作者如实说明。
`;
}
