---
title: '认识 Agent：从对话走向任务'
description: '通过一个资料整理场景，理解目标、工具、反馈与完成标准。'
category: 概念入门
minutes: 6
updated: '2026-09-07'
tags: ['Agent 基础', '任务设计']
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
ai_provenance:
  model_family: GPT-6
  product: Codex
  generated_at: '2026-09-07'
  visible_context: User brief and cited public documentation
  invisible_context_boundary: No production execution or learning-outcome validation
---

## 先从一个具体问题开始

假设你需要把一个文件夹中的公开资料整理成阅读清单。你希望得到每篇资料的标题、主题和来源链接，还要知道哪些文件无法解析。

如果步骤始终固定，例如逐个读取文件、提取固定字段、写入表格，一个普通脚本可能已经足够。当任务需要根据中间结果决定下一步，例如判断资料是否相关、缺少什么信息、是否需要更换检索方式，就可以考虑引入 Agent。

这里采用一个教学上的工作定义：**Agent 在给定目标和边界内，根据观察结果选择动作，并检查动作是否让任务接近完成。** 不同框架的实现方式可能不同。

## 四个需要看清的部分

1. **目标**：最后要交付什么。资料整理任务的目标是一份可复查的清单。
2. **工具**：可以执行哪些动作。例如只读文件、查找关键词、生成本地结果。
3. **反馈**：动作之后看到了什么。例如找到了文件、解析失败或结果为空。
4. **停止条件**：什么时候结束，什么时候交还给人。例如所有文件均已处理，或遇到无法判断的来源。

这些部分需要由应用设计连接起来。模型生成了一段看似正确的回答，并不意味着工具已经执行，更不意味着结果已经通过检查。

## 用一轮任务理解它

```text
目标：整理三份公开资料
观察：文件列表中有两个文本文件、一个无法读取的文件
动作：读取两个文本文件，提取标题与来源
检查：每条记录是否能回到原文？
交付：两条有效记录，以及一条明确的读取失败说明
```

这个例子不要求 Agent 一定把所有问题解决。能诚实说明未完成部分，也是任务交付的一部分。

## 练习：决定是否需要 Agent

分别考虑这三个任务：

- 将一百个文件按创建日期重命名。
- 从一组文章中挑选最适合初学者阅读的三篇，并说明理由。
- 每隔一段时间检查一个固定网页是否出现某个词。

写下各自需要的判断、允许的动作和完成标准。先考虑简单可靠的实现，再决定哪些部分需要模型参与。

**完成标准：** 能用自己的例子说明固定流程与动态决策的区别，并列出一个不需要 Agent 的任务。

## 继续阅读

[Hugging Face Agents 中文课程](https://huggingface.co/learn/agents-course/zh-CN/unit0/introduction)提供从基础概念到框架与项目的学习入口。本站建议先掌握任务与动作的关系，再进入具体框架。
