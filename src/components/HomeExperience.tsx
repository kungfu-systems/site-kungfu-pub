import { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  FileText,
  Sparkles,
  Play,
  RotateCcw,
  MessageCircle,
  MousePointer2,
  Search,
  BriefcaseBusiness,
  Compass,
  Code2,
  ShieldCheck,
  Monitor,
  BookOpen,
  CheckCheck,
} from 'lucide-react';
import { useLearnerProfile } from '../lib/learner-profile';
import { beginnerQuestions, demoSteps, startingPoints } from '../data/home-experience';
import { jobs } from '../data/competitor-watch';
import ComputerRecommendations from './ComputerRecommendations';

function BriefPreview({ small = false }: { small?: boolean }) {
  return (
    <div className={`welcome-brief ${small ? 'is-small' : ''}`}>
      <div className="brief-top">
        <span>
          <FileText size={15} /> 我的第一份作品
        </span>
        <span>01</span>
      </div>
      <h3>
        竞品观察简报<span>从资料，到自己的判断</span>
      </h3>
      <div className="brief-table">
        <span>产品</span>
        <span>发现</span>
        <span>核查</span>
        <b>拾页</b>
        <span>首月优惠 ≠ 常规价格</span>
        <Check size={15} />
        <b>轻记</b>
        <span>功能预告 ≠ 已经上线</span>
        <Check size={15} />
        <b>流笺</b>
        <span>网页端已支持 PDF 导出</span>
        <Check size={15} />
      </div>
      <div className="brief-insight">
        <span>我的判断</span>
        <p>先验证用户需求，再决定是否跟进。</p>
      </div>
      <div className="brief-bottom">
        <CheckCheck size={15} /> 有依据 · 有判断 · 有下一步
      </div>
    </div>
  );
}

function TaskDemo() {
  const [step, setStep] = useState(2);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      if (step === 2) setPlaying(false);
      else setStep(step + 1);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [playing, step]);
  function play() {
    if (playing) {
      setPlaying(false);
      return;
    }
    setStep(0);
    setPlaying(true);
  }
  return (
    <div className="welcome-stage" aria-label="Agent 协作过程示例">
      <div className="stage-decoration" aria-hidden="true">
        <div className="stage-orbit orbit-one" />
        <div className="stage-orbit orbit-two" />
      </div>
      <span className="stage-spark" aria-hidden="true">
        ✳
      </span>
      <div className="stage-label">
        <span className="welcome-dot" /> 一件小事，一次新的可能
      </div>
      <div className="stage-tabs" role="group" aria-label="查看演示步骤">
        {demoSteps.map((s, i) => (
          <button
            key={s.label}
            aria-pressed={step === i}
            onClick={() => {
              setStep(i);
              setPlaying(false);
            }}
          >
            <span>{i + 1}</span>
            {s.label}
          </button>
        ))}
      </div>
      <div className="stage-content" aria-live="polite" aria-atomic="true">
        <div className="stage-scene" key={step}>
          {step === 0 ? (
            <div className="demo-conversation">
              <span className="demo-person">
                <span>我</span> 先说说我想做什么
              </span>
              <p>
                我想应聘产品助理。请根据这 6 张资料卡，帮我比较竞品的价格和功能，整理成一页简报。
              </p>
              <div className="demo-attachment">
                <FileText size={17} /> 竞品资料包 · 6 张资料卡
              </div>
              <span className="demo-agent">
                <Sparkles size={17} /> 好，我们先分清事实和判断。
              </span>
            </div>
          ) : step === 1 ? (
            <div className="demo-review">
              <div className="demo-review-heading">
                <Sparkles size={22} />
                <h3>一起把这件事做好</h3>
              </div>
              <div>
                <Check size={17} /> 整理三款产品的信息
              </div>
              <div>
                <Check size={17} /> 为每条结论找到资料来源
              </div>
              <div className="review-question">
                <MessageCircle size={17} />
                <p>“19 元是首月优惠，不能当成每月的价格。请修改这里。”</p>
              </div>
              <span className="review-reply">
                <CheckCheck size={17} /> 已修改，并补充价格说明。
              </span>
            </div>
          ) : (
            <BriefPreview />
          )}
        </div>
      </div>
      <div className="stage-caption">
        <strong>{demoSteps[step].title}</strong>
        <span>{demoSteps[step].description}</span>
      </div>
      <div className="stage-controls">
        <button onClick={play} aria-pressed={playing}>
          {playing ? (
            <span className="pause-icon" aria-hidden="true">
              Ⅱ
            </span>
          ) : step === 2 ? (
            <RotateCcw size={14} />
          ) : (
            <Play size={14} />
          )}
          {playing ? '暂停演示' : '播放过程'}
        </button>
        <span>练习示例 · 非实时 AI</span>
      </div>
      <div className="stage-sticker" aria-hidden="true">
        <MousePointer2 size={17} fill="currentColor" /> 你的判断，很重要
      </div>
    </div>
  );
}

