import { useEffect, useState } from 'react';
import { Search, ArrowUpRight, Bookmark, SlidersHorizontal } from 'lucide-react';
import catalog from '../data/catalog.json';
import { readIds, writeIds } from '../lib/storage';
export default function ResourceLibrary() {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('全部资料');
  const [language, setLanguage] = useState('全部语言');
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => setSaved(readIds('bookmarks')), []);
  const items = catalog.resources.filter(
    (r) =>
      (type === '全部资料' || r.type === type) &&
      (language === '全部语言' || r.language === language) &&
      (!savedOnly || saved.includes(r.id)) &&
      `${r.title} ${r.description} ${r.tags.join(' ')}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  function bookmark(id: string) {
    const current = saved;
    const next = current.includes(id) ? current.filter((i) => i !== id) : [...current, id];
    setSaved(next);
    setMessage(
      writeIds('bookmarks', next)
        ? '收藏已保存在当前浏览器。'
        : '当前浏览器无法保存收藏，本次更改仅在当前页面有效。',
    );
  }
  return (
    <>
      <div className="library-toolbar">
        <label className="input-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索标题、主题或关键词…"
            aria-label="搜索资料"
          />
        </label>
        <label className="language-select">
          <SlidersHorizontal size={16} />
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="资料语言"
          >
            <option>全部语言</option>
            <option>中文</option>
            <option>英文</option>
          </select>
        </label>
      </div>
      <div className="filter-row">
        <div className="filter-tabs">
          {['全部资料', '系统课程', '官方文档'].map((t) => (
            <button
              key={t}
              aria-pressed={t === type}
              className={t === type ? 'active' : ''}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          className={`saved-filter ${savedOnly ? 'active' : ''}`}
          aria-pressed={savedOnly}
          onClick={() => setSavedOnly(!savedOnly)}
        >
          <Bookmark size={15} /> 我的收藏 {saved.length}
        </button>
      </div>
      <p className="result-count" aria-live="polite">
        找到 {items.length} 份资料<span>{message || '精选条目 · 最近核验 2026.09.07'}</span>
      </p>
      <div className="library-grid">
        {items.map((r) => (
          <article key={r.id} className="library-card">
            <div className="library-card-top">
              <div className={`resource-mark ${r.color}`}>{r.mark}</div>
              <button
                className={`bookmark-button ${saved.includes(r.id) ? 'saved' : ''}`}
                aria-label={`${saved.includes(r.id) ? '取消收藏' : '收藏'}${r.title}`}
                aria-pressed={saved.includes(r.id)}
                onClick={() => bookmark(r.id)}
              >
                <Bookmark size={19} fill={saved.includes(r.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
            <span className="resource-source">
              {r.source} · {r.language}
            </span>
            <h2>
              <a href={`/resources/${r.id}/`}>{r.title}</a>
            </h2>
            <p>{r.description}</p>
            <div className="tags">
              {r.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <a className="library-card-link" href={`/resources/${r.id}/`}>
              {r.type} · {r.level}
              <ArrowUpRight size={18} />
            </a>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <div className="empty-state">
          <Search size={30} />
          <h2>暂时没有匹配的资料</h2>
          <p>试试更短的关键词，或调整语言与收藏筛选。</p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery('');
              setType('全部资料');
              setLanguage('全部语言');
              setSavedOnly(false);
            }}
          >
            重置筛选
          </button>
        </div>
      )}
    </>
  );
}
