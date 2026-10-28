window.__ModuleLoader__.load({
  id: 'dsh-xiaoqi-pet',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'xiaoqi-pet';
    const BRIDGE_BASE = '/xiaoqi-pet';
    const STORE_KEY = 'dsh-xiaoqi-pet:v1';
    const PET_SIZE = 124;
    const ANCHOR_W = 128;
    const ANCHOR_H = 156;
    const PANEL_W = 356;

    const EMPTY_LIST = { ids: [], byId: {}, phase: 'pending', projectionsBySession: {} };
    const EMPTY_STATUS = new Map();
    const selectAll = (value) => value;
    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const TASK_COLORS = ['#2A8A80', '#D9942F', '#4F8CFF', '#A78BFA', '#E879A6', '#7CB342', '#E76F51'];

    function taskColorIndex(id) {
      let hash = 1469598103934665603n;
      for (const byte of new TextEncoder().encode(String(id))) {
        hash ^= BigInt(byte);
        hash = BigInt.asUintN(64, hash * 1099511628211n);
      }
      return Number(hash % BigInt(TASK_COLORS.length));
    }

    function taskColorMap(tasks) {
      const used = new Set();
      const result = {};
      for (const task of tasks) {
        let index = taskColorIndex(task.id);
        while (used.has(index)) index = (index + 1) % TASK_COLORS.length;
        used.add(index);
        result[task.id] = TASK_COLORS[index];
      }
      return result;
    }

    const EN = {
      appName: 'Xiaoqi',
      appTagline: 'Desk companion',
      openBoard: 'Open task board',
      closeBoard: 'Close task board',
      panelTitle: "Xiaoqi's task board",
      live: 'Live',
      close: 'Close task board',
      pin: 'Pin position',
      unpin: 'Unpin position',
      pinned: 'Pinned',
      showDesktop: 'Show on desktop',
      desktopLaunched: 'Opening the desktop pet…',
      desktopMissing: 'Desktop pet app is not installed',
      desktopLaunchFailed: 'Could not open the desktop pet',
      summaryIdle: 'All sessions are quiet',
      summaryRunning: '{count} running',
      summaryWaiting: '{count} need you',
      summaryDone: '{count} just finished',
      captionRunning: '{count} running',
      captionWaiting: '{count} need you',
      captionDone: '{count} finished',
      captionIdle: 'Quietly here',
      phaseStarting: 'Preparing',
      phaseThinking: 'Thinking',
      phaseTool: 'Running a tool',
      phaseResponding: 'Writing the answer',
      phaseDone: 'Finished',
      progressTool: 'Running {tool}',
      progressTurn: 'turn {count}',
      progressStep: 'step {count}',
      progressTools: '{count} tools',
      progressElapsedMin: '{m}m {s}s',
      progressElapsedSec: '{s}s',
      todoProgress: '{completed}/{total} done',
      todoDone: 'Checklist complete',
      actionRead: 'Read {target}',
      actionWrite: 'Write {target}',
      actionEdit: 'Edit {target}',
      actionRun: 'Run: {target}',
      actionGlob: 'Find {target}',
      actionGrep: 'Search {target}',
      actionImage: 'View {target}',
      actionPlugin: 'Plugin: {target}',
      actionInspect: 'Inspect: {target}',
      actionSearch: 'Search web: {target}',
      actionFetch: 'Fetch: {target}',
      actionSubagent: 'Delegate: {target}',
      actionWorkflow: 'Workflow: {target}',
      actionPresent: 'Present deliverables',
      actionSkill: 'Skill: {target}',
      actionTodo: 'Update checklist',
      actionSchedule: 'Schedule: {target}',
      actionTool: 'Use {target}',
      trailThinking: 'think',
      trailReply: 'answer',
      trailStart: 'start',
      sectionWaiting: 'Needs you',
      sectionRunning: 'In progress',
      sectionDone: 'Just finished',
      statusRunning: 'Working',
      statusDone: 'Completed',
      waitingApproval: 'Waiting for tool approval',
      waitingApprovalTool: 'Approval needed · {tool}',
      waitingQuestion: 'Waiting for your answer',
      waitingPlan: 'Plan needs review',
      waitingGeneric: 'Waiting for you',
      openSession: 'Open session',
      current: 'Current',
      emptyTitle: 'All sessions are quiet',
      emptyBody: 'Xiaoqi will speak up when a task starts running or needs you.',
      emptyCount: '{count} sessions are resting',
      emptyNoSessions: 'No sessions yet. Start one and Xiaoqi will keep watch.',
      loading: 'Reading sessions…',
      footerHint: 'Drag Xiaoqi anywhere · pin with the pin',
      footerPinned: 'Position pinned · click the pin to unlock',
      noticeWaiting: 'Needs you',
      noticeDone: 'Task complete',
      justNow: 'just now',
      minutesAgo: '{count} min ago',
      hoursAgo: '{count} h ago',
      dragHint: 'Drag to move',
      petMoodIdle: 'idle',
    };

    const ZH = {
      appName: '小栖',
      appTagline: '桌边伙伴',
      openBoard: '打开任务看板',
      closeBoard: '收起任务看板',
      panelTitle: '小栖的任务看板',
      live: '实时',
      close: '收起任务看板',
      pin: '固定位置',
      unpin: '解除固定',
      pinned: '已固定',
      showDesktop: '在桌面显示',
      desktopLaunched: '正在打开桌面宠物…',
      desktopMissing: '尚未安装桌面宠物 App',
      desktopLaunchFailed: '无法打开桌面宠物',
      summaryIdle: '所有会话都在休息',
      summaryRunning: '{count} 个任务进行中',
      summaryWaiting: '{count} 个任务需要你',
      summaryDone: '{count} 个任务刚完成',
      captionRunning: '{count} 进行中',
      captionWaiting: '{count} 个待处理',
      captionDone: '{count} 个已完成',
      captionIdle: '安静陪伴',
      phaseStarting: '准备中',
      phaseThinking: '思考中',
      phaseTool: '执行工具中',
      phaseResponding: '生成回复中',
      phaseDone: '已完成',
      progressTool: '正在执行 {tool}',
      progressTurn: '第 {count} 轮',
      progressStep: '第 {count} 步',
      progressTools: '{count} 个工具',
      progressElapsedMin: '{m} 分 {s} 秒',
      progressElapsedSec: '{s} 秒',
      todoProgress: '{completed}/{total} 项完成',
      todoDone: '任务清单已完成',
      actionRead: '读取 {target}',
      actionWrite: '写入 {target}',
      actionEdit: '修改 {target}',
      actionRun: '运行：{target}',
      actionGlob: '查找 {target}',
      actionGrep: '搜索 {target}',
      actionImage: '查看 {target}',
      actionPlugin: '插件操作：{target}',
      actionInspect: '检查接口：{target}',
      actionSearch: '检索：{target}',
      actionFetch: '读取网页：{target}',
      actionSubagent: '调度子任务：{target}',
      actionWorkflow: '运行工作流：{target}',
      actionPresent: '整理交付物',
      actionSkill: '加载技能：{target}',
      actionTodo: '更新任务清单',
      actionSchedule: '调整定时任务：{target}',
      actionTool: '调用 {target}',
      trailThinking: '思考',
      trailReply: '回复',
      trailStart: '开始',
      sectionWaiting: '需要你',
      sectionRunning: '进行中',
      sectionDone: '刚完成',
      statusRunning: '正在处理',
      statusDone: '已完成',
      waitingApproval: '等待确认工具调用',
      waitingApprovalTool: '等待确认 · {tool}',
      waitingQuestion: '等待你回答问题',
      waitingPlan: '计划待你确认',
      waitingGeneric: '等待你处理',
      openSession: '打开会话',
      current: '当前',
      emptyTitle: '所有会话都安静了',
      emptyBody: '任务开始运行或需要你处理时，小栖会第一时间提醒。',
      emptyCount: '{count} 个会话在休息',
      emptyNoSessions: '还没有会话。开始一个任务，小栖会替你看守。',
      loading: '正在读取会话…',
      footerHint: '拖动小栖到任意位置 · 用图钉固定',
      footerPinned: '位置已固定 · 点击图钉可解锁',
      noticeWaiting: '需要你处理',
      noticeDone: '任务完成',
      justNow: '刚刚',
      minutesAgo: '{count} 分钟前',
      hoursAgo: '{count} 小时前',
      dragHint: '拖动可移动',
      petMoodIdle: '空闲',
    };

    const CSS = `
      .xq-pet-anchor {
        position: fixed;
        z-index: 2147483001;
        width: ${ANCHOR_W}px;
        height: ${ANCHOR_H}px;
        pointer-events: none;
        user-select: none;
        -webkit-user-select: none;
        font-family: inherit;
        color: var(--dsw-alias-label-primary, #f5f6f7);
      }
      .xq-pet-anchor * { box-sizing: border-box; }
      .xq-sr {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .xq-pet {
        position: absolute;
        left: 2px;
        top: 0;
        width: ${PET_SIZE}px;
        height: ${PET_SIZE}px;
        display: block;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: grab;
        pointer-events: auto;
        touch-action: none;
        -webkit-tap-highlight-color: transparent;
      }
      .xq-pet:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary, #4f8cff);
        outline-offset: -4px;
        border-radius: 30px;
      }
      .xq-pet-anchor.is-dragging .xq-pet { cursor: grabbing; }
      .xq-pet-anchor.is-locked .xq-pet { cursor: pointer; }
      .xq-pet-anchor.is-dragging .xq-art { filter: drop-shadow(0 10px 18px rgba(0, 0, 0, .28)); transform: scale(1.035); }
      .xq-art {
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        filter: drop-shadow(0 8px 14px rgba(0, 0, 0, .18));
        transition: transform .16s ease-out, filter .16s ease-out;
      }
      .xq-art .xq-body {
        transform-box: fill-box;
        transform-origin: 50% 82%;
        animation: xq-breathe 4.6s ease-in-out infinite;
      }
      .xq-art .xq-tail {
        transform-box: fill-box;
        transform-origin: 18% 55%;
        animation: xq-tail 3.8s ease-in-out infinite;
      }
      .xq-art .xq-blink {
        transform-box: fill-box;
        transform-origin: center;
        animation: xq-blink 5.6s infinite;
      }
      .xq-art .xq-antenna {
        transform-box: fill-box;
        transform-origin: 52% 100%;
        animation: xq-sway 3.4s ease-in-out infinite;
      }
      .xq-art .xq-halo {
        transform-box: fill-box;
        transform-origin: center;
        animation: xq-halo 4.6s ease-in-out infinite;
      }
      .xq-art .xq-spark {
        opacity: 0;
        transform-box: fill-box;
        transform-origin: center;
      }
      .xq-art[data-mood="running"] .xq-body { animation-duration: .82s; animation-name: xq-work; }
      .xq-art[data-mood="running"] .xq-halo { animation-duration: 1.35s; }
      .xq-art[data-mood="waiting"] .xq-body { animation: xq-wait 2.2s ease-in-out infinite; }
      .xq-art[data-mood="waiting"] .xq-antenna { animation: xq-alert .95s ease-in-out infinite; }
      .xq-art[data-mood="waiting"] .xq-halo { animation: xq-warn-halo 1.8s ease-in-out infinite; }
      .xq-art[data-mood="done"] .xq-body { animation: xq-happy 2.8s ease-in-out infinite; }
      .xq-art[data-mood="done"] .xq-spark { opacity: 1; animation: xq-twinkle 2s ease-in-out infinite; }
      .xq-art[data-mood="done"] .xq-halo { animation-duration: 2.4s; }
      .xq-badge {
        position: absolute;
        right: 1px;
        top: 4px;
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        border: 2px solid var(--dsw-alias-bg-base, #1b1b1f);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
        line-height: 1;
        pointer-events: none;
        box-shadow: 0 3px 10px rgba(0, 0, 0, .24);
      }
      .xq-badge.waiting { background: var(--dsw-alias-state-warn-primary, #d9942f); animation: xq-badge 1.8s ease-in-out infinite; }
      .xq-badge.running { background: var(--dsw-alias-brand-primary, #2f7d78); }
      .xq-badge.done { background: var(--dsw-alias-state-success-primary, #16845e); }
      .xq-caption {
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        max-width: 140px;
        padding: 3px 9px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        border-radius: 999px;
        background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #222329) 88%, transparent);
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 11px;
        font-weight: 500;
        line-height: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
        backdrop-filter: blur(10px);
        box-shadow: 0 2px 10px rgba(0, 0, 0, .12);
      }
      .xq-pin-fab {
        position: absolute;
        left: 0;
        top: 4px;
        z-index: 3;
        width: 28px;
        height: 28px;
        padding: 0;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #222329) 92%, transparent);
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        cursor: pointer;
        opacity: 0;
        pointer-events: auto;
        transition: opacity .14s ease, color .14s ease, background .14s ease;
        backdrop-filter: blur(10px);
      }
      .xq-pet-anchor:hover .xq-pin-fab,
      .xq-pin-fab:focus-visible,
      .xq-pin-fab.is-locked { opacity: 1; }
      .xq-pin-fab:hover { color: var(--dsw-alias-label-primary, #fff); background: var(--dsw-alias-bg-layer-2, #2d2e34); }
      .xq-pin-fab.is-locked { color: var(--dsw-alias-brand-primary, #4f8cff); border-color: color-mix(in srgb, var(--dsw-alias-brand-primary, #4f8cff) 45%, transparent); }
      .xq-pin-fab:focus-visible,
      .xq-icon-btn:focus-visible,
      .xq-row:focus-visible,
      .xq-notice:focus-visible {
        outline: 2px solid var(--dsw-alias-brand-primary, #4f8cff);
        outline-offset: 2px;
      }
      .xq-notices {
        position: absolute;
        width: min(296px, calc(100vw - 24px));
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
      }
      .xq-notices[data-side="left"] { left: 0; right: auto; }
      .xq-notices[data-side="right"] { left: auto; right: 0; }
      .xq-notice {
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 9px;
        padding: 10px 12px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        border-radius: 16px;
        background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #222329) 96%, transparent);
        color: var(--dsw-alias-label-primary, #f5f6f7);
        text-align: left;
        font: inherit;
        cursor: pointer;
        pointer-events: auto;
        box-shadow: 0 12px 30px rgba(0, 0, 0, .22);
        backdrop-filter: blur(18px);
        animation: xq-rise .22s ease-out both;
      }
      .xq-notice:hover { background: var(--dsw-alias-bg-layer-2, #2d2e34); }
      .xq-notice-mark {
        flex: 0 0 20px;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        margin-top: 1px;
      }
      .xq-notice.waiting .xq-notice-mark { background: var(--dsw-alias-state-warn-primary, #d9942f); }
      .xq-notice.done .xq-notice-mark { background: var(--dsw-alias-state-success-primary, #16845e); }
      .xq-notice-copy { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .xq-notice-title {
        display: block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12px;
        font-weight: 650;
        line-height: 18px;
      }
      .xq-notice-body {
        display: block;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 11px;
        line-height: 16px;
      }
      .xq-panel {
        position: fixed;
        z-index: 2147483002;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        border-radius: 18px;
        background: color-mix(in srgb, var(--dsw-alias-bg-overlay, #222329) 97%, transparent);
        color: var(--dsw-alias-label-primary, #f5f6f7);
        box-shadow: 0 20px 60px rgba(0, 0, 0, .3);
        backdrop-filter: blur(22px);
        pointer-events: auto;
        font-family: inherit;
        animation: xq-pop .18s ease-out both;
      }
      .xq-panel * { box-sizing: border-box; }
      .xq-panel-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 14px 14px 10px 16px;
      }
      .xq-panel-heading { min-width: 0; }
      .xq-name-line { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .xq-name { font-size: 15px; font-weight: 700; line-height: 22px; letter-spacing: -.2px; }
      .xq-live {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 1px 7px;
        border-radius: 999px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 9px;
        font-weight: 600;
        line-height: 15px;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .xq-live-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: var(--dsw-alias-label-secondary, #b8bbc2);
      }
      .xq-live.is-active .xq-live-dot {
        background: var(--dsw-alias-state-success-primary, #16845e);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-success-primary, #16845e) 18%, transparent);
        animation: xq-live 1.8s ease-in-out infinite;
      }
      .xq-summary {
        margin-top: 2px;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 11px;
        line-height: 17px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .xq-head-actions { display: flex; align-items: center; gap: 4px; flex: none; }
      .xq-icon-btn {
        width: 28px;
        height: 28px;
        padding: 0;
        border: 1px solid transparent;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        cursor: pointer;
      }
      .xq-icon-btn:hover { background: color-mix(in srgb, var(--dsw-alias-label-primary, #fff) 8%, transparent); color: var(--dsw-alias-label-primary, #fff); }
      .xq-icon-btn.is-on { color: var(--dsw-alias-brand-primary, #4f8cff); background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4f8cff) 12%, transparent); }
      .xq-panel-body {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        overscroll-behavior: contain;
        padding: 0 10px 8px;
        scrollbar-width: thin;
        scrollbar-color: var(--dsw-alias-border-l2, rgba(127, 127, 140, .4)) transparent;
      }
      .xq-panel-body::-webkit-scrollbar { width: 8px; }
      .xq-panel-body::-webkit-scrollbar-thumb {
        border: 2px solid transparent;
        border-radius: 999px;
        background-clip: padding-box;
        background-color: var(--dsw-alias-border-l2, rgba(127, 127, 140, .4));
      }
      .xq-section + .xq-section { margin-top: 8px; }
      .xq-section-label {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 6px 6px 4px;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 10px;
        font-weight: 650;
        line-height: 16px;
        letter-spacing: .06em;
        text-transform: uppercase;
      }
      .xq-section-count { font-variant-numeric: tabular-nums; font-weight: 600; opacity: .8; }
      .xq-list { display: flex; flex-direction: column; gap: 6px; }
      .xq-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 9px 8px 9px 10px;
        border: 1px solid color-mix(in srgb, var(--xq-task-color, var(--dsw-alias-border-l1, #7f7f8c)) 38%, transparent);
        border-left: 3px solid var(--xq-task-color, var(--dsw-alias-border-l2, #7f7f8c));
        border-radius: 12px;
        background: color-mix(in srgb, var(--xq-task-color, transparent) 5%, transparent);
        color: inherit;
        text-align: left;
        font: inherit;
        cursor: pointer;
      }
      .xq-row:hover { background: color-mix(in srgb, var(--xq-task-color, var(--dsw-alias-label-primary)) 10%, transparent); }
      .xq-row-dot {
        flex: 0 0 8px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--dsw-alias-state-idle-primary, #7b7e87);
      }
      .xq-row-dot.waiting {
        background: var(--dsw-alias-state-warn-primary, #d9942f);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d9942f) 16%, transparent);
        animation: xq-live 1.9s ease-in-out infinite;
      }
      .xq-row-dot.running {
        background: var(--dsw-alias-brand-primary, #2f7d78);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--dsw-alias-brand-primary, #2f7d78) 16%, transparent);
        animation: xq-live 1.5s ease-in-out infinite;
      }
      .xq-row-dot.done { background: var(--dsw-alias-state-success-primary, #16845e); }
      .xq-row .xq-row-dot { background: var(--xq-task-color, var(--dsw-alias-state-idle-primary, #7b7e87)); }
      .xq-row-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .xq-row-title-line { display: flex; align-items: center; gap: 6px; min-width: 0; }
      .xq-row-title {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 12.5px;
        font-weight: 600;
        line-height: 18px;
      }
      .xq-current {
        flex: none;
        padding: 0 5px;
        border-radius: 4px;
        background: color-mix(in srgb, var(--dsw-alias-brand-primary, #4f8cff) 14%, transparent);
        color: var(--dsw-alias-brand-primary, #4f8cff);
        font-size: 8px;
        font-weight: 700;
        line-height: 15px;
        letter-spacing: .04em;
        text-transform: uppercase;
      }
      .xq-row-meta {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 10.5px;
        line-height: 16px;
      }
      .xq-row-progress {
        display: flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        margin-top: 2px;
      }
      .xq-row-todo {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        min-width: 0;
        margin-top: 3px;
        padding-top: 4px;
        border-top: 1px solid color-mix(in srgb, var(--dsw-alias-label-primary, #f5f6f7) 8%, transparent);
      }
      .xq-row-todo-text {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: color-mix(in srgb, var(--dsw-alias-label-primary, #f5f6f7) 88%, transparent);
        font-size: 10.8px;
        font-weight: 600;
        line-height: 15px;
      }
      .xq-row-todo-text::before {
        content: '◷';
        margin-right: 5px;
        color: var(--dsw-alias-brand-primary, #4f8cff);
      }
      .xq-row-todo-count {
        flex: none;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 9.6px;
        line-height: 15px;
      }
      .xq-row-phase {
        flex: 1;
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 11.2px;
        font-weight: 700;
        line-height: 16px;
        white-space: nowrap;
      }
      .xq-row-elapsed {
        flex: none;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 9.8px;
        line-height: 16px;
        font-variant-numeric: tabular-nums;
      }
      .xq-row-phase::before {
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: currentColor;
      }
      .xq-row-phase.thinking { color: var(--dsw-alias-brand-primary, #4f8cff); }
      .xq-row-phase.tool { color: var(--dsw-alias-state-warn-primary, #d9942f); }
      .xq-row-phase.responding { color: var(--dsw-alias-state-success-primary, #16845e); }
      .xq-row-phase.starting { color: var(--dsw-alias-label-secondary, #b8bbc2); }
      .xq-row-progress-meta {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: color-mix(in srgb, var(--dsw-alias-label-primary, #f5f6f7) 82%, transparent);
        font-size: 10.6px;
        line-height: 16px;
      }
      .xq-row-trail {
        display: block;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: color-mix(in srgb, var(--dsw-alias-label-primary, #f5f6f7) 68%, transparent);
        font-size: 10.4px;
        font-weight: 500;
        line-height: 15px;
      }
      .xq-row-open {
        flex: none;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        height: 20px;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        opacity: 0;
        transform: translateX(-3px);
        transition: opacity .12s ease, transform .12s ease;
      }
      .xq-row:hover .xq-row-open,
      .xq-row:focus-visible .xq-row-open { opacity: 1; transform: translateX(0); }
      .xq-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        padding: 26px 22px 30px;
        text-align: center;
      }
      .xq-empty-mark {
        width: 44px;
        height: 44px;
        margin-bottom: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        border: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .3));
        background: color-mix(in srgb, var(--dsw-alias-brand-primary, #2f7d78) 10%, transparent);
        color: var(--dsw-alias-brand-primary, #4f8cff);
      }
      .xq-empty strong { font-size: 12.5px; font-weight: 650; line-height: 18px; }
      .xq-empty p {
        max-width: 260px;
        margin: 0;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 11px;
        line-height: 17px;
      }
      .xq-empty small {
        margin-top: 2px;
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 10px;
        line-height: 15px;
        opacity: .8;
      }
      .xq-panel-foot {
        flex: none;
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: 32px;
        padding: 7px 14px;
        border-top: 1px solid var(--dsw-alias-border-l1, rgba(127, 127, 140, .22));
        color: var(--dsw-alias-label-secondary, #b8bbc2);
        font-size: 10px;
        line-height: 16px;
      }
      .xq-foot-pin { display: flex; align-items: center; flex: none; opacity: .8; }
      .xq-panel-foot span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      @keyframes xq-breathe {
        0%, 100% { transform: translateY(0) scaleY(1); }
        50% { transform: translateY(-2.5px) scaleY(1.012); }
      }
      @keyframes xq-work {
        0%, 100% { transform: translateY(0) rotate(-1deg); }
        25% { transform: translateY(-3px) rotate(1.2deg); }
        60% { transform: translateY(-1px) rotate(-.6deg); }
      }
      @keyframes xq-wait {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      @keyframes xq-happy {
        0%, 100% { transform: translateY(0) scaleY(1); }
        35% { transform: translateY(-5px) scaleY(1.035); }
        55% { transform: translateY(0) scaleY(.98); }
        70% { transform: translateY(-1.5px) scaleY(1.01); }
      }
      @keyframes xq-tail {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(5deg); }
      }
      @keyframes xq-sway {
        0%, 100% { transform: rotate(-2deg); }
        50% { transform: rotate(2.5deg); }
      }
      @keyframes xq-alert {
        0%, 100% { transform: rotate(-7deg); }
        50% { transform: rotate(8deg); }
      }
      @keyframes xq-blink {
        0%, 93%, 100% { transform: scaleY(1); }
        95%, 97% { transform: scaleY(.08); }
      }
      @keyframes xq-halo {
        0%, 100% { opacity: .4; transform: scale(1); }
        50% { opacity: .62; transform: scale(1.045); }
      }
      @keyframes xq-warn-halo {
        0%, 100% { opacity: .4; transform: scale(1); }
        50% { opacity: .82; transform: scale(1.07); }
      }
      @keyframes xq-twinkle {
        0%, 100% { opacity: .15; transform: scale(.72) rotate(-8deg); }
        45% { opacity: 1; transform: scale(1) rotate(4deg); }
      }
      @keyframes xq-badge {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes xq-live {
        0%, 100% { opacity: 1; }
        50% { opacity: .38; }
      }
      @keyframes xq-pop {
        from { opacity: 0; transform: translateY(5px) scale(.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes xq-rise {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @media (prefers-reduced-motion: reduce) {
        .xq-art *,
        .xq-badge,
        .xq-live-dot,
        .xq-row-dot,
        .xq-panel,
        .xq-notice {
          animation: none !important;
          transition: none !important;
        }
      }
    `;

    function projectName(cwd) {
      if (typeof cwd !== 'string' || cwd.trim() === '') return '';
      const parts = cwd.replace(/[\\/]+$/, '').split(/[\\/]/);
      return parts[parts.length - 1] || cwd;
    }

    function timeAgo(updatedAt, t, now) {
      if (!Number.isFinite(updatedAt) || updatedAt <= 0) return '';
      const delta = Math.max(0, now - updatedAt);
      if (delta < 60_000) return t('justNow');
      if (delta < 3_600_000) return t('minutesAgo', { count: Math.max(1, Math.floor(delta / 60_000)) });
      if (delta < 86_400_000) return t('hoursAgo', { count: Math.max(1, Math.floor(delta / 3_600_000)) });
      return '';
    }

    function waitingLabel(task, t) {
      const kind = task.pendingKind;
      if (kind === 'approval') {
        return task.pendingTool ? t('waitingApprovalTool', { tool: task.pendingTool }) : t('waitingApproval');
      }
      if (kind === 'question') return t('waitingQuestion');
      if (kind === 'plan-review') return t('waitingPlan');
      return t('waitingGeneric');
    }

    function taskMeta(task, t, now, progress) {
      const detail = task.kind === 'waiting' ? waitingLabel(task, t) : task.kind === 'done' ? t('statusDone') : t('statusRunning');
      const age = progress && task.kind === 'running' ? '' : timeAgo(task.updatedAt, t, now);
      return [task.project, detail, age].filter(Boolean).join(' · ');
    }

    function elapsedLabel(progress, t) {
      const total = Math.max(0, Math.floor((progress.elapsedMs || 0) / 1000));
      if (total >= 60) {
        return t('progressElapsedMin', { m: Math.floor(total / 60), s: total % 60 });
      }
      return t('progressElapsedSec', { s: total });
    }

    function actionLabel(action, t) {
      if (!action || !action.kind) return '';
      const target = typeof action.target === 'string' ? action.target : '';
      const map = {
        read: 'actionRead',
        write: 'actionWrite',
        edit: 'actionEdit',
        bash: 'actionRun',
        glob: 'actionGlob',
        grep: 'actionGrep',
        image: 'actionImage',
        plugin: 'actionPlugin',
        inspect: 'actionInspect',
        search: 'actionSearch',
        fetch: 'actionFetch',
        subagent: 'actionSubagent',
        workflow: 'actionWorkflow',
        present: 'actionPresent',
        skill: 'actionSkill',
        todo: 'actionTodo',
        schedule: 'actionSchedule',
        tool: 'actionTool',
      };
      const key = map[action.kind] || 'actionTool';
      const label = target ? t(key, { target }) : t(key, { target: action.kind || 'tool' });
      return action.done ? `${label} ✓` : label;
    }

    function phaseLabel(progress, t) {
      if (!progress) return '';
      if (progress.phase === 'tool' && progress.tool) return t('progressTool', { tool: progress.tool });
      if (progress.phase === 'thinking') return t('phaseThinking');
      if (progress.phase === 'responding') return t('phaseResponding');
      if (progress.phase === 'done') return t('phaseDone');
      return t('phaseStarting');
    }

    function progressHeadline(progress, t) {
      if (!progress) return '';
      if (progress.todos && progress.todos.current) return progress.todos.current;
      if (progress.action) return actionLabel(progress.action, t);
      return phaseLabel(progress, t);
    }

    function progressDetail(progress, t) {
      return progress ? elapsedLabel(progress, t) : '';
    }

    function progressTrail(progress, t) {
      if (!progress || !Array.isArray(progress.trail)) return '';
      return progress.trail.slice(-3).map((item) => {
        if (!item) return '';
        if (item.kind === 'action') {
          const label = actionLabel({
            kind: item.actionKind,
            target: item.label,
            done: item.done,
          }, t);
          return label.length > 42 ? `${label.slice(0, 41)}…` : label;
        }
        if (item.kind === 'tool') return item.label || t('phaseTool');
        if (item.kind === 'toolDone') return `${item.label || t('phaseTool')} ✓`;
        if (item.kind === 'thinking') return t('trailThinking');
        if (item.kind === 'reply') return t('trailReply');
        if (item.kind === 'turn') return t('trailStart');
        return item.label || '';
      }).filter(Boolean).join('  →  ');
    }

    function progressShort(progress, t) {
      if (!progress) return '';
      if (progress.todos && progress.todos.current) {
        const text = progress.todos.current;
        return text.length > 22 ? `${text.slice(0, 21)}…` : text;
      }
      if (progress.action) {
        const text = actionLabel(progress.action, t);
        return text.length > 26 ? `${text.slice(0, 25)}…` : text;
      }
      if (progress.phase === 'tool' && progress.tool) {
        const tool = progress.tool.length > 12 ? `${progress.tool.slice(0, 11)}…` : progress.tool;
        return t('progressTool', { tool });
      }
      if (progress.phase === 'thinking') return t('phaseThinking');
      if (progress.phase === 'responding') return t('phaseResponding');
      if (progress.phase === 'done') return t('phaseDone');
      return t('phaseStarting');
    }

    function countAllSessions(list) {
      if (!list || !Array.isArray(list.ids) || !list.byId) return 0;
      let count = 0;
      for (const id of list.ids) {
        const row = list.byId[id];
        if (row && row.origin !== 'subagent' && !row.blank) count += 1;
      }
      return count;
    }

    function deriveTasks(list, statuses, dismissed) {
      if (!list || !Array.isArray(list.ids) || !list.byId) return [];
      const tasks = [];
      for (const id of list.ids) {
        const row = list.byId[id];
        if (!row || row.origin === 'subagent' || row.blank) continue;
        let status;
        try {
          status = statuses && typeof statuses.get === 'function' ? statuses.get(id) : undefined;
        } catch {
          status = undefined;
        }
        const running = typeof status?.running === 'boolean' ? status.running : Boolean(row.running);
        const pending = status?.pendingInteraction;
        const pendingKey = pending && pending.key != null ? String(pending.key) : '';
        const completionUnread = Boolean(status?.completionUnread);
        let kind = pending ? 'waiting' : running ? 'running' : completionUnread ? 'done' : 'idle';
        if (kind === 'idle') continue;
        if (kind === 'done' && dismissed.has(id)) continue;
        tasks.push({
          id,
          title: row.displayTitle || row.title || id,
          project: projectName(row.cwd),
          running,
          kind,
          pendingKey,
          pendingKind: pending?.kind ? String(pending.kind) : '',
          pendingTool: pending?.toolName ? String(pending.toolName) : '',
          updatedAt: Number(row.updatedAt) || 0,
          current: Boolean(row.retainedBy && row.retainedBy.mainView > 0),
        });
      }
      const priority = { waiting: 0, running: 1, done: 2 };
      tasks.sort((left, right) => (
        (priority[left.kind] - priority[right.kind]) ||
        (Number(right.current) - Number(left.current)) ||
        (right.updatedAt - left.updatedAt) ||
        left.title.localeCompare(right.title)
      ));
      return tasks;
    }

    function readPrefs() {
      const fallback = { x: 0.025, y: 0.82, locked: false };
      try {
        const raw = window.localStorage.getItem(STORE_KEY);
        if (!raw) return fallback;
        const stored = JSON.parse(raw);
        if (!stored || typeof stored !== 'object') return fallback;
        return {
          x: Number.isFinite(stored.x) ? clamp(stored.x, 0, 1) : fallback.x,
          y: Number.isFinite(stored.y) ? clamp(stored.y, 0, 1) : fallback.y,
          locked: Boolean(stored.locked),
        };
      } catch {
        return fallback;
      }
    }

    function writePrefs(value) {
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(value));
      } catch {
        // A blocked storage backend must not take the companion down.
      }
    }

    function useExternalSource(source, fallback) {
      const subscribe = React.useCallback((onChange) => {
        if (!source || typeof source.subscribe !== 'function') return () => {};
        try {
          return source.subscribe(onChange);
        } catch {
          return () => {};
        }
      }, [source]);
      const getSnapshot = React.useCallback(() => {
        if (!source || typeof source.getSnapshot !== 'function') return fallback;
        try {
          const value = source.getSnapshot();
          return value == null ? fallback : value;
        } catch {
          return fallback;
        }
      }, [source, fallback]);
      return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    }

    function useViewport() {
      const [viewport, setViewport] = React.useState(() => ({
        width: typeof window === 'undefined' ? 1280 : window.innerWidth,
        height: typeof window === 'undefined' ? 800 : window.innerHeight,
      }));
      React.useEffect(() => {
        const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
      }, []);
      return viewport;
    }

    function useNow(active) {
      const [now, setNow] = React.useState(() => Date.now());
      React.useEffect(() => {
        if (!active) return undefined;
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
      }, [active]);
      return now;
    }

    function PinIcon({ filled }) {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: filled
            ? 'M9.2 1.5c.5-.5 1.3-.5 1.8 0l3.5 3.5c.5.5.5 1.3 0 1.8l-1.1 1.1-.9-.3-2.5 2.5.2 2.1-1.4 1.4-2.8-2.8-3.1 3.1-.7-.7 3.1-3.1L2.5 7.3 3.9 5.9l2.1.2L8.5 3.6 8.2 2.7Z'
            : 'M9.2 1.5c.5-.5 1.3-.5 1.8 0l3.5 3.5c.5.5.5 1.3 0 1.8l-1.1 1.1-.9-.3-2.5 2.5.2 2.1-1.4 1.4-2.8-2.8-3.1 3.1-.7-.7 3.1-3.1L2.5 7.3 3.9 5.9l2.1.2L8.5 3.6 8.2 2.7Z',
          fill: filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: filled ? 0 : 1.2,
          strokeLinejoin: 'round',
        }));
    }

    function CloseIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true', focusable: 'false' },
        h('path', { d: 'm4 4 8 8M12 4l-8 8', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' }));
    }

    function DesktopIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 15, height: 15, 'aria-hidden': 'true', focusable: 'false' },
        h('rect', { x: 1.8, y: 2.3, width: 12.4, height: 8.2, rx: 1.6, fill: 'none', stroke: 'currentColor', strokeWidth: 1.3 }),
        h('path', { d: 'M5 13.3h6M8 10.8v2.2', fill: 'none', stroke: 'currentColor', strokeWidth: 1.3, strokeLinecap: 'round' }),
        h('path', { d: 'M4.3 5.2h3.2M4.3 7.2h5.6', stroke: 'currentColor', strokeWidth: 1, strokeLinecap: 'round', opacity: .65 }));
    }

    function ArrowIcon() {
      return h('svg', { viewBox: '0 0 16 16', width: 14, height: 14, 'aria-hidden': 'true', focusable: 'false' },
        h('path', { d: 'M5.5 3.5 10 8l-4.5 4.5', fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }));
    }

    function SparkIcon() {
      return h('svg', { viewBox: '0 0 28 28', width: 26, height: 26, 'aria-hidden': 'true', focusable: 'false' },
        h('path', {
          d: 'M14 2.5c.7 5.4 2.8 7.6 8.2 8.3-5.4.7-7.5 2.9-8.2 8.3-.7-5.4-2.8-7.6-8.2-8.3 5.4-.7 7.5-2.9 8.2-8.3Z',
          fill: 'currentColor',
        }),
        h('path', {
          d: 'M21.8 17.2c.3 2.6 1.3 3.6 3.9 3.9-2.6.3-3.6 1.3-3.9 3.9-.3-2.6-1.3-3.6-3.9-3.9 2.6-.3 3.6-1.3 3.9-3.9Z',
          fill: 'currentColor',
          opacity: .7,
        }));
    }

    function PetArt({ mood }) {
      return h('svg', {
        className: 'xq-art',
        viewBox: '0 0 120 120',
        'data-mood': mood,
        'aria-hidden': 'true',
        focusable: 'false',
      },
      h('defs', null,
        h('radialGradient', { id: 'xq-halo-g', cx: '50%', cy: '50%', r: '50%' },
          h('stop', { offset: '0', stopColor: '#8CE7D2', stopOpacity: '.55' }),
          h('stop', { offset: '1', stopColor: '#8CE7D2', stopOpacity: '0' })),
        h('linearGradient', { id: 'xq-fur-g', x1: '39', y1: '38', x2: '82', y2: '104', gradientUnits: 'userSpaceOnUse' },
          h('stop', { offset: '0', stopColor: '#2D8B81' }),
          h('stop', { offset: '1', stopColor: '#175B57' })),
        h('linearGradient', { id: 'xq-face-g', x1: '42', y1: '49', x2: '77', y2: '88', gradientUnits: 'userSpaceOnUse' },
          h('stop', { offset: '0', stopColor: '#FFF8EB' }),
          h('stop', { offset: '1', stopColor: '#F1DFC2' }))),
      h('circle', { className: 'xq-halo', cx: 60, cy: 63, r: 43, fill: 'url(#xq-halo-g)' }),
      h('ellipse', { cx: 60, cy: 108, rx: 27, ry: 4.5, fill: '#0B2827', opacity: .16 }),
      h('g', { className: 'xq-tail' },
        h('path', {
          d: 'M88 90c14 2 21-6 19-14-1.5-6-9-8-12-3-2.5 4 1 8 5 7',
          fill: 'none',
          stroke: '#174F4C',
          strokeWidth: 8.5,
          strokeLinecap: 'round',
        })),
      h('g', { className: 'xq-antenna' },
        h('path', { d: 'M60 42c0-9 1-14 7-18', fill: 'none', stroke: '#123E3B', strokeWidth: 2.4, strokeLinecap: 'round' }),
        h('circle', { cx: 68, cy: 22, r: 8.5, fill: '#FFD27D', opacity: .18 }),
        h('circle', { cx: 68, cy: 22, r: 5.4, fill: '#FFD27D' }),
        h('circle', { cx: 66.5, cy: 20.5, r: 1.6, fill: '#FFF8E8', opacity: .85 })),
      h('g', { className: 'xq-body' },
        h('path', {
          d: 'M35 50 31 29c-.6-3 2.6-4.7 4.9-2.7L52 39Z',
          fill: '#1F6A65',
          stroke: '#123E3B',
          strokeWidth: 2.4,
          strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M85 50 89 29c.6-3-2.6-4.7-4.9-2.7L68 39Z',
          fill: '#1F6A65',
          stroke: '#123E3B',
          strokeWidth: 2.4,
          strokeLinejoin: 'round',
        }),
        h('path', { d: 'M36.5 43.5 34.5 32l9.5 6.5Z', fill: '#E9A27B' }),
        h('path', { d: 'M83.5 43.5 85.5 32l-9.5 6.5Z', fill: '#E9A27B' }),
        h('path', {
          d: 'M31 58c0-13 13-21 29-21s29 8 29 21v25c0 13-12 21-29 21s-29-8-29-21Z',
          fill: 'url(#xq-fur-g)',
          stroke: '#123E3B',
          strokeWidth: 2.4,
          strokeLinejoin: 'round',
        }),
        h('ellipse', { cx: 60, cy: 69, rx: 23, ry: 19, fill: 'url(#xq-face-g)' }),
        h('circle', { cx: 43, cy: 77, r: 4, fill: '#EC9C76', opacity: .38 }),
        h('circle', { cx: 77, cy: 77, r: 4, fill: '#EC9C76', opacity: .38 }),
        h('g', { className: 'xq-blink' },
          h('circle', { cx: 52, cy: 67, r: 3.1, fill: '#173E3B' }),
          h('circle', { cx: 68, cy: 67, r: 3.1, fill: '#173E3B' }),
          h('circle', { cx: 53, cy: 65.8, r: 1, fill: '#FFFFFF' }),
          h('circle', { cx: 69, cy: 65.8, r: 1, fill: '#FFFFFF' })),
        h('path', { d: 'M56 77.5c2.4 2.3 5.6 2.3 8 0', fill: 'none', stroke: '#173E3B', strokeWidth: 2, strokeLinecap: 'round' }),
        h('path', { d: 'M36 89c15 6 33 6 48 0v5c-15 6-33 6-48 0Z', fill: '#E9864C' }),
        h('path', { d: 'M75 94l6 10-8-2Z', fill: '#D9763E' }),
        h('path', { d: 'M40 92c12 4 28 4 40 0', fill: 'none', stroke: '#F3AA73', strokeWidth: 1.4, strokeLinecap: 'round', opacity: .8 }),
        h('ellipse', { cx: 47, cy: 103.5, rx: 8, ry: 4, fill: '#E8D6BA' }),
        h('ellipse', { cx: 73, cy: 103.5, rx: 8, ry: 4, fill: '#E8D6BA' })),
      h('g', { className: 'xq-spark' },
        h('path', { d: 'M27 37l1.7 5.3L34 44l-5.3 1.7L27 51l-1.7-5.3L20 44l5.3-1.7Z', fill: '#FFD27D' }),
        h('path', { d: 'M95 54l1.2 3.8L100 59l-3.8 1.2L95 64l-1.2-3.8L90 59l3.8-1.2Z', fill: '#FFD27D', opacity: .8 }),
        h('circle', { cx: 88, cy: 43, r: 1.7, fill: '#A6F0DD' })));
    }

    function TaskRow({ task, t, now, onOpen, progress, accent }) {
      const meta = taskMeta(task, t, now, progress);
      const actionText = progress && progress.action
        ? actionLabel(progress.action, t)
        : phaseLabel(progress, t);
      const todoText = progress && progress.todos
        ? (progress.todos.current || (progress.todos.total > 0 && progress.todos.completed >= progress.todos.total ? t('todoDone') : ''))
        : '';
      const todoCount = progress && progress.todos && progress.todos.total > 0
        ? t('todoProgress', { completed: progress.todos.completed, total: progress.todos.total })
        : '';
      const trail = progressTrail(progress, t);
      return h('button', {
        type: 'button',
        className: 'xq-row',
        style: { '--xq-task-color': accent || 'var(--dsw-alias-label-secondary, #b8bbc2)' },
        title: `${task.title}${task.project ? ` — ${task.project}` : ''}\n${t('openSession')}`,
        onClick: () => onOpen(task),
      },
      h('span', { className: `xq-row-dot ${task.kind}`, 'aria-hidden': 'true' }),
      h('span', { className: 'xq-row-copy' },
        h('span', { className: 'xq-row-title-line' },
          h('span', { className: 'xq-row-title' }, task.title),
          task.current ? h('span', { className: 'xq-current' }, t('current')) : null),
        h('span', { className: 'xq-row-meta' }, meta),
        todoText
          ? h('span', { className: 'xq-row-todo' },
            h('span', { className: 'xq-row-todo-text' }, todoText),
            h('span', { className: 'xq-row-todo-count' }, todoCount))
          : null,
        progress
          ? h('span', { className: 'xq-row-progress' },
            h('span', { className: `xq-row-phase ${progress.phase}` }, actionText),
            h('span', { className: 'xq-row-elapsed' }, elapsedLabel(progress, t)))
          : null,
        trail ? h('span', { className: 'xq-row-trail' }, trail) : null),
      h('span', { className: 'xq-row-open', 'aria-hidden': 'true' }, h(ArrowIcon)));
    }

    function XiaoqiPet({ services, locale, openSession, useSessions, useSessionStatus }) {
      const hookList = typeof useSessions === 'function' ? useSessions(selectAll) : null;
      const hookStatuses = typeof useSessionStatus === 'function' ? useSessionStatus(selectAll) : null;
      const fallbackList = useExternalSource(services?.sessions?.list, EMPTY_LIST);
      const fallbackStatuses = useExternalSource(services?.uiSession?.sessionStatus, EMPTY_STATUS);
      const list = hookList || fallbackList || EMPTY_LIST;
      const statuses = hookStatuses || fallbackStatuses || EMPTY_STATUS;

      const localeSnapshot = React.useSyncExternalStore(
        React.useCallback((onChange) => locale.subscribe(onChange), [locale]),
        React.useCallback(() => locale.getSnapshot(), [locale]),
        React.useCallback(() => locale.getSnapshot(), [locale]),
      );
      const t = React.useMemo(() => locale.bind(NS), [locale]);
      void localeSnapshot;

      const viewport = useViewport();
      const initial = React.useMemo(readPrefs, []);
      const [pos, setPos] = React.useState({ x: initial.x, y: initial.y });
      const [locked, setLocked] = React.useState(initial.locked);
      const [open, setOpen] = React.useState(false);
      const [notices, setNotices] = React.useState([]);
      const [dismissed, setDismissed] = React.useState(() => new Set());
      const [dragging, setDragging] = React.useState(false);
      const [desktopMessage, setDesktopMessage] = React.useState('');
      const [desktopActive, setDesktopActive] = React.useState(false);
      const [progressById, setProgressById] = React.useState({});

      const posRef = React.useRef(pos);
      const openRef = React.useRef(open);
      const petRef = React.useRef(null);
      const dragRef = React.useRef(null);
      const suppressClickRef = React.useRef(false);
      const previousRef = React.useRef(null);

      React.useEffect(() => { posRef.current = pos; }, [pos]);
      React.useEffect(() => { openRef.current = open; }, [open]);

      const tasks = deriveTasks(list, statuses, dismissed);
      const waiting = tasks.filter((task) => task.kind === 'waiting');
      const running = tasks.filter((task) => task.kind === 'running');
      const done = tasks.filter((task) => task.kind === 'done');
      const totalSessions = countAllSessions(list);
      const now = useNow(tasks.length > 0);

      const maxLeft = Math.max(0, viewport.width - ANCHOR_W);
      const maxTop = Math.max(0, viewport.height - ANCHOR_H);
      const left = Math.round(clamp(pos.x, 0, 1) * maxLeft);
      const top = Math.round(clamp(pos.y, 0, 1) * maxTop);

      const panelWidth = Math.min(PANEL_W, Math.max(0, viewport.width - 24));
      const panelLeft = Math.round(clamp(left + PET_SIZE / 2 - panelWidth / 2, 12, Math.max(12, viewport.width - panelWidth - 12)));
      const aboveSpace = Math.max(0, top - 26);
      const belowSpace = Math.max(0, viewport.height - (top + ANCHOR_H) - 26);
      const placeAbove = aboveSpace >= 260 || aboveSpace >= belowSpace;
      const availableHeight = placeAbove ? aboveSpace : belowSpace;
      const panelStyle = placeAbove
        ? { left: `${panelLeft}px`, bottom: `${viewport.height - top + 14}px`, width: `${panelWidth}px`, maxHeight: `${Math.max(160, Math.min(520, availableHeight))}px` }
        : { left: `${panelLeft}px`, top: `${top + ANCHOR_H + 14}px`, width: `${panelWidth}px`, maxHeight: `${Math.max(160, Math.min(520, availableHeight))}px` };
      const noticeAbove = top > 190;
      const noticeStyle = {
        ...(noticeAbove ? { bottom: 'calc(100% + 18px)' } : { top: 'calc(100% + 18px)' }),
        ...(pos.x > 0.5 ? { right: 0 } : { left: 0 }),
      };

      const taskSignature = tasks.map((task) => `${task.id}:${task.kind}:${task.pendingKey}:${task.running ? 1 : 0}`).join('|');
      React.useEffect(() => {
        const current = new Map(tasks.map((task) => [task.id, {
          running: task.running,
          pendingKey: task.pendingKey,
          kind: task.kind,
        }]));
        const previous = previousRef.current;
        previousRef.current = current;
        if (!previous || openRef.current) return;
        const fresh = [];
        for (const task of tasks) {
          const old = previous.get(task.id);
          if (!old) {
            if (task.kind === 'waiting') fresh.push(noticeFor(task, 'waiting', t));
            continue;
          }
          if (task.kind === 'waiting' && task.pendingKey !== old.pendingKey) {
            fresh.push(noticeFor(task, 'waiting', t));
          } else if (old.running && !task.running) {
            if (!task.current) fresh.push(noticeFor(task, 'done', t));
          }
        }
        if (fresh.length === 0) return;
        setNotices((existing) => {
          const replaced = existing.filter((item) => (
            !fresh.some((next) => next.sessionId === item.sessionId && next.kind === item.kind)
          ));
          return [...replaced, ...fresh].slice(-2);
        });
      }, [taskSignature]);

      const bridgeSignature = tasks.map((task) => [
        task.id, task.kind, task.current ? 1 : 0, task.pendingKey, task.pendingKind, task.pendingTool, task.updatedAt,
      ].join(':')).join('|');
      React.useEffect(() => {
        const payload = JSON.stringify({
          schemaVersion: 1,
          tasks: tasks.map((task) => ({
            id: task.id,
            title: task.title,
            project: task.project,
            kind: task.kind,
            pendingKind: task.pendingKind,
            pendingTool: task.pendingTool,
            current: task.current,
            updatedAt: task.updatedAt,
          })),
        });
        let stopped = false;
        const publish = () => {
          if (stopped) return;
          try {
            void fetch(`${BRIDGE_BASE}/api/client-state`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: payload,
              keepalive: true,
            }).catch(() => {});
          } catch {
            // The desktop bridge is optional; the in-page pet keeps working.
          }
        };
        publish();
        const timer = window.setInterval(publish, 5_000);
        return () => {
          stopped = true;
          window.clearInterval(timer);
        };
      }, [bridgeSignature]);

      React.useEffect(() => {
        let stopped = false;
        let timer;
        const poll = async () => {
          if (stopped) return;
          try {
            const response = await fetch(`${BRIDGE_BASE}/api/command`, { cache: 'no-store' });
            if (response.ok) {
              const value = await response.json();
              const command = value && value.command;
              if (command && command.type === 'open' && typeof command.sessionId === 'string') {
                try {
                  openSession(command.sessionId);
                } catch {
                  // The navigation provider may not be ready.
                }
              }
            }
          } catch {
            // The bridge is optional.
          }
          if (!stopped) timer = window.setTimeout(poll, 2_000);
        };
        void poll();
        return () => {
          stopped = true;
          window.clearTimeout(timer);
        };
      }, [openSession]);

      React.useEffect(() => {
        let stopped = false;
        let timer;
        const check = async () => {
          if (stopped) return;
          try {
            const response = await fetch(`${BRIDGE_BASE}/api/health`, { cache: 'no-store' });
            if (response.ok) {
              const value = await response.json();
              setDesktopActive(Boolean(value && value.desktopConnected));
            }
          } catch {
            setDesktopActive(false);
          }
          if (!stopped) timer = window.setTimeout(check, 3_000);
        };
        void check();
        return () => {
          stopped = true;
          window.clearTimeout(timer);
        };
      }, []);

      React.useEffect(() => {
        let stopped = false;
        let timer;
        const poll = async () => {
          if (stopped) return;
          try {
            const response = await fetch(`${BRIDGE_BASE}/api/progress`, { cache: 'no-store' });
            if (response.ok) {
              const value = await response.json();
              const next = value && value.progress && typeof value.progress === 'object' ? value.progress : {};
              setProgressById((previous) => (
                JSON.stringify(previous) === JSON.stringify(next) ? previous : next
              ));
            }
          } catch {
            // Progress is an enhancement; the task list remains usable.
          }
          if (!stopped) timer = window.setTimeout(poll, 1_500);
        };
        void poll();
        return () => {
          stopped = true;
          window.clearTimeout(timer);
        };
      }, []);

      const launchDesktop = async () => {
        try {
          const response = await fetch(`${BRIDGE_BASE}/api/launch-desktop`, { method: 'POST' });
          const value = await response.json().catch(() => ({}));
          if (response.ok) {
            setDesktopMessage(t('desktopLaunched'));
          } else if (value && value.error === 'desktop-app-not-installed') {
            setDesktopMessage(t('desktopMissing'));
          } else {
            setDesktopMessage(t('desktopLaunchFailed'));
          }
        } catch {
          setDesktopMessage(t('desktopLaunchFailed'));
        }
        window.setTimeout(() => setDesktopMessage(''), 4_500);
      };

      const runningKey = running.map((task) => task.id).join('|');
      React.useEffect(() => {
        if (!runningKey) return;
        const ids = runningKey.split('|');
        setDismissed((previous) => {
          if (!ids.some((id) => previous.has(id))) return previous;
          const next = new Set(previous);
          for (const id of ids) next.delete(id);
          return next;
        });
      }, [runningKey]);

      React.useEffect(() => {
        if (notices.length === 0) return undefined;
        const timer = window.setTimeout(() => setNotices((existing) => existing.slice(1)), 7_000);
        return () => window.clearTimeout(timer);
      }, [notices]);

      React.useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return;
          setOpen(false);
          petRef.current?.focus?.({ preventScroll: true });
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
      }, [open]);

      const toggleLock = () => {
        const next = !locked;
        setLocked(next);
        writePrefs({ x: posRef.current.x, y: posRef.current.y, locked: next });
      };

      const openTask = (task) => {
        if (!task || !task.id) return;
        if (task.kind === 'done') {
          setDismissed((previous) => {
            if (previous.has(task.id)) return previous;
            const next = new Set(previous);
            next.add(task.id);
            return next;
          });
        }
        setNotices((existing) => existing.filter((item) => item.sessionId !== task.id));
        try {
          openSession(task.id);
        } catch {
          // A missing navigation provider must not break the board.
        }
      };

      const openNotice = (notice) => {
        setNotices([]);
        setOpen(true);
        openTask({ id: notice.sessionId, kind: notice.kind === 'done' ? 'done' : 'running' });
      };

      const closePanel = () => {
        setOpen(false);
        petRef.current?.focus?.({ preventScroll: true });
      };

      const onPointerDown = (event) => {
        if (locked || event.button !== 0) return;
        const node = event.currentTarget;
        try {
          node.setPointerCapture?.(event.pointerId);
        } catch {
          // Pointer capture is an enhancement; the drag still works without it.
        }
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          startLeft: left,
          startTop: top,
          moved: false,
        };
        node.focus?.({ preventScroll: true });
      };

      const onPointerMove = (event) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== event.pointerId || locked) return;
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        if (!drag.moved) {
          drag.moved = true;
          setDragging(true);
        }
        const nextLeft = clamp(drag.startLeft + dx, 0, maxLeft);
        const nextTop = clamp(drag.startTop + dy, 0, maxTop);
        const nextX = maxLeft === 0 ? 0 : nextLeft / maxLeft;
        const nextY = maxTop === 0 ? 0 : nextTop / maxTop;
        drag.latestX = nextX;
        drag.latestY = nextY;
        setPos({ x: nextX, y: nextY });
      };

      const finishDrag = (event) => {
        const drag = dragRef.current;
        if (!drag) return;
        dragRef.current = null;
        setDragging(false);
        try {
          event.currentTarget.releasePointerCapture?.(event.pointerId);
        } catch {
          // Capture may already be gone.
        }
        if (!drag.moved) return;
        suppressClickRef.current = true;
        window.setTimeout(() => { suppressClickRef.current = false; }, 0);
        writePrefs({
          x: Number.isFinite(drag.latestX) ? drag.latestX : posRef.current.x,
          y: Number.isFinite(drag.latestY) ? drag.latestY : posRef.current.y,
          locked,
        });
      };

      const onPetClick = () => {
        if (suppressClickRef.current) {
          suppressClickRef.current = false;
          return;
        }
        if (open) {
          setOpen(false);
        } else {
          setNotices([]);
          setOpen(true);
        }
      };

      const mood = waiting.length > 0 ? 'waiting' : running.length > 0 ? 'running' : done.length > 0 ? 'done' : 'idle';
      const attention = waiting.length + done.length;
      const badgeCount = waiting.length > 0 ? waiting.length : done.length > 0 ? done.length : running.length;
      const badgeKind = waiting.length > 0 ? 'waiting' : done.length > 0 ? 'done' : 'running';
      const focusProgress = running.length === 1 ? progressById[running[0].id] : null;
      const caption = waiting.length > 0
        ? t('captionWaiting', { count: waiting.length })
        : running.length > 0
          ? (focusProgress ? progressShort(focusProgress, t) : t('captionRunning', { count: running.length }))
          : done.length > 0
            ? t('captionDone', { count: done.length })
            : t('captionIdle');
      const summaryParts = [];
      if (waiting.length > 0) summaryParts.push(t('summaryWaiting', { count: waiting.length }));
      if (running.length > 0) summaryParts.push(t('summaryRunning', { count: running.length }));
      if (done.length > 0) summaryParts.push(t('summaryDone', { count: done.length }));
      const summary = summaryParts.join(' · ') || t('summaryIdle');
      const live = running.length > 0 || waiting.length > 0;
      const sections = [
        { key: 'waiting', label: t('sectionWaiting'), items: waiting },
        { key: 'running', label: t('sectionRunning'), items: running },
        { key: 'done', label: t('sectionDone'), items: done },
      ].filter((section) => section.items.length > 0);
      const taskColors = taskColorMap(tasks);
      const panelLabel = petPanelLabel(t, waiting.length, running.length, done.length);

      if (desktopActive) return null;

      return h(React.Fragment, null,
        h('style', { key: 'xq-style' }, CSS),
        h('div', {
          key: 'xq-anchor',
          className: `xq-pet-anchor${locked ? ' is-locked' : ''}${dragging ? ' is-dragging' : ''}`,
          style: { left: `${left}px`, top: `${top}px` },
          'data-mood': mood,
        },
        h('div', { className: 'xq-sr', 'aria-live': 'polite', role: 'status' },
          notices.length > 0 ? `${notices[0].title}: ${notices[0].body}` : ''),
        h('button', {
          ref: petRef,
          type: 'button',
          className: 'xq-pet',
          'aria-label': `${open ? t('closeBoard') : t('openBoard')} · ${panelLabel}`,
          'aria-expanded': open,
          'aria-controls': 'xq-task-board',
          title: locked ? t('footerPinned') : t('dragHint'),
          onPointerDown,
          onPointerMove,
          onPointerUp: finishDrag,
          onPointerCancel: finishDrag,
          onClick: onPetClick,
        },
        h(PetArt, { mood }),
        badgeCount > 0
          ? h('span', {
            className: `xq-badge ${badgeKind}`,
            'aria-hidden': 'true',
            title: panelLabel,
          }, badgeCount > 9 ? '9+' : String(badgeCount))
          : null),
        h('button', {
          type: 'button',
          className: `xq-pin-fab${locked ? ' is-locked' : ''}`,
          'aria-label': locked ? t('unpin') : t('pin'),
          'aria-pressed': locked,
          title: locked ? t('unpin') : t('pin'),
          onClick: (event) => { event.stopPropagation(); toggleLock(); },
        }, h(PinIcon, { filled: locked })),
        h('span', { className: 'xq-caption', title: caption }, caption),
        !open && notices.length > 0
          ? h('div', {
            className: 'xq-notices',
            style: noticeStyle,
            'data-side': pos.x > 0.5 ? 'right' : 'left',
          }, notices.map((notice) => h('button', {
            key: notice.noticeKey,
            type: 'button',
            className: `xq-notice ${notice.kind}`,
            onClick: () => openNotice(notice),
          },
          h('span', { className: 'xq-notice-mark', 'aria-hidden': 'true' }, notice.kind === 'waiting' ? '!' : '✓'),
          h('span', { className: 'xq-notice-copy' },
            h('strong', { className: 'xq-notice-title' }, notice.title),
            h('span', { className: 'xq-notice-body' }, notice.body)))))
          : null),
        open
          ? h('section', {
            key: 'xq-panel',
            id: 'xq-task-board',
            className: 'xq-panel',
            style: panelStyle,
            role: 'dialog',
            'aria-modal': false,
            'aria-label': t('panelTitle'),
          },
          h('header', { className: 'xq-panel-head' },
            h('div', { className: 'xq-panel-heading' },
              h('div', { className: 'xq-name-line' },
                h('span', { className: 'xq-name' }, t('appName')),
                h('span', { className: `xq-live${live ? ' is-active' : ''}` },
                  h('span', { className: 'xq-live-dot', 'aria-hidden': 'true' }),
                  t('live'))),
              h('div', { className: 'xq-summary' }, summary)),
            h('div', { className: 'xq-head-actions' },
              h('button', {
                type: 'button',
                className: 'xq-icon-btn',
                'aria-label': t('showDesktop'),
                title: t('showDesktop'),
                onClick: launchDesktop,
              }, h(DesktopIcon)),
              h('button', {
                type: 'button',
                className: `xq-icon-btn${locked ? ' is-on' : ''}`,
                'aria-label': locked ? t('unpin') : t('pin'),
                'aria-pressed': locked,
                title: locked ? t('unpin') : t('pin'),
                onClick: toggleLock,
              }, h(PinIcon, { filled: locked })),
              h('button', {
                type: 'button',
                className: 'xq-icon-btn',
                'aria-label': t('close'),
                title: t('close'),
                onClick: closePanel,
              }, h(CloseIcon)))),
          h('div', { className: 'xq-panel-body' },
            list.phase === 'pending' && tasks.length === 0
              ? h('div', { className: 'xq-empty' },
                h('div', { className: 'xq-empty-mark' }, h(SparkIcon)),
                h('strong', null, t('loading')))
              : tasks.length === 0
                ? h('div', { className: 'xq-empty' },
                  h('div', { className: 'xq-empty-mark' }, h(SparkIcon)),
                  h('strong', null, t('emptyTitle')),
                  h('p', null, totalSessions > 0 ? t('emptyCount', { count: totalSessions }) : t('emptyNoSessions')),
                  h('p', null, t('emptyBody')))
                : sections.map((section) => h('div', { key: section.key, className: 'xq-section' },
                  h('div', { className: 'xq-section-label' },
                    h('span', null, section.label),
                    h('span', { className: 'xq-section-count' }, String(section.items.length))),
                  h('div', { className: 'xq-list' },
                    section.items.map((task) => h(TaskRow, { key: task.id, task, t, now, onOpen: openTask, progress: progressById[task.id], accent: taskColors[task.id] })))))),
          h('footer', { className: 'xq-panel-foot' },
            h('span', { className: 'xq-foot-pin', 'aria-hidden': 'true' }, h(PinIcon, { filled: locked })),
            h('span', null, desktopMessage || (locked ? t('footerPinned') : t('footerHint')))))
          : null);
    }

    function petPanelLabel(t, waiting, running, done) {
      if (waiting > 0) return t('captionWaiting', { count: waiting });
      if (running > 0) return t('captionRunning', { count: running });
      if (done > 0) return t('captionDone', { count: done });
      return t('captionIdle');
    }

    let noticeSequence = 0;
    function noticeFor(task, kind, t) {
      noticeSequence += 1;
      return {
        noticeKey: `${task.id}:${kind}:${noticeSequence}`,
        sessionId: task.id,
        kind,
        title: task.title,
        body: kind === 'waiting' ? waitingLabel(task, t) : t('noticeDone'),
      };
    }

    const inject = ['slots', 'locale', 'sessions'];

    function apply(ctx) {
      ctx.effect(() => {
        const offEn = ctx.locale.register(NS, 'en', EN);
        const offZh = ctx.locale.register(NS, 'zh', ZH);
        return () => {
          offZh();
          offEn();
        };
      });

      const services = {
        sessions: ctx.sessions,
        uiSession: typeof ctx.get === 'function' ? ctx.get('uiSession') : undefined,
      };

      const openSession = (sessionId) => {
        let workspace = undefined;
        try {
          workspace = typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : undefined;
        } catch {
          workspace = undefined;
        }
        if (!workspace && ctx.uiWorkspace) workspace = ctx.uiWorkspace;
        if (!workspace || typeof workspace.openSession !== 'function') return false;
        workspace.openSession(sessionId);
        return true;
      };

      const PetSlot = (props) => h(XiaoqiPet, {
        ...props,
        services,
        locale: ctx.locale,
        openSession,
      });

      ctx.slots.inject('shell.overlay', () => ctx.slots.register({
        name: 'shell.overlay',
        id: 'xiaoqi-desk-pet',
        order: 90,
      }, PetSlot));
    }

    return { inject, apply };
  },
});
