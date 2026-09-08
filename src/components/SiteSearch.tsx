import { useEffect, useState } from 'react';
import { Search, ArrowUpRight } from 'lucide-react';
type Hit = { url: string; meta: { title?: string }; excerpt: string };
type Pagefind = { search: (query: string) => Promise<{ results: { data: () => Promise<Hit> }[] }> };
export default function SiteSearch() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [status, setStatus] = useState('输入关键词，查找路线、教程、资料和观察。');
  useEffect(() => setQuery(new URLSearchParams(location.search).get('q') || ''), []);
  useEffect(() => {
    let canceled = false;
    const timer = setTimeout(async () => {
      const url = new URL(location.href);
      query.trim() ? url.searchParams.set('q', query.trim()) : url.searchParams.delete('q');
      history.replaceState(null, '', url);
      if (!query.trim()) {
        setHits([]);
        setStatus('输入关键词，查找路线、教程、资料和观察。');
        return;
      }
      setStatus('正在查找…');
      try {
        const path = '/pagefind/pagefind.js';
        const pagefind: Pagefind = await import(/* @vite-ignore */ path);
        const result = await pagefind.search(query);
        const data = await Promise.all(result.results.slice(0, 20).map((r) => r.data()));
        if (!canceled) {
          setHits(data);
          setStatus(
            `找到 ${result.results.length} 条结果${result.results.length > 20 ? '，显示前 20 条' : ''}`,
          );
        }
      } catch {
        if (!canceled) {
          setHits([]);
          setStatus('搜索索引尚未加载。请使用构建后的本地预览，或稍后重试。');
        }
      }
    }, 250);
    return () => {
      canceled = true;
      clearTimeout(timer);
    };
  }, [query]);
  return (
    <div className="search-page">
      <label className="input-search large">
        <Search size={23} />
        <input
          aria-label="搜索全站"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="试试「工具调用」「入门」「招聘」"
        />
      </label>
      <div className="suggested-searches">
        大家可以从这里开始：
        {['Agent', '工具调用', '招聘', 'Qwen'].map((q) => (
          <button key={q} onClick={() => setQuery(q)}>
            {q}
          </button>
        ))}
      </div>
      <p className="search-status" role="status">
        {status}
      </p>
      <div className="search-results">
        {hits.map((hit, i) => (
          <a key={`${hit.url}-${i}`} href={hit.url}>
            <div>
              <h2>{hit.meta.title?.replace(' — 功夫酒馆', '')}</h2>
              <p>{hit.excerpt.replace(/<[^>]*>/g, '')}</p>
            </div>
            <ArrowUpRight size={21} />
          </a>
        ))}
      </div>
      <p className="storage-note">搜索覆盖本站公开内容和资料介绍，外站全文不在检索范围内。</p>
    </div>
  );
}
