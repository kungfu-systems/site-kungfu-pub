import type { PracticeCourse } from '../data/advanced-practices.ts';
export interface PracticeState {
  version: 1;
  step: number;
  draft: Record<string, string>;
  checks: number[];
  answers: Record<string, number>;
}
export function practiceKey(id: string) {
  return `kungfu.pub:practice:${id}:v1`;
}
export function emptyPractice(course: PracticeCourse): PracticeState {
  return {
    version: 1,
    step: 0,
    draft: Object.fromEntries(course.fields.map((f) => [f.id, ''])),
    checks: [],
    answers: {},
  };
}
export function restorePractice(course: PracticeCourse, value: unknown): PracticeState {
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 1)
    throw new Error('Unknown workbook version');
  const input = value as Partial<PracticeState>,
    next = emptyPractice(course);
  if (
    typeof input.step === 'number' &&
    Number.isInteger(input.step) &&
    input.step >= 0 &&
    input.step < course.steps.length
  )
    next.step = input.step;
  for (const f of course.fields) {
    const v = input.draft?.[f.id];
    if (typeof v === 'string') next.draft[f.id] = v.slice(0, 20000);
  }
  if (Array.isArray(input.checks))
    next.checks = [
      ...new Set(
        input.checks.filter((v) => Number.isInteger(v) && v >= 0 && v < course.checks.length),
      ),
    ];
  for (const q of course.quiz) {
    const a = input.answers?.[q.id];
    if (typeof a === 'number' && Number.isInteger(a) && a >= 0 && a < q.options.length)
      next.answers[q.id] = a;
  }
  return next;
}
export function practiceReady(course: PracticeCourse, state: PracticeState) {
  return (
    course.fields.every((f) => Boolean(state.draft[f.id].trim())) &&
    course.checks.every((_, i) => state.checks.includes(i)) &&
    course.quiz.every((q) => state.answers[q.id] === q.answer)
  );
}
export function exportPractice(course: PracticeCourse, state: PracticeState) {
  return `${course.title}｜${practiceReady(course, state) ? '填写与自查完成，待他人复核' : '未完成草稿'}\n功夫酒馆模拟练习，非实际工作经历。记录版本：${course.id} v1\n\n${course.fields.map((f) => `${f.label}\n${state.draft[f.id].trim() || '[尚未填写]'}`).join('\n\n')}\n\n自查记录（非站点认证）\n${course.checks.map((c, i) => `[${state.checks.includes(i) ? 'x' : ' '}] ${c}`).join('\n')}\n\n课程：/practice/${course.id}/\n本文件只导出学员填写的文字；代码、原始模型输出与测试文件请另外保留。本站不自动验证运行结果或作品质量。\n`;
}
