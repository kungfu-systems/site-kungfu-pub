import { useState } from 'react';
import { Search, Menu, X, ArrowUpRight } from 'lucide-react';
const links = [
  ['home', '探索', '/'],
  ['roadmaps', '学习路线', '/roadmaps/'],
  ['resources', '资料库', '/resources/'],
  ['trends', '趋势观察', '/trends/'],
  ['careers', '职业雷达', '/careers/'],
];
export default function Header({ section }: { section: string }) {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header" data-pagefind-ignore>
      <div className="header-inner container">
        <a href="/" className="brand" aria-label="功夫酒馆 首页">
          <span className="brand-seal">功</span>
          <span>功夫酒馆</span>
        </a>
        <nav className={open ? 'main-nav is-open' : 'main-nav'} aria-label="主导航">
          {links.map(([key, label, url]) => (
            <a
              key={key}
              href={url}
              className={section === key ? 'active' : ''}
              aria-current={section === key ? 'page' : undefined}
            >
              {label}
              {key === 'careers' && <span className="nav-dot" />}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <a className="search-trigger" href="/search/" aria-label="搜索站内内容">
            <Search size={17} />
            <span>搜索</span>
            <kbd>⌕</kbd>
          </a>
          <a href="/roadmaps/" className="header-start">
            开始学习 <ArrowUpRight size={15} />
          </a>
          <button
            className="menu-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? '关闭导航' : '打开导航'}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
