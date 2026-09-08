import { useState } from 'react';
import { ArrowUpRight, Compass, Code2, Layers } from 'lucide-react';
import { practiceEntries, recommendedEntries, profiles } from '../data/learner-profiles';
import { useLearnerProfile } from '../lib/learner-profile';
export default function PracticeDiscovery({ compact = false }: { compact?: boolean }) {
  const { profile, ready, setProfile } = useLearnerProfile();
  const [all, setAll] = useState(false);
  const entries = all ? practiceEntries : recommendedEntries(profile.id);
  const icons = [Compass, Code2, Layers];
  return (
    <section className="practice-discovery" aria-label="按身份选择实践">
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR NEXT PROJECT / 从一个作品开始</span>
          <h2>
            {profile.id === 'explore' ? '你的起点，通向什么作品？' : `给${profile.short}的下一步`}
          </h2>
          <p className="profile-description">{profile.description}</p>
        </div>
        {profile.id !== 'explore' && (
          <button className="text-link profile-all" onClick={() => setAll(!all)} aria-pressed={all}>
            {all ? '只看适合我的' : '查看全部三个入口'}
          </button>
        )}
      </div>
      {!compact && (
        <div className="profile-tabs" aria-label="我的学习身份">
          {profiles.map((p) => (
            <button
              key={p.id}
              disabled={!ready}
              aria-pressed={p.id === profile.id}
              onClick={() => {
                setProfile(p.id);
                setAll(false);
              }}
            >
              {p.short}
            </button>
          ))}
        </div>
      )}
      <div className={`practice-entry-grid ${entries.length === 1 ? 'single' : ''}`}>
        {entries.map((e) => {
          const Icon = icons[Number(e.number) - 1];
          return (
            <article className={`practice-entry entry-${e.profile}`} key={e.id}>
              <div className="card-top">
                <Icon size={25} />
                <span className="card-number">{e.number}</span>
              </div>
              <span className="card-kicker">{e.subtitle}</span>
              <h3>{e.title}</h3>
              <p>{e.description}</p>
              <div className="practice-result">带走：{e.result}</div>
              <a className="button primary" href={`/practice/${e.id}/`}>
                开始这条实践 <ArrowUpRight size={16} />
              </a>
              <a className="practice-theory" href={`/roadmaps/${e.roadmap}/`}>
                先补基础知识 →
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
}
