import { useState } from 'react';
import { ArrowUpRight, Check, Sparkles, Braces, BookOpen, Flag } from 'lucide-react';
const stations = [
  { title: '认识 Agent', description: '建立概念地图，找到适合自己的起点。', icon: BookOpen },
  { title: '连接工具', description: '让模型通过有边界的工具完成动作。', icon: Braces },
  { title: '验证结果', description: '用可检查的标准判断任务是否完成。', icon: Check },
  { title: '动手实践', description: '把学到的知识，变成一个可复查的小项目。', icon: Flag },
];
export default function HeroMap() {
  const [active, setActive] = useState(1);
  return (
    <div className="hero-map">
      <div className="map-top">
        <span className="tiny-label">
          <span className="status-dot" /> YOUR NEXT CHAPTER
        </span>
        <span className="map-id">PATH / 001</span>
      </div>
      <div className="map-canvas">
        <svg className="map-lines" viewBox="0 0 500 230" aria-hidden="true">
          <path d="M60 125H170Q190 125 190 105V64Q190 48 210 48H320Q340 48 340 70V156Q340 176 360 176H446" />
          <path className="map-line-secondary" d="M190 125V174Q190 190 211 190H265M340 90H417" />
        </svg>
        <span className="map-annotation">从好奇，到创造。</span>
        {stations.map((s, i) => {
          const Icon = s.icon;
          return (
            <button
              key={s.title}
              className={`map-station station-${i} ${active === i ? 'selected' : ''}`}
              onClick={() => setActive(i)}
              aria-pressed={active === i}
            >
              <span className="station-icon">
                <Icon size={22} />
              </span>
              <span className="station-caption">{s.title}</span>
            </button>
          );
        })}
        <span className="map-spark">
          <Sparkles size={17} />
        </span>
        <span className="map-small-dot" />
      </div>
      <div className="map-bottom">
        <div>
          <span className="map-step">0{active + 1} / 探索你的学习路径</span>
          <p>{stations[active].description}</p>
        </div>
        <a href="/roadmaps/foundation/" className="circle-link" aria-label="打开入门学习路线">
          <ArrowUpRight size={21} />
        </a>
      </div>
    </div>
  );
}
