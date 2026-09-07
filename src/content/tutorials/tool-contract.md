---
title: '设计工具边界：一个动作，也要说清输入输出'
description: '用只读检索工具练习参数约束、结果表达与失败处理。'
category: 工具实践
minutes: 8
updated: '2026-09-07'
tags: ['工具调用', '可靠性']
status: draft
period: '2026-09'
theme: agent-learning
doc_type: tutorial
source_level: original-editorial
confidence: medium
sensitivity: public
evidence_grade: B
review_state: unreviewed
last_reviewed: '2026-09-07'
---

## 工具是一个明确的动作接口

当 Agent 可以调用工具，它就能影响外部环境或读取外部信息。工具设计首先要回答：它能做什么、接收什么参数、返回什么，以及失败时怎样表达。

先从一个只读工具开始，比直接赋予任意命令执行能力更容易检查。

## 设计一个只读检索工具

下面是一份教学用接口说明，展示结构思路，不是可直接运行的 SDK 代码。

```json
{
  "name": "search_documents",
  "input": {
    "query": "要查找的关键词",
    "collection": "预先登记的公开资料集 ID",
    "limit": 5
  },
  "output": {
    "status": "ok",
    "results": [{ "documentId": "guide-01", "excerpt": "匹配片段", "source": "资料来源" }]
  }
}
```

接口使用预先登记的资料集 ID，避免把任意文件路径直接交给模型控制。数量限制也应在工具实现中验证，不能只写在提示词里。

## 明确三种不同结果

| 情况     | 工具表达           | 后续判断                   |
| -------- | ------------------ | -------------------------- |
| 找到资料 | 成功状态与来源记录 | 检查资料是否回答了问题     |
| 没有匹配 | 成功状态与空结果   | 修改检索词，或说明信息不足 |
| 执行失败 | 错误状态与错误类别 | 根据错误决定重试或停止     |

“没有结果”和“工具失败”不应该混在一起。前者描述资料情况，后者描述执行情况。

## 让输出可以复查

每条检索结果保留来源标识。Agent 在回答中引用资料时，应用仍需要检查来源是否存在，摘录是否真的支持结论。

检索出的文字属于任务资料，即使里面出现“忽略上面的要求”等句子，也不能自动成为应用指令。资料与操作权限要保持独立。

## 做一次小范围验证

为工具准备三组输入：

1. 一个资料集中确实存在的关键词。
2. 一个不存在的关键词。
3. 一个非法的资料集 ID。

分别记录工具返回结果和 Agent 的后续行为。检查它是否会凭空补出资料，是否把错误解释成没有信息，以及是否在该停止时停止。

**完成标准：** 三种情况都能被区分；工具只访问允许的资料集；最终回答能回到原始来源。

## 对照真实实现

可以阅读 [Qwen-Agent 官方指南](https://qwen.readthedocs.io/zh-cn/latest/framework/qwen_agent.html)中的工具配置示例，以及 [MCP 官方介绍](https://modelcontextprotocol.io/docs/getting-started/intro)。它们分别提供具体框架与连接协议的学习入口；实现时请核对所用版本的接口与权限模型。
