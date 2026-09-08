import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLearnerProfile } from '../lib/learner-profile';
import catalog from '../data/catalog.json';
export function ProfileHero() {
  const { profile } = useLearnerProfile();
  return (
    <>
      <p className="hero-description">
        {profile.id === 'explore'
          ? '从你的基础出发，做一个完整的作品，\n在学习、资料与职业机会中，找到下一步。'
          : profile.description}
      </p>
      <div className="hero-buttons">
        <a
          href={profile.practice ? `/practice/${profile.practice}/` : '/roadmaps/'}
          className="button primary"
        >
          {profile.id === 'explore' ? '选我的学习起点' : '开始适合我的作品'}{' '}
          <ArrowUpRight size={18} />
        </a>
        <a href="/careers/" className="text-link">
          看看对应的工作 →
        </a>
      </div>
    </>
  );
}
export function ProfileCareer() {
  const { profile } = useLearnerProfile();
  return (
    <section className="profile-career" aria-live="polite">
      <span className="eyebrow">{profile.short} / 看岗位，也看自己能做什么</span>
      <h2>
        {profile.id === 'business'
          ? '懂业务，可以从产品与运营切入。'
          : profile.id === 'developer'
            ? '把编程基础，变成指挥与验收能力。'
            : profile.id === 'practitioner'
              ? '用一次可复查的交付，说明你的经验。'
              : '先选起点，再对照真实岗位。'}
      </h2>
      <p>{profile.career}</p>
      {profile.practice && (
        <a
          className="text-link"
          href={`/practice/${profile.practice}/#${profile.id === 'business' ? 'opportunities' : 'jobs'}`}
        >
          查看岗位例子与练习的对应关系 →
        </a>
      )}
    </section>
  );
}
export function ProfileObservations() {
  const { profile } = useLearnerProfile();
  const [all, setAll] = useState(false);
  const items = catalog.observations.filter(
    (o) => all || (profile.observationIds as readonly string[]).includes(o.id),
  );
  return (
    <section>
      <div className="profile-filter-note">
        <span>
          {profile.short} · {all ? '全部观察' : '推荐观察'}
        </span>
        {profile.id !== 'explore' && (
          <button className="text-link" onClick={() => setAll(!all)} aria-pressed={all}>
            {all ? '只看推荐' : '查看全部观察'}
          </button>
        )}
      </div>
      <div className="observation-list wide">
        {items.map((o, i) => (
          <a className="observation-row" href={`/trends/${o.id}/`} key={o.id}>
            <span className="observation-index">0{i + 1}</span>
            <div>
              <div className="observation-meta">
                <span>{o.category}</span>
                <span>{o.kind}</span>
              </div>
              <h3>{o.title}</h3>
              <p>{o.description}</p>
              <small>来源：{o.source}</small>
            </div>
            <ArrowUpRight size={20} />
          </a>
        ))}
      </div>
    </section>
  );
}
