import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Copy, Download, FileText } from 'lucide-react';
import {
  fields,
  materialPack,
  questions,
  rubric,
  steps,
  type FieldId,
} from '../data/competitor-watch';
import {
  emptyWorkbook,
  portfolioText,
  readiness,
  restoreWorkbook,
  STORAGE_KEY,
} from '../lib/competitor-workbook';

export default function CompetitorWorkbook() {
  const [state, setState] = useState(emptyWorkbook);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [message, setMessage] = useState('');
  const [fallback, setFallback] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const fallbackField = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(restoreWorkbook(JSON.parse(raw)));
    } catch {
      setStorageError('无法读取本机保存的练习。仍可填写和导出；如果有旧备份，请先保留。');
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready || storageError) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      setStorageError('浏览器暂时无法保存。请及时复制或下载作品，刷新可能丢失本次填写。');
    }
  }, [state, ready, storageError]);
  const step = steps[state.step];
  const result = readiness(state);
  const notes = fields
    .filter((f) => state.draft[f.id].trim())
    .map((f) => `${f.label}：\n${state.draft[f.id]}`)
    .join('\n\n');
  const currentPrompt = `${step.prompt}\n\n${materialPack}${state.step >= 2 && notes ? `\n\n【我的当前笔记：可能未完成，请核查，不要作为新增事实来源】\n${notes}` : ''}`;
  async function copy(text: string, success: string) {
    try {
      await navigator.clipboard.writeText(text);
      setFallback('');
      setMessage(success);
    } catch {
      setFallback(text);
      setMessage('无法自动复制。请在文本框全选并复制。');
      requestAnimationFrame(() => fallbackField.current?.scrollIntoView({ block: 'center' }));
    }
  }
  function changeStep(index: number) {
    setState((s) => ({ ...s, step: index }));
    setMessage('');
    setFallback('');
    requestAnimationFrame(() => heading.current?.focus());
  }
  function edit(id: FieldId, value: string) {
    setState((s) => ({ ...s, draft: { ...s.draft, [id]: value } }));
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob(['\uFEFF', portfolioText(state)], { type: 'text/plain;charset=utf-8' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = '我的竞品观察作品.txt';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      result.ready
        ? '已导出你的作品。下一步请找一位同学或老师反馈。'
        : '已导出草稿，未完成的位置会如实标记。',
    );
  }
  return (
    <div className="cw-workbook" data-pagefind-ignore>
      <div className="cw-workbook-top">
        <div>
          <span className="eyebrow">动手区 · 你的第一份作品</span>
          <h2>把每一步，留下来。</h2>
        </div>
        <div className="cw-progress" aria-label={`自行标记完成${state.completed.length}步，共5步`}>
          <span>{state.completed.length} / 5 步</span>
          <progress max={5} value={state.completed.length} />
        </div>
      </div>
      <p className="cw-save-note" role="status">
        {!ready
          ? '正在读取本机进度…'
          : storageError || '填写内容自动保存在当前浏览器，不上传。换设备前请导出作品。'}
      </p>
      <div className="cw-step-nav" aria-label="练习步骤">
        {steps.map((s, i) => (
          <button
            key={s.id}
            disabled={!ready}
            onClick={() => changeStep(i)}
            aria-current={state.step === i ? 'step' : undefined}
          >
            <span>
              {state.completed.includes(s.id) ? (
                <Check size={15} aria-label="已自行标记完成" />
              ) : (
                `0${i + 1}`
              )}
            </span>
            {s.name}
          </button>
        ))}
      </div>
      <div className="cw-workspace">
        <section className="cw-instructions" aria-labelledby="step-title">
          <span className="cw-label">
            第 {state.step + 1} 步 · {step.minutes} · 可分次完成
          </span>
          <h3 id="step-title" ref={heading} tabIndex={-1}>
            {step.title}
          </h3>
          <p>{step.intro}</p>
          <ol>
            {step.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
          {state.step === 0 && (
            <div className="cw-callout">
              <b>先打开你能使用的 AI 工具</b>
              <p>
                已有工具就继续使用。第一次接触？可以先
                <a href="https://www.kimi.com/" target="_blank" rel="noopener noreferrer">
                  打开 Kimi 官网 ↗
                </a>
                ，按页面提示登录、新建对话，把任务和资料粘进去。不必安装编程环境。
                <a href="https://www.kimi.com/help" target="_blank" rel="noopener noreferrer">
                  查看官方新手帮助 ↗
                </a>
              </p>
              <p>
                此练习不要求写代码、注册 GitHub 或购买插件；站点本身不运行
                Agent。工具账号、额度和费用以官方页面为准，其他能处理文字的 AI 工具也可以。
              </p>
              <p>
                暂时没有可用工具？先手动完成资料核查，保存练习。待能使用工具后，再补做提取与改写，不把手工练习冒充
                Agent 项目。
              </p>
            </div>
          )}
          {state.step === 2 && (
            <div className="cw-quiz">
              {questions.map((q) => (
                <fieldset key={q.id}>
                  <legend>{q.statement}</legend>
                  {q.options.map((o, i) => (
                    <label key={o}>
                      <input
                        type="radio"
                        name={q.id}
                        value={i}
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
                      className={state.answers[q.id] === q.answer ? 'cw-correct' : 'cw-retry'}
                      role="status"
                    >
                      {state.answers[q.id] === q.answer ? '判断正确。' : '再对照一下资料。'}
                      {q.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
            </div>
          )}
          <div className="cw-prompt">
            <div className="cw-prompt-heading">
              <b>直接给 Agent 的任务</b>
              <Copy size={16} />
            </div>
            <p>{step.prompt}</p>
            <button
              className="button primary"
              onClick={() =>
                copy(currentPrompt, '已复制本步任务和全部6张资料卡。请粘贴到你的AI工具。')
              }
            >
              <Copy size={15} />
              复制任务和全部资料
            </button>
            <small>
              第2步起，在同一对话继续；第3–5步会带上你已填写的笔记。保留前一步的真实输出。
            </small>
          </div>
          <details className="cw-help">
            <summary>卡住了？试试这些办法</summary>
            <ul>
              <li>工具不支持上传：直接复制文字，或分批粘贴资料卡。</li>
              <li>工具不能联网：这次只用资料包，告诉它“不要搜索”。</li>
              <li>回答太泛：追问“每条结论引用哪个S编号？请保留日期与条件”。</li>
              <li>一次输出不完：先要事实表，再要比较，最后要建议。</li>
              <li>核查时发现错误：要求它保留“修改前→证据→修改后”，不要只让它重写全文。</li>
              <li>浏览器不能复制：使用出现的文本框手动全选复制，或下载操作卡。</li>
            </ul>
          </details>
          <label className="cw-complete">
            <input
              type="checkbox"
              checked={state.completed.includes(step.id)}
              disabled={!ready}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  completed: e.target.checked
                    ? [...new Set([...s.completed, step.id])]
                    : s.completed.filter((id) => id !== step.id),
                }))
              }
            />
            {step.done}
          </label>
          <div className="cw-step-actions">
            <button
              className="button secondary"
              disabled={state.step === 0 || !ready}
              onClick={() => changeStep(state.step - 1)}
            >
              <ArrowLeft size={15} />
              上一步
            </button>
            {state.step < steps.length - 1 ? (
              <button
                className="button primary"
                disabled={!ready}
                onClick={() => changeStep(state.step + 1)}
              >
                下一步
                <ArrowRight size={15} />
              </button>
            ) : (
              <a className="button secondary" href="#portfolio-export">
                检查并导出
                <ArrowRight size={15} />
              </a>
            )}
          </div>
        </section>
        <section className="cw-draft" aria-labelledby="draft-title">
          <div className="cw-draft-title">
            <FileText size={21} />
            <h3 id="draft-title">我的竞品观察作品</h3>
            <span>模拟练习</span>
          </div>
          <p>写你自己的判断。可以粘贴 Agent 草稿，但请先核查；参考答案不会自动填进来。</p>
          {fields.map((f) => (
            <label className="cw-field" key={f.id}>
              <span>{f.label}</span>
              <textarea
                disabled={!ready}
                value={state.draft[f.id]}
                maxLength={10000}
                rows={f.rows}
                onChange={(e) => edit(f.id, e.target.value)}
                placeholder={f.placeholder}
              />
            </label>
          ))}
          <fieldset className="cw-rubric" id="portfolio-export">
            <legend>导出前，自己检查一次</legend>
            {rubric.map((r) => (
              <label key={r.id}>
                <input
                  type="checkbox"
                  disabled={!ready}
                  checked={state.checks.includes(r.id)}
                  onChange={(e) =>
                    setState((s) => ({
                      ...s,
                      checks: e.target.checked
                        ? [...new Set([...s.checks, r.id])]
                        : s.checks.filter((id) => id !== r.id),
                    }))
                  }
                />
                {r.text}
              </label>
            ))}
          </fieldset>
          <div className="cw-readiness" aria-live="polite">
            <b>
              {result.ready ? '自查完成，可以请别人看一看了。' : '现在可以导出草稿，随时回来继续。'}
            </b>
            {!result.ready && (
              <ul>
                {result.missing.length > 0 && <li>还未填写：{result.missing.join('、')}。</li>}
                {!result.citationsReady && (
                  <li>事实至少分3行，分别保留有效的 [S1]–[S6] 来源编号。</li>
                )}
                {!result.quizReady && <li>完成第3步的三道纠错练习。</li>}
                {!result.checksReady && <li>逐项完成上面的自查。</li>}
              </ul>
            )}
            <small>
              这里只检查填写、来源编号格式和自查状态，不自动判断内容质量，也不是求职资格认证。
            </small>
          </div>
          <div className="cw-export-actions">
            <button className="button primary" disabled={!ready} onClick={download}>
              <Download size={16} />
              {result.ready ? '导出我的作品' : '导出当前草稿'}
            </button>
            <button
              className="button secondary"
              disabled={!ready}
              onClick={() => copy(portfolioText(state), '已复制你填写的作品。')}
            >
              <Copy size={16} />
              复制作品
            </button>
          </div>
          <p className="cw-save-note">
            下载的是普通文本，可用记事本或文档软件打开。清理浏览器数据会清除进度。
          </p>
        </section>
      </div>
      <p className="cw-message" role="status" aria-live="polite">
        {message}
      </p>
      {fallback && (
        <label className="cw-field">
          <span>手动复制区（全选后复制）</span>
          <textarea
            ref={fallbackField}
            readOnly
            value={fallback}
            rows={10}
            onFocus={(e) => e.currentTarget.select()}
          />
        </label>
      )}
    </div>
  );
}
