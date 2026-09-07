import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, ChevronRight, ListChecks, RotateCcw } from 'lucide-react';
import catalog from '../data/catalog.json';
import { readIds, writeIds } from '../lib/storage';
export default function RoadmapExplorer({ id }: { id: string }) {
  const roadmap = catalog.roadmaps.find((r) => r.id === id)!;
  const nodes = roadmap.nodes.map((id) => catalog.nodes.find((n) => n.id === id)!);
  const [selected, setSelected] = useState(nodes[0].id);
  const [done, setDone] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setDone(readIds('completed'));
    setReady(true);
  }, []);
  const node = nodes.find((n) => n.id === selected)!;
  function toggle() {
    const current = done;
    const next = current.includes(node.id)
      ? current.filter((id) => id !== node.id)
      : [...current, node.id];
    setDone(next);
    setMessage(
      writeIds('completed', next)
        ? '学习进度已保存在当前浏览器。'
        : '当前浏览器无法保存进度，本次勾选仅在当前页面有效。',
    );
  }
  const count = nodes.filter((n) => done.includes(n.id)).length;
  return (
    <div className="roadmap-explorer">
      <div className="progress-bar">
        <div>
          <ListChecks size={19} />
          <b>我的学习进度</b>
          <span>
            {count} / {nodes.length} 已完成
          </span>
        </div>
        <div className="progress-track">
          <span style={{ width: `${(count / nodes.length) * 100}%` }} />
        </div>
      </div>
      <div className="explorer-columns">
        <nav className="learning-steps" aria-label="学习节点">
          {nodes.map((n, i) => (
            <button
              key={n.id}
              className={n.id === selected ? 'learning-step selected' : 'learning-step'}
              onClick={() => setSelected(n.id)}
              aria-pressed={n.id === selected}
            >
              <span className={done.includes(n.id) ? 'step-index done' : 'step-index'}>
                {done.includes(n.id) ? <Check size={17} /> : String(i + 1).padStart(2, '0')}
              </span>
              <span>
                <small>学习节点 {i + 1}</small>
                <b>{n.title}</b>
              </span>
              <ChevronRight size={17} />
            </button>
          ))}
        </nav>
        <section className="node-detail" aria-live="polite">
          <span className="eyebrow">你的下一个小实践</span>
          <h2>{node.title}</h2>
          <p>{node.description}</p>
          <div className="outcome">
            <span>学到什么程度？</span>
            <p>{node.outcome}</p>
          </div>
          {node.prerequisites.length > 0 && (
            <p className="prerequisite">
              建议先了解：
              {node.prerequisites
                .map((id) => catalog.nodes.find((n) => n.id === id)?.title)
                .join('、')}
            </p>
          )}
          <h3>推荐学习材料</h3>
          {node.tutorial && (
            <a className="node-resource" href={`/tutorials/${node.tutorial}/`}>
              <span>
                <small>功夫原创 · 教程初稿</small>
                <b>阅读配套实践教程</b>
              </span>
              <ArrowUpRight size={19} />
            </a>
          )}
          {node.resourceIds.map((id) => {
            const r = catalog.resources.find((r) => r.id === id)!;
            return (
              <a className="node-resource" href={`/resources/${id}/`} key={id}>
                <span>
                  <small>
                    {r.source} · {r.language}
                  </small>
                  <b>{r.title}</b>
                </span>
                <ArrowUpRight size={19} />
              </a>
            );
          })}
          <button className="button primary complete-button" disabled={!ready} onClick={toggle}>
            {done.includes(node.id) ? <RotateCcw size={16} /> : <Check size={16} />}{' '}
            {done.includes(node.id) ? '取消完成标记' : '我已完成这个节点'}
          </button>
          <p className="storage-note" role="status">
            {message || '进度保存在当前浏览器，无需注册。完成标记由你自行确认。'}
          </p>
        </section>
      </div>
    </div>
  );
}
