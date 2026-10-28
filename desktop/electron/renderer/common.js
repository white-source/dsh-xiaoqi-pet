'use strict';

(() => {
  const zh = String(navigator.language || '').toLowerCase().startsWith('zh');
  const text = (en, cn) => (zh ? cn : en);
  const COLORS = ['#2A8A80', '#D9942F', '#4F8CFF', '#A78BFA', '#E879A6', '#7CB342', '#E76F51'];

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function stableIndex(id) {
    let hash = 1469598103934665603n;
    for (const byte of new TextEncoder().encode(String(id))) {
      hash ^= BigInt(byte);
      hash = BigInt.asUintN(64, hash * 1099511628211n);
    }
    return Number(hash % BigInt(COLORS.length));
  }

  function taskColors(tasks) {
    const used = new Set();
    const result = {};
    for (const task of tasks) {
      let index = stableIndex(task.id);
      while (used.has(index)) index = (index + 1) % COLORS.length;
      used.add(index);
      result[task.id] = COLORS[index];
    }
    return result;
  }

  function statusText(task) {
    switch (task.kind) {
      case 'waiting': return text('Needs you', '待处理');
      case 'running': return text('In progress', '进行中');
      case 'done': return text('Done', '已完成');
      default: return '';
    }
  }

  function pendingText(task) {
    switch (task.pendingKind || '') {
      case 'approval':
        return task.pendingTool
          ? text(`Waiting for approval · ${task.pendingTool}`, `等待确认 · ${task.pendingTool}`)
          : text('Waiting for approval', '等待确认');
      case 'question': return text('Waiting for your answer', '等待回答');
      case 'plan-review': return text('Waiting for plan review', '等待计划确认');
      default: return text('Waiting for you', '待处理');
    }
  }

  function actionLabel(action) {
    if (!action || !action.kind) return '';
    const target = action.target || '';
    const labels = {
      read: text(`Read ${target}`, `读取 ${target}`),
      write: text(`Write ${target}`, `写入 ${target}`),
      edit: text(`Edit ${target}`, `修改 ${target}`),
      bash: text(`Run: ${target}`, `运行：${target}`),
      glob: text(`Find ${target}`, `查找 ${target}`),
      grep: text(`Search ${target}`, `搜索 ${target}`),
      image: text(`View ${target}`, `查看 ${target}`),
      plugin: text(`Plugin: ${target}`, `插件操作：${target}`),
      inspect: text(`Inspect: ${target}`, `检查接口：${target}`),
      search: text(`Search: ${target}`, `检索：${target}`),
      fetch: text(`Fetch: ${target}`, `读取网页：${target}`),
      subagent: text(`Delegate: ${target}`, `调度子任务：${target}`),
      workflow: text(`Workflow: ${target}`, `工作流：${target}`),
      present: text('Present deliverables', '整理交付物'),
      skill: text(`Skill: ${target}`, `加载技能：${target}`),
      todo: text('Update checklist', '更新任务清单'),
      schedule: text(`Schedule: ${target}`, `定时任务：${target}`),
      tool: text(`Use ${target}`, `调用 ${target}`),
    };
    const label = labels[action.kind] || labels.tool;
    return action.done ? `${label} ✓` : label;
  }

  function phaseText(phase) {
    switch (phase) {
      case 'thinking': return text('Thinking', '思考中');
      case 'tool': return text('Running a tool', '执行工具中');
      case 'responding': return text('Writing the answer', '生成回复中');
      case 'done': return text('Finished', '已完成');
      default: return text('Preparing', '准备中');
    }
  }

  function taskHeadline(task) {
    if (task.kind === 'waiting') return pendingText(task);
    if (task.progress && task.progress.action) return actionLabel(task.progress.action);
    if (task.progress && task.progress.phase) return phaseText(task.progress.phase);
    return statusText(task);
  }

  function todoLine(task) {
    const todos = task.progress && task.progress.todos;
    if (!todos || !todos.total) return '';
    if (todos.current) return todos.current;
    if (todos.completed >= todos.total) return text('Checklist complete', '任务清单已完成');
    return '';
  }

  function todoCount(task) {
    const todos = task.progress && task.progress.todos;
    if (!todos || !todos.total) return '';
    return text(`${todos.completed}/${todos.total} done`, `${todos.completed}/${todos.total} 项`);
  }

  function el(ms) {
    const total = Math.max(0, Math.floor((Number(ms) || 0) / 1000));
    if (total >= 3600) {
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      return text(`${h}h ${m}m`, `${h} 小时 ${m} 分`);
    }
    if (total >= 60) {
      return text(`${Math.floor(total / 60)}m ${total % 60}s`, `${Math.floor(total / 60)} 分 ${total % 60} 秒`);
    }
    return text(`${total}s`, `${total} 秒`);
  }

  function relative(ms) {
    if (!Number.isFinite(ms) || ms <= 0) return '';
    const delta = Math.max(0, Date.now() - ms);
    if (delta < 60_000) return text('just now', '刚刚');
    if (delta < 3_600_000) return text(`${Math.floor(delta / 60_000)} min ago`, `${Math.floor(delta / 60_000)} 分钟前`);
    if (delta < 86_400_000) return text(`${Math.floor(delta / 3_600_000)} h ago`, `${Math.floor(delta / 3_600_000)} 小时前`);
    return new Date(ms).toLocaleDateString();
  }

  function elapsedFor(task) {
    if (task.progress && Number.isFinite(task.progress.elapsedMs)) return el(task.progress.elapsedMs);
    return relative(task.updatedAt);
  }

  function trail(task) {
    const items = task.progress && Array.isArray(task.progress.trail) ? task.progress.trail : [];
    return items.slice(-3).map((item) => {
      if (item && item.kind === 'action') {
        const label = actionLabel({ kind: item.actionKind, target: item.label, done: item.done });
        return label.length > 42 ? `${label.slice(0, 41)}…` : label;
      }
      return '';
    }).filter(Boolean).join(' → ');
  }

  function summary(tasks) {
    const waiting = tasks.filter((task) => task.kind === 'waiting').length;
    const running = tasks.filter((task) => task.kind === 'running').length;
    const done = tasks.filter((task) => task.kind === 'done').length;
    const parts = [];
    if (waiting) parts.push(text(`${waiting} need you`, `${waiting} 个待处理`));
    if (running) parts.push(text(`${running} running`, `${running} 个进行中`));
    if (done) parts.push(text(`${done} just finished`, `${done} 个刚完成`));
    return parts.join(' · ') || text('All sessions are quiet', '所有会话都在休息');
  }

  const api = {
    text,
    escapeHtml,
    taskColors,
    statusText,
    pendingText,
    actionLabel,
    phaseText,
    taskHeadline,
    todoLine,
    todoCount,
    el,
    relative,
    elapsedFor,
    trail,
    summary,
    isZh: zh,
  };
  window.Xiaoqi = api;
})();