export default function HomeExperience() {
  const { profile, ready, setProfile } = useLearnerProfile();
  const selected = startingPoints.find((p) => p.id === profile.id) ?? startingPoints[0];
  const [openQuestion, setOpenQuestion] = useState<number | null>(0);
  return (
    <div className="welcome-home">
      <section className="welcome-hero container" aria-labelledby="welcome-title">
        <div className="welcome-copy">
          <span className="welcome-kicker">
            <span className="welcome-dot" /> 为想改变现状的你，开一扇门
          </span>
          <h1 id="welcome-title">
            学会 Agent，
            <br />
            给工作多一种
            <span className="welcome-emphasis">
              可能
              <svg viewBox="0 0 250 16" aria-hidden="true">
                <path d="M4 12 Q120 0 246 9" />
              </svg>
            </span>
            。
          </h1>
          <p className="welcome-lead">
            想找工作、转个方向，或把手头的事做得更好？
            <br className="desktop-break" />
            从你的起点出发，把 Agent 用成自己的真本事。
          </p>
          <div className="welcome-actions">
            <a className="welcome-button" href="#my-start">
              找到我的起点 <ArrowRight size={19} />
            </a>
            <a className="welcome-secondary" href="#work-examples">
              <Play size={16} fill="currentColor" /> 看看我能做什么
            </a>
          </div>
          <div className="welcome-reassurance">
            <span>
              <Check size={15} /> 有零编程起点
            </span>
            <span>
              <Check size={15} /> 中文分步练习
            </span>
            <span>
              <Check size={15} /> 对照真实岗位
            </span>
          </div>
          <a className="welcome-setup-link" href="#before-start">
            <Monitor size={14} /> 电脑、安装、费用？先把这些弄明白 <ArrowRight size={13} />
          </a>
        </div>
        <TaskDemo />
      </section>

      <div className="welcome-bridge container">
        <span>从学会使用，到更接近工作机会</span>
        <div>
          <span>
            <Compass size={17} /> 找到起点
          </span>
          <ArrowRight size={14} />
          <span>
            <Sparkles size={17} /> 动手练习
          </span>
          <ArrowRight size={14} />
          <span>
            <FileText size={17} /> 留下作品
          </span>
          <ArrowRight size={14} />
          <span>
            <BriefcaseBusiness size={17} /> 对照岗位
          </span>
        </div>
      </div>

      <section className="welcome-start container" id="my-start" aria-labelledby="start-title">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-kicker">从你这里开始</span>
            <h2 id="start-title">
              不用什么都会，
              <br className="mobile-break" />
              也能迈出第一步。
            </h2>
          </div>
          <p>
            选一个最像你的起点。
            <br />
            推荐会跟着你变，随时可以重选。
          </p>
        </div>
        <div className="start-options" role="group" aria-label="选择我的起点">
          {startingPoints.map((p, i) => {
            const Icon = [MessageCircle, Code2, Sparkles][i];
            return (
              <button
                disabled={!ready}
                key={p.id}
                aria-pressed={profile.id === p.id}
                onClick={() => setProfile(p.id)}
              >
                <Icon size={23} />
                <span>
                  <strong>{p.label}</strong>
                  <small>{p.note}</small>
                </span>
                <span className="start-radio">{profile.id === p.id && <Check size={13} />}</span>
              </button>
            );
          })}
        </div>
        <div className="start-recommendation" aria-live="polite" aria-atomic="true">
          <div className="start-recommendation-copy" key={selected.id}>
            <span className="recommendation-label">
              {profile.id === 'explore' ? '还没选好？可以先试试这个' : '适合你的第一份作品'}
            </span>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <a className="welcome-button" href={`/practice/${selected.practice}/`}>
              {selected.cta} <ArrowRight size={17} />
            </a>
            <small>{selected.requirement}</small>
          </div>
          <div className="start-steps-wrap">
            <ol className="start-steps">
              {selected.steps.map((s, i) => (
                <li key={s}>
                  <span>0{i + 1}</span>
                  <div>
                    {s}
                    <small>
                      {
                        [
                          '先从一个具体任务开始',
                          '边做边学，不懂就拆小一步',
                          '把过程和结果都留下来',
                        ][i]
                      }
                    </small>
                  </div>
                  {i === 2 && <FileText size={25} />}
                </li>
              ))}
            </ol>
            <a className="welcome-text-link start-career-link" href="/careers/">
              {selected.career} <ArrowUpRight size={15} />
            </a>
          </div>
        </div>
      </section>

      <section className="welcome-work container" id="work-examples" aria-labelledby="work-title">
        <div className="welcome-section-heading">
          <div>
            <span className="welcome-kicker">让“我会”看得见</span>
            <h2 id="work-title">
              学的每一步，
              <br className="mobile-break" />
              都朝着做成一件事。
            </h2>
          </div>
          <a className="welcome-text-link" href="/roadmaps/">
            查看全部实践 <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="welcome-work-grid">
          <a className="welcome-work-card work-research" href="/practice/competitor-watch/">
            <div className="work-card-copy">
              <span className="work-chip">不要求编程</span>
              <h3>
                把一堆资料，
                <br />
                变成一页有用的简报。
              </h3>
              <p>练习资料核查与分析，了解产品、运营日常在做什么。</p>
              <span className="work-open">
                跟着做一份 <ArrowUpRight size={17} />
              </span>
            </div>
            <div className="work-brief-art">
              <BriefPreview small />
            </div>
            <span className="work-example-note">模拟材料 · 示例作品</span>
          </a>
          <a className="welcome-work-card work-tool" href="/practice/agent-coding/">
            <span className="work-preview-label">工具界面示意</span>
            <div className="tool-preview" aria-hidden="true">
              <div>
                <span className="tool-dot" />
                <span className="tool-dot" />
                <span className="tool-dot" />
                <span>我的岗位整理工具</span>
              </div>
              <div className="tool-search">
                <Search size={15} /> Agent · 上海
              </div>
              <div className="tool-result">
                <span>✓</span> 筛选符合条件的岗位<span>已整理</span>
              </div>
              <div className="tool-lines">
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="work-chip">适合有编程基础的你</span>
            <h3>让 Agent 帮你做一个工具。</h3>
            <p>从需求到测试，练习 AI 开发协作。</p>
            <span className="work-open">
              开始工具项目 <ArrowUpRight size={17} />
            </span>
          </a>
          <a className="welcome-work-card work-quality" href="/practice/agent-evaluation/">
            <span className="work-preview-label">检查过程示意</span>
            <div className="quality-preview" aria-hidden="true">
              <ShieldCheck size={35} />
              <div>
                <span>回答有依据吗？</span>
                <Check size={15} />
              </div>
              <div>
                <span>不知道时会说明吗？</span>
                <Check size={15} />
              </div>
            </div>
            <span className="work-chip">适合已经用过 Agent 的你</span>
            <h3>让一个助手，做事更靠谱。</h3>
            <p>练习检查和改进，留下可复查的记录。</p>
            <span className="work-open">
              试试质量检查 <ArrowUpRight size={17} />
            </span>
          </a>
        </div>
      </section>

      <section className="welcome-careers" aria-labelledby="careers-title">
        <div className="container">
          <div className="welcome-section-heading">
            <div>
              <span className="welcome-kicker">把学习，连到现实里的机会</span>
              <h2 id="careers-title">
                企业需要什么，
                <br />
                我们就朝哪里练。
              </h2>
            </div>
            <div>
              <p>
                先看工作内容，再看自己还缺哪一步。
                <br />
                这里是有来源的招聘样本，申请前请核对原页。
              </p>
              <a className="welcome-text-link" href="/careers/">
                了解更多就业方向 <ArrowUpRight size={17} />
              </a>
            </div>
          </div>
          <div className="welcome-job-grid">
            {jobs.map((job, i) => (
              <article className="welcome-job" key={job.id}>
                <div className="welcome-job-meta">
                  <span>{job.company}</span>
                  <span>{i === 2 ? '社招 · 有经验要求' : '实习 · 有资格要求'}</span>
                </div>
                <h3>{job.title}</h3>
                <p>{job.signal}</p>
                <div className="welcome-job-requirement">{job.boundary}</div>
                <div className="welcome-job-footer">
                  <span>发布于 {job.published}</span>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`查看${job.title}招聘原文`}
                  >
                    招聘原文 <ArrowUpRight size={14} />
                  </a>
                </div>
              </article>
            ))}
          </div>
          <p className="welcome-career-note">
            练习帮助你积累相关能力与作品，录用还取决于岗位要求、经验和实际表现。
          </p>
        </div>
      </section>

      <ComputerRecommendations />

      <section className="welcome-faq container" id="before-start" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="welcome-kicker">开始之前，先把顾虑说清楚</span>
          <h2 id="faq-title">
            你想问的，
            <br />
            也是很多人的第一问。
          </h2>
          <div className="faq-note">
            <Monitor size={27} />
            <p>
              电脑、安装、费用……
              <br />
              这些都值得认真讲清楚。
            </p>
          </div>
          <a className="welcome-text-link" href="/resources/">
            已经上手？再找学习资料 <ArrowUpRight size={16} />
          </a>
        </div>
        <div className="faq-list">
          {beginnerQuestions.map((item, i) => (
            <div className={`faq-item ${openQuestion === i ? 'is-open' : ''}`} key={item.question}>
              <h3>
                <button
                  id={`faq-question-${i}`}
                  aria-expanded={openQuestion === i}
                  aria-controls={`faq-answer-${i}`}
                  onClick={() => setOpenQuestion(openQuestion === i ? null : i)}
                >
                  {item.question}
                  <ChevronDown size={18} />
                </button>
              </h3>
              <div
                id={`faq-answer-${i}`}
                role="region"
                aria-labelledby={`faq-question-${i}`}
                hidden={openQuestion !== i}
              >
                <p>{item.answer}</p>
                {item.link && (
                  <a
                    className="welcome-text-link"
                    href={item.link}
                    {...(item.link.startsWith('https:')
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {item.label} <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="welcome-closing container">
        <div className="closing-icon" aria-hidden="true">
          <BookOpen size={34} />
          <Sparkles size={18} />
        </div>
        <h2>
          下一步，不必很大。
          <br />
          先为自己多打开一种可能。
        </h2>
        <p>从一个你看得懂、做得出的任务开始。</p>
        <a className="welcome-button" href="#my-start">
          找到我的起点 <ArrowRight size={18} />
        </a>
      </section>
    </div>
  );
}
