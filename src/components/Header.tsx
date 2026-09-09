import { useState } from 'react';
import { Search, Menu, X, ArrowUpRight } from 'lucide-react';
import { profiles } from '../data/learner-profiles';
import { useLearnerProfile } from '../lib/learner-profile';
const links = [
  ['home', '探索', '/'],
  ['roadmaps', '学习路线', '/roadmaps/'],
  ['resources', '资料库', '/resources/'],
  ['trends', '趋势观察', '/trends/'],
  ['careers', '职业雷达', '/careers/'],
];
export default function Header({
  section,
  friendly = false,
}: {
  section: string;
  friendly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { profile, persistent, ready, setProfile } = useLearnerProfile();
  return (
    <>
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
                {friendly
                  ? ({
                      home: '首页',
                      roadmaps: '开始学习',
                      resources: '学习资料',
                      trends: '行业变化',
                      careers: '就业机会',
                    }[key] ?? label)
                  : label}
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
            <a href={friendly ? '#my-start' : '/roadmaps/'} className="header-start">
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
      <div className="identity-strip" data-pagefind-ignore>
        <div className="container identity-inner">
          <label className="identity-control">
            我的学习身份
            <select
              disabled={!ready}
              aria-label="我的学习身份"
              value={profile.id}
              onChange={(e) => setProfile(e.target.value)}
            >
              {profiles.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <span
            className={persistent ? 'identity-note' : 'identity-note identity-error'}
            role="status"
          >
            {persistent
              ? '随时切换 · 全站推荐随你改变 · 仅保存在当前浏览器'
              : '本次切换已生效；浏览器无法保存，换页后请重新选择。'}
          </span>
        </div>
      </div>
    </>
  );
}
