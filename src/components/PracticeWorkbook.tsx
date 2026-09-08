import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, Download } from 'lucide-react';
import type { PracticeCourse } from '../data/advanced-practices';
import {
  emptyPractice,
  restorePractice,
  practiceKey,
  practiceReady,
  exportPractice,
} from '../lib/practice-workbook';
export default function PracticeWorkbook({ course }: { course: PracticeCourse }) {
  const [state, setState] = useState(() => emptyPractice(course));
  const [ready, setReady] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState(''),
    [fallback, setFallback] = useState('');
  const title = useRef<HTMLHeadingElement>(null),
    copyBox = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(practiceKey(course.id));
      if (raw) setState(restorePractice(course, JSON.parse(raw)));
    } catch {
      setError('无法读取已保存的练习；仍可填写和导出，本次不会覆盖旧数据。');
    }
    setReady(true);
  }, [course.id]);
  useEffect(() => {
    if (!ready || error) return;
    try {
      localStorage.setItem(practiceKey(course.id), JSON.stringify(state));
    } catch {
      setError('浏览器无法保存，请及时导出；刷新可能丢失本次填写。');
    }
  }, [state, ready, error, course.id]);
  const step = course.steps[state.step],
    complete = practiceReady(course, state);
  const notes = course.fields
    .filter((f) => state.draft[f.id].trim())
    .map((f) => `${f.label}\n${state.draft[f.id]}`)
    .join('\n\n');
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFallback('');
      setMessage('已复制，请粘贴到你的 Agent 工具。');
    } catch {
      setFallback(text);
      setMessage('无法自动复制，请在下方文本框全选复制。');
      requestAnimationFrame(() => copyBox.current?.scrollIntoView({ block: 'center' }));
    }
  }
  function changeStep(index: number) {
    setState((s) => ({ ...s, step: index }));
    setFallback('');
    requestAnimationFrame(() => title.current?.focus());
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', exportPractice(course, state)], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `我的${course.title}作品.txt`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('已导出你填写的记录。代码和原始运行文件请另行保留。');
  }
  return (
    <div className="cw-workbook" data-pagefind-ignore>
      <div className="cw-workbook-top">
        <div>
          <span className="eyebrow">动手区 / 保存自己的过程</span>
          <h2>让每一步，都留下结果。</h2>
        </div>
        <span>
          第 {state.step + 1} / {course.steps.length} 步
        </span>
      </div>
      <p className="cw-save-note" role="status">
        {!ready
          ? '正在读取练习…'
          : error || '自动保存在当前浏览器，不上传。身份切换不会清除作品；换设备前请导出。'}
      </p>
      <nav className="cw-step-nav" aria-label="练习步骤">
        {course.steps.map((s, i) => (
          <button
            key={s.name}
            disabled={!ready}
            aria-current={state.step === i ? 'step' : undefined}
            onClick={() => changeStep(i)}
          >
            <span>0{i + 1}</span>
            {s.name}
          </button>
        ))}
      </nav>
      <div className="cw-workspace">
        <section className="cw-instructions">
          <span className="cw-label">第 {state.step + 1} 步 · 按自己的节奏推进</span>
          <h3 ref={title} tabIndex={-1}>
            {step.title}
          </h3>
          <p>{step.intro}</p>
          <ol>
            {step.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
          {state.step === 2 && (
            <div className="cw-quiz">
              {course.quiz.map((q) => (
                <fieldset key={q.id}>
                  <legend>{q.question}</legend>
                  {q.options.map((o, i) => (
                    <label key={o}>
                      <input
                        type="radio"
                        name={`${course.id}-${q.id}`}
                        checked={state.answers[q.id] === i}
                        onChange={() =>
                          setState((s) => ({ ...s, answers: { ...s.answers, [q.id]: i } }))
                        }
                      />
                      {o}
                    </label>
                  ))}
                  {state.answers[q.id] !== undefined && (
                    <p
                      role="status"
                      className={state.answers[q.id] === q.answer ? 'cw-correct' : 'cw-retry'}
                    >
                      {state.answers[q.id] === q.answer ? '判断正确。' : '请再想一想。'}
                      {q.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
            </div>
          )}
          <div className="cw-prompt">
            <b>给 Agent 的本步任务</b>
            <p>{step.prompt}</p>
            <button
              className="button primary"
              onClick={() =>
                copy(
                  `${step.prompt}\n\n${course.materials}${state.step >= 2 && notes ? '\n\n我的真实笔记（未填写部分不可补造）\n' + notes : ''}`,
                )
              }
            >
              <Copy size={15} />
              复制任务与材料
            </button>
            <small>
              复制内容包含模拟材料。第3步起带上你填写的笔记。需要实际运行的步骤，请在自己的工具里完成。
            </small>
          </div>
          <details className="cw-help">
            <summary>卡住了怎么办？</summary>
            <p>
              工具不能读文件时可直接粘贴材料。一次输出太长就按题号或文件拆分。报错时保留原文，让
              Agent 解释再修复。没有工具时可以先读参考成品，但请把运行记录标为未执行。
            </p>
          </details>
          <div className="cw-step-actions">
            <button
              className="button secondary"
              disabled={!ready || state.step === 0}
              onClick={() => changeStep(state.step - 1)}
            >
              <ArrowLeft size={15} />
              上一步
            </button>
            {state.step < course.steps.length - 1 ? (
              <button
                className="button primary"
                disabled={!ready}
                onClick={() => changeStep(state.step + 1)}
              >
                下一步
                <ArrowRight size={15} />
              </button>
            ) : (
              <a className="button secondary" href="#practice-export">
                自查与导出 →
              </a>
            )}
          </div>
        </section>
        <section className="cw-draft">
          <div className="cw-draft-title">
            <h3>我的作品记录</h3>
            <span>模拟练习</span>
          </div>
          <p>填写你真正做过的事。参考成品不会自动填入，也不会替你运行 Agent 或测试。</p>
          {course.fields.map((f) => (
            <label className="cw-field" key={f.id}>
              <span>{f.label}</span>
              <textarea
                disabled={!ready}
                rows={5}
                maxLength={20000}
                value={state.draft[f.id]}
                placeholder={f.placeholder}
                onChange={(e) =>
                  setState((s) => ({ ...s, draft: { ...s.draft, [f.id]: e.target.value } }))
                }
              />
            </label>
          ))}
          <fieldset className="cw-rubric" id="practice-export">
            <legend>导出前，自己检查</legend>
            {course.checks.map((c, i) => (
              <label key={c}>
                <input
                  type="checkbox"
                  disabled={!ready}
                  checked={state.checks.includes(i)}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      checks: e.target.checked ? [...s.checks, i] : s.checks.filter((n) => n !== i),
                    }))
                  }
                />
                {c}
              </label>
            ))}
          </fieldset>
          <div className="cw-readiness" aria-live="polite">
            <b>
              {complete ? '填写与自查完成，可以请别人复核了。' : '可以先导出草稿，随时回来继续。'}
            </b>
            <p>
              {!complete && '请填写各项记录，完成第3步纠错和上面的自查。'}
              本站只检查填写与自查状态，不自动判断作品质量或运行结果。
            </p>
          </div>
          <div className="cw-export-actions">
            <button className="button primary" disabled={!ready} onClick={download}>
              <Download size={16} />
              {complete ? '导出我的作品' : '导出当前草稿'}
            </button>
            <button
              className="button secondary"
              disabled={!ready}
              onClick={() => copy(exportPractice(course, state))}
            >
              复制作品
            </button>
          </div>
        </section>
      </div>
      <p className="cw-message" role="status">
        {message}
      </p>
      {fallback && (
        <label className="cw-field">
          <span>手动复制区</span>
          <textarea
            ref={copyBox}
            readOnly
            rows={10}
            value={fallback}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
