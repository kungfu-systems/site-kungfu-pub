import { useState } from 'react';
import { ArrowUpRight, Check, Copy, Laptop, Wallet, ChevronDown } from 'lucide-react';
import {
  computerBudgets,
  computerGuideCheckedAt,
  agentPlatformSource,
} from '../data/computer-recommendations';

export default function ComputerRecommendations() {
  const [selected, setSelected] = useState(0);
  const [copyStatus, setCopyStatus] = useState('');
  const budget = computerBudgets[selected];
  const model = budget.model;
  const shoppingNote = `我想了解：${model.name}\n处理器：${model.cpu}\n内存：${model.memory}\n硬盘：${model.storage}\n屏幕：${model.screen}\n参考价格：¥${model.price}（${model.priceLabel}）\n请确认：完整配置、操作系统、最终价格、优惠资格、全新现货和保修退换条件。\n资料核对日期：${computerGuideCheckedAt}；此机型尚未做 Agent 实测。\n官方页面：${model.official}`;

  async function copyConfiguration() {
    try {
      await navigator.clipboard.writeText(shoppingNote);
      setCopyStatus('已复制，可以发给家人或商家一起确认。');
    } catch {
      setCopyStatus('浏览器未允许复制，请展开下方文字，长按或选中复制。');
    }
  }

  return (
    <section
      className="computer-guide container"
      id="computer-guide"
      aria-labelledby="computer-guide-title"
    >
      <div className="computer-heading">
        <div>
          <span className="welcome-kicker">
            <Laptop size={16} /> 先选工具，再做作品
          </span>
          <h2 id="computer-guide-title">
            买电脑，
            <br />
            不用先成为专家。
          </h2>
        </div>
        <p>
          三四五千元，分别能选什么？
          <br />
          选一下预算，看看配置和具体机型。
          <br />
          <a href="#existing-computer">已经有电脑？先看看手里的能不能用 ↓</a>
        </p>
      </div>
      <div className="computer-budget-switch" role="group" aria-label="选择购机预算">
        {computerBudgets.map((option, index) => (
          <button
            type="button"
            key={option.id}
            aria-pressed={selected === index}
            aria-controls="computer-budget-result"
            onClick={() => {
              setSelected(index);
              setCopyStatus('');
            }}
          >
            <span>{option.label}</span>
            <small>{option.note}</small>
            {selected === index && <Check size={19} aria-hidden="true" />}
          </button>
        ))}
      </div>
      <p className="computer-selection-status" role="status">
        正在查看：{budget.label} · {model.name}
      </p>
      <div id="computer-budget-result" className="computer-result" key={budget.id}>
        <div className="computer-advice">
          <span className="computer-step">
            <Wallet size={17} /> 这一档，怎么选
          </span>
          <h3>{budget.title}</h3>
          <p>{budget.description}</p>
          <div className="computer-targets">
            <div>
              <span>内存</span>
              <strong>{budget.memory}</strong>
              <small>同时打开工具的空间</small>
            </div>
            <div>
              <span>硬盘</span>
              <strong>{budget.storage}</strong>
              <small>放课程、资料和作品</small>
            </div>
          </div>
          <p className="computer-focus">{budget.focus}</p>
          <span className="computer-editorial">酒馆选购建议，非工具官方最低要求</span>
        </div>
        <article className="computer-model" aria-labelledby="computer-model-title">
          <div className="computer-model-top">
            <span className="computer-brand">{model.brand}</span>
            <span>本档候选机型</span>
          </div>
          <h3 id="computer-model-title">{model.name}</h3>
          <p className="computer-model-reason">{model.reason}</p>
          <div className="computer-price">
            <strong>
              <small>¥</small>
              {model.price.toLocaleString('zh-CN')}
            </strong>
            <span>{model.priceLabel}</span>
          </div>
          <dl className="computer-specs">
            <div>
              <dt>处理器</dt>
              <dd>{model.cpu}</dd>
            </div>
            <div>
              <dt>内存</dt>
              <dd>{model.memory}</dd>
            </div>
            <div>
              <dt>硬盘</dt>
              <dd>{model.storage}</dd>
            </div>
            <div>
              <dt>屏幕</dt>
              <dd>{model.screen}</dd>
            </div>
          </dl>
          <p className="computer-model-caution">{model.limitation}</p>
          <div className="computer-actions">
            <button type="button" onClick={copyConfiguration}>
              <Copy size={16} /> 复制配置，问问商家
            </button>
            <a href={model.official} target="_blank" rel="noopener noreferrer">
              查看官方页面 <ArrowUpRight size={16} />
            </a>
          </div>
          <details className="computer-source">
            <summary>
              价格来源与核对说明 <ChevronDown size={16} />
            </summary>
            <p>{model.priceDetail}</p>
            <p>
              资料核对：<time dateTime={computerGuideCheckedAt}>{computerGuideCheckedAt}</time>
              。此机型尚未做 Agent 实测。
            </p>
            <a href={model.source} target="_blank" rel="noopener noreferrer">
              {model.sourceLabel} ↗
            </a>
          </details>
        </article>
      </div>
      <div className="computer-copy-status" role="status">
        {copyStatus}
      </div>
      {copyStatus.startsWith('浏览器') && (
        <details className="computer-copy-fallback" open>
          <summary>可手动复制的配置</summary>
          <pre>{shoppingNote}</pre>
        </details>
      )}
      <div className="computer-bottom">
        <p>
          <strong>这份推荐适合哪种用法？</strong>电脑上使用
          Agent，联网调用模型服务，做资料整理、办公和作品练习。这里不按“在电脑里运行大模型”选配置。工具订阅、模型服务费用另计；机型尚未实测，系统与功能支持请对照{' '}
          <a href={agentPlatformSource} target="_blank" rel="noopener noreferrer">
            Hermes 平台支持（本页仍为英文）↗
          </a>
          。
        </p>
        <details id="existing-computer">
          <summary>
            我已经有电脑，先看什么？ <ChevronDown size={18} />
          </summary>
          <p>
            Windows：打开“设置 → 系统 →
            关于”；Mac：打开苹果菜单中的“关于本机”。记下系统版本、处理器和内存，再看硬盘剩余空间。分享截图前，遮住设备名、序列号等个人信息。
          </p>
          <p>
            对照所选工具的安装要求，先试着完成一个小任务，再决定是否换机。上面的新机选购建议，不代表低于这些配置就一定不能用。
          </p>
        </details>
      </div>
    </section>
  );
}
