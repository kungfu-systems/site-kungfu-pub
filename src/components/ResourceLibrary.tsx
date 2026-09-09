import { useEffect, useState } from 'react';
import { Search, ArrowUpRight, Bookmark } from 'lucide-react';
import { useLearnerProfile } from '../lib/learner-profile';
import catalog from '../data/catalog.json';
import { readIds, writeIds } from '../lib/storage';
import { selectResources } from '../lib/resource-library';

const categories = ['直接使用 Agent', '可视化搭建', '与 Agent 协作开发', '原理与工程'];
const types = [...new Set(catalog.resources.map((r) => r.type))];

export default function ResourceLibrary() {
  const { profile } = useLearnerProfile();
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [language, setLanguage] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => setSaved(readIds('bookmarks')), []);
  const items = selectResources(catalog.resources, {
    query,
    category,
    type,
    language,
    recommendedOnly: profile.id !== 'explore' && recommendedOnly,
    recommendedIds: profile.resourceIds,
    savedOnly,
    savedIds: saved,
  });
  function resetFilters(search = '') {
    setRecommendedOnly(false);
    setQuery(search);
    setCategory('');
    setType('');
    setLanguage('');
    setSavedOnly(false);
  }
  function bookmark(id: string) {
    const next = saved.includes(id) ? saved.filter((i) => i !== id) : [...saved, id];
    setSaved(next);
    setMessage(
      writeIds('bookmarks', next)
        ? '收藏已保存在当前浏览器。'
        : '当前浏览器无法保存收藏，本次更改仅在当前页面有效。',
    );
  }
  return (
    <div className="resource-library">
      <div className="library-orientation">
        <div>
          <strong>想先用起来？从“直接使用”和“可视化搭建”开始。</strong>
          <p>想自己开发 Agent，再看原理与工程。课程名字里的“入门”，不一定代表不需要编程。</p>
        </div>
        <span>
          <b>{catalog.resources.length}</b> 份公开入口
          <br />
          <small>课程 · 教程 · 官方指南</small>
        </span>
      </div>
      <div className="profile-filter-note">
        <span>
          {profile.short} ·{' '}
          {profile.id === 'explore' ? '浏览全部资料' : '适合你的资料排在前面，其余仍可浏览'}
        </span>
        {profile.id !== 'explore' && (
          <label>
            <input
              type="checkbox"
              checked={recommendedOnly}
              onChange={(e) => setRecommendedOnly(e.target.checked)}
            />
            只看适合我的
          </label>
        )}
      </div>
      <div className="library-categories" role="group" aria-label="学习方向">
        {['', ...categories].map((value) => (
          <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>
            {value || '全部方向'}
            <small>
              {value
                ? catalog.resources.filter((r) => r.category === value).length
                : catalog.resources.length}
            </small>
          </button>
        ))}
      </div>
      <div className="library-toolbar">
        <label className="input-search">
          <Search size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索 Datawhale、Hugging Face、工具或主题…"
            aria-label="搜索资料"
          />
        </label>
        <label className="language-select">
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="资料形式">
            <option value="">全部形式</option>
            {types.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="language-select">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="资料语言"
          >
            <option value="">全部语言</option>
            <option>中文</option>
            <option>英文</option>
          </select>
        </label>
      </div>
      <div className="library-shortcuts">
        <span>快速找：</span>
        {['Datawhale', 'Hugging Face', '微软', '吴恩达'].map((name) => (
          <button key={name} onClick={() => resetFilters(name)}>
            {name}
          </button>
        ))}
      </div>
      <div className="filter-row">
        <span className="library-filter-summary">
          {category || '全部方向'} · {type || '全部形式'} · {language || '全部语言'}
          {recommendedOnly && profile.id !== 'explore' ? ' · 仅当前身份' : ''}
        </span>
        <div className="library-filter-actions">
          <button onClick={() => resetFilters()}>重置筛选</button>
          <button
            className={`saved-filter ${savedOnly ? 'active' : ''}`}
            aria-pressed={savedOnly}
            onClick={() => setSavedOnly(!savedOnly)}
          >
            <Bookmark size={15} />
            我的收藏 {saved.length}
          </button>
        </div>
      </div>
      <p className="result-count" role="status">
        找到 {items.length} / {catalog.resources.length} 份资料
        <span>{message || `最近整理 ${catalog.reviewedAt} · 收录不等于实测推荐`}</span>
      </p>
      <div className="library-grid">
        {items.map((r) => (
          <article key={r.id} className="library-card" data-resource-id={r.id}>
            <div className="library-card-top">
              <div className={`resource-mark ${r.color}`}>{r.mark}</div>
              <div className="library-card-flags">
                {profile.id !== 'explore' &&
                  (profile.resourceIds as readonly string[]).includes(r.id) && (
                    <span className="library-recommended">适合你的起点</span>
                  )}
                <button
                  className={`bookmark-button ${saved.includes(r.id) ? 'saved' : ''}`}
                  aria-label={`${saved.includes(r.id) ? '取消收藏' : '收藏'}${r.title}`}
                  aria-pressed={saved.includes(r.id)}
                  onClick={() => bookmark(r.id)}
                >
                  <Bookmark size={19} fill={saved.includes(r.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
            </div>
            <span className="resource-source">
              {r.source} · {r.language}
            </span>
            <h2>
              <a href={`/resources/${r.id}/`}>{r.title}</a>
            </h2>
            <p>{r.description}</p>
            <div className="library-prerequisite">
              <strong>开始前需要</strong>
              <p>{r.prerequisite}</p>
            </div>
            <div className="tags">
              <span>{r.category}</span>
              <span>{r.type}</span>
            </div>
            <div className="library-card-links">
              <a className="library-card-link" href={`/resources/${r.id}/`}>
                看导读 · 从哪一步开始 <ArrowUpRight size={16} />
              </a>
              <a
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`打开${r.title}原站`}
              >
                原站 ↗
              </a>
            </div>
          </article>
        ))}
      </div>
      {items.length === 0 && (
        <div className="empty-state">
          <Search size={30} />
          <h2>暂时没有匹配的资料</h2>
          <p>可以调整身份、方向、语言或收藏筛选，也可以在全部资料中重新查找。</p>
          <button className="button secondary" onClick={() => resetFilters()}>
            查看全部资料
          </button>
        </div>
      )}
      <p className="library-scope">
        优先收录原作者课程与官方指南，涵盖主要学习路径，仍会有遗漏。中文标记说明材料语言，不代表服务在国内一定可用。各条目的费用、版本和来源说明见导读；本站不转载完整教材，也不承诺学完即可就业。
      </p>
    </div>
  );
}
