import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
import { chmod, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { spawn } from 'node:child_process';

const BASE = '/xiaoqi-pet';
const SCHEMA_VERSION = 1;
const CLIENT_FRESH_MS = 15_000;
const HOST_CACHE_MS = 1_500;
const COMMAND_TTL_MS = 30_000;
const MAX_BODY = 64 * 1024;
const MAX_TASKS = 16;

let token = '';

function isLoopback(address) {
  const value = typeof address === 'string' ? address.toLowerCase().replace(/^\[|\]$/g, '') : '';
  return value === 'localhost' || value === 'localhost.' || value === '::1'
    || value.startsWith('127.') || value.startsWith('::ffff:127.');
}

function appSupportPath() {
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Application Support', 'XiaoqiPet', 'bridge.json');
  }
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'XiaoqiPet', 'bridge.json');
  }
  return join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'xiaoqi-pet', 'bridge.json');
}

function desktopAppPaths() {
  if (process.platform === 'darwin') {
    return [
      join(homedir(), 'Applications', 'Xiaoqi Pet.app'),
      '/Applications/Xiaoqi Pet.app',
    ];
  }
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');
    const programFiles = process.env.ProgramFiles ?? 'C:\\Program Files';
    return [
      join(local, 'Programs', 'Xiaoqi Pet', 'Xiaoqi Pet.exe'),
      join(local, 'XiaoqiPet', 'Xiaoqi Pet.exe'),
      join(programFiles, 'Xiaoqi Pet', 'Xiaoqi Pet.exe'),
    ];
  }
  return [
    join(homedir(), '.local', 'bin', 'xiaoqi-pet'),
    join(homedir(), '.local', 'share', 'xiaoqi-pet', 'Xiaoqi Pet.AppImage'),
    '/opt/Xiaoqi Pet/xiaoqi-pet',
  ];
}

function json(response, statusCode, value) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  response.end(JSON.stringify(value));
}

function boundedString(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function sanitizeTask(value) {
  if (value === null || typeof value !== 'object') return null;
  const id = boundedString(value.id, 120);
  if (id === '') return null;
  const kind = value.kind === 'waiting' || value.kind === 'running' || value.kind === 'done'
    ? value.kind
    : '';
  if (kind === '') return null;
  return {
    id,
    title: boundedString(value.title, 200) || id,
    project: boundedString(value.project, 100),
    kind,
    pendingKind: boundedString(value.pendingKind, 40),
    pendingTool: boundedString(value.pendingTool, 80),
    current: Boolean(value.current),
    updatedAt: Number.isFinite(value.updatedAt) ? Number(value.updatedAt) : 0,
  };
}

function sanitizeTasks(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const tasks = [];
  for (const item of value) {
    if (tasks.length >= MAX_TASKS) break;
    const task = sanitizeTask(item);
    if (task === null || seen.has(task.id)) continue;
    seen.add(task.id);
    tasks.push(task);
  }
  return tasks;
}

function readBody(request, limit = MAX_BODY) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body-too-large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf8');
        resolve(text === '' ? {} : JSON.parse(text));
      } catch {
        reject(new Error('invalid-json'));
      }
    });
    request.on('error', reject);
  });
}

function authorized(request) {
  if (!isLoopback(request.socket?.remoteAddress)) return false;
  const header = request.headers.authorization;
  if (typeof header === 'string' && header === `Bearer ${token}`) return true;
  const custom = request.headers['x-xiaoqi-token'];
  return Array.isArray(custom) ? custom[0] === token : custom === token;
}

/**
 * Client requests reach the Host either directly from the HTTP origin or
 * through the Desktop `dsh-app://app` forwarder, which strips Origin and
 * Sec-Fetch-Site. Accept both while rejecting cross-site pages.
 */
function clientRequest(request) {
  if (!isLoopback(request.socket?.remoteAddress)) return false;
  if (request.headers['sec-fetch-site'] === 'cross-site') return false;
  const origin = request.headers.origin;
  if (typeof origin === 'string' && origin !== '') {
    try {
      return new URL(origin).origin === new URL(webOrigin()).origin;
    } catch {
      return false;
    }
  }
  return true;
}

function webOrigin() {
  try {
    return webServer.getOrigin();
  } catch {
    return '';
  }
}

function sanitizeProgress(value) {
  if (value === null || typeof value !== 'object') return null;
  const phase = ['starting', 'thinking', 'tool', 'responding', 'done'].includes(value.phase)
    ? value.phase
    : 'starting';
  const trail = Array.isArray(value.trail)
    ? value.trail.slice(-4).map((item) => ({
      kind: boundedString(item?.kind, 20),
      label: boundedString(item?.label, 80),
      at: Number.isFinite(item?.at) ? Number(item.at) : 0,
    }))
    : [];
  return {
    phase,
    turn: Number.isFinite(value.turn) ? Number(value.turn) : 0,
    step: Number.isFinite(value.step) ? Number(value.step) : 0,
    tool: boundedString(value.tool, 80),
    toolCount: Number.isFinite(value.toolCount) ? Number(value.toolCount) : 0,
    elapsedMs: Number.isFinite(value.elapsedMs) ? Math.max(0, Number(value.elapsedMs)) : 0,
    updatedAt: Number.isFinite(value.updatedAt) ? Number(value.updatedAt) : 0,
    trail,
  };
}

function sanitizeBridge(value) {
  return {
    schemaVersion: SCHEMA_VERSION,
    generatedAt: Date.now(),
    source: value.source === 'client' ? 'client' : 'host',
    tasks: sanitizeTasks(value.tasks),
  };
}

function projectName(cwd) {
  if (typeof cwd !== 'string' || cwd.trim() === '') return '';
  const normalized = cwd.replace(/[\\/]+$/, '');
  return basename(normalized) || normalized;
}

function shortText(value, max) {
  if (typeof value !== 'string') return '';
  const text = value.replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, Math.max(0, max - 1))}…` : text;
}

function fileBase(value) {
  if (typeof value !== 'string' || value.trim() === '') return '';
  const normalized = value.replace(/[\\/]+$/, '');
  const index = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  return shortText(index >= 0 ? normalized.slice(index + 1) : normalized, 80);
}

function parseToolArguments(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value !== 'string' || value.length > 262_144) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function firstQuery(value) {
  if (Array.isArray(value)) return shortText(String(value[0] ?? ''), 80);
  return shortText(String(value ?? ''), 80);
}

function actionForTool(name, args) {
  const tool = typeof name === 'string' ? name : 'tool';
  switch (tool) {
    case 'read':
      return { kind: 'read', target: fileBase(args.file_path), detail: '', done: false };
    case 'write':
      return { kind: 'write', target: fileBase(args.file_path), detail: '', done: false };
    case 'edit':
      return { kind: 'edit', target: fileBase(args.file_path), detail: '', done: false };
    case 'bash':
      return { kind: 'bash', target: shortText(args.description || args.command || 'shell', 100), detail: '', done: false };
    case 'glob':
      return { kind: 'glob', target: shortText(args.pattern || args.path || 'files', 80), detail: '', done: false };
    case 'grep':
      return { kind: 'grep', target: shortText(args.pattern || args.path || 'content', 80), detail: '', done: false };
    case 'read_image':
      return { kind: 'image', target: fileBase(args.file_path), detail: '', done: false };
    case 'plugin_manager': {
      const action = shortText(args.action || 'manage', 40);
      const target = typeof args.target === 'string' ? fileBase(args.target) : '';
      return { kind: 'plugin', target: [action, target].filter(Boolean).join(' · '), detail: '', done: false };
    }
    case 'cordis_inspect_query':
      return { kind: 'inspect', target: shortText([args.provider, args.method].filter(Boolean).join(' · '), 80), detail: '', done: false };
    case 'web_search':
      return { kind: 'search', target: firstQuery(args.queries ?? args.query), detail: '', done: false };
    case 'web_fetch':
      return { kind: 'fetch', target: shortText(args.url || 'web', 100), detail: '', done: false };
    case 'subagent':
    case 'subagent_fork':
      return { kind: 'subagent', target: shortText(args.description || 'delegate', 80), detail: '', done: false };
    case 'workflow':
      return { kind: 'workflow', target: shortText(args.name || args.description || 'workflow', 80), detail: '', done: false };
    case 'present':
      return { kind: 'present', target: '', detail: '', done: false };
    case 'skill':
      return { kind: 'skill', target: shortText(args.name || 'skill', 60), detail: '', done: false };
    case 'todo_write':
      return { kind: 'todo', target: '', detail: '', done: false };
    case 'schedule_create':
    case 'schedule_update':
    case 'schedule_delete':
      return { kind: 'schedule', target: shortText(args.title || tool, 80), detail: '', done: false };
    default:
      return { kind: 'tool', target: shortText(tool, 60), detail: '', done: false };
  }
}

function todosForArgs(args) {
  if (!Array.isArray(args.todos)) return null;
  const items = args.todos
    .filter((item) => item && typeof item === 'object')
    .slice(0, 24)
    .map((item) => ({
      content: shortText(item.content, 160),
      status: item.status === 'completed' || item.status === 'in_progress' ? item.status : 'pending',
    }))
    .filter((item) => item.content !== '');
  if (items.length === 0) return null;
  const completed = items.filter((item) => item.status === 'completed').length;
  const current = items.find((item) => item.status === 'in_progress')?.content || '';
  return { total: items.length, completed, current };
}

export const inject = ['webServer'];

let webServer;

export function apply(ctx) {
  token = randomBytes(24).toString('hex');
  webServer = ctx.webServer;
  const bridgePath = appSupportPath();
  let disposed = false;
  let clientSnapshot = null;
  let pendingCommand = null;
  let desktopSeenAt = 0;
  let hostCache = null;
  let hostCacheAt = 0;
  let bridgeTimer = null;
  const progressCache = new Map();

  function blankProgress() {
    return {
      phase: 'starting',
      turn: 0,
      step: 0,
      tool: '',
      toolCount: 0,
      turnStartedAt: 0,
      lastAt: 0,
      lastSeq: -1,
      sessionSeq: -1,
      action: null,
      lastAction: null,
      todos: null,
      trail: [],
    };
  }

  function pushTrail(state, kind, label, at, extra = {}) {
    state.trail.push({ kind, label, at, ...extra });
    if (state.trail.length > 4) state.trail = state.trail.slice(-4);
  }

  function applyProgressEvent(state, event) {
    const type = event.type;
    const data = event.data ?? {};
    const at = Number(event.time) || Date.now();
    switch (type) {
      case 'user/message':
        if (state.turnStartedAt === 0) state.turnStartedAt = at;
        break;
      case 'turn/start':
        state.turn = Number.isFinite(data.turn) ? data.turn : state.turn;
        state.step = 0;
        state.tool = '';
        state.toolCount = 0;
        state.phase = 'thinking';
        state.turnStartedAt = at;
        state.action = null;
        state.lastAction = null;
        state.trail = [];
        break;
      case 'step/start':
        state.step = Number.isFinite(data.step) ? data.step : state.step;
        state.tool = '';
        state.phase = 'thinking';
        break;
      case 'tool/call': {
        const name = boundedString(data.name, 80) || 'tool';
        const args = parseToolArguments(data.arguments);
        const action = actionForTool(name, args);
        state.phase = 'tool';
        state.tool = name;
        state.toolCount += 1;
        state.action = action;
        state.lastAction = action;
        if (name === 'todo_write') {
          const todos = todosForArgs(args);
          if (todos) state.todos = todos;
        }
        pushTrail(state, 'action', action.target, at, {
          actionKind: action.kind,
          done: false,
        });
        break;
      }
      case 'tool/result':
        if (state.action) {
          state.action = { ...state.action, done: true };
          const last = state.trail[state.trail.length - 1];
          if (last && last.kind === 'action' && last.actionKind === state.action.kind) {
            state.trail[state.trail.length - 1] = { ...last, done: true };
          }
        }
        state.phase = 'thinking';
        state.tool = '';
        break;
      case 'assistant/attempt':
        state.phase = 'responding';
        break;
      case 'assistant/message':
        state.phase = 'responding';
        break;
      case 'turn/end':
        state.phase = 'done';
        state.tool = '';
        break;
      default:
        break;
    }
    state.lastAt = at;
    if (Number.isFinite(event.seq)) state.lastSeq = Math.max(state.lastSeq, Number(event.seq));
  }

  function refreshProgress(session) {
    const id = String(session.id);
    let state = progressCache.get(id);
    const seq = Number(session.seq) || 0;
    if (!state) {
      state = blankProgress();
      progressCache.set(id, state);
    }
    if (state.sessionSeq === seq) return state;
    let events = [];
    try {
      events = typeof session.ownEvents === 'function' ? session.ownEvents() : [];
    } catch {
      events = [];
    }
    for (const event of events) {
      if (!Number.isFinite(event.seq) || Number(event.seq) > state.lastSeq) {
        applyProgressEvent(state, event);
      }
    }
    state.sessionSeq = seq;
    if (state.lastAt === 0 && session.header && Number.isFinite(session.header.createdAt)) {
      state.lastAt = Number(session.header.createdAt);
      state.turnStartedAt = state.turnStartedAt || state.lastAt;
    }
    return state;
  }

  function progressFor(sessionId) {
    const sessions = ctx.get('sessions');
    if (!sessions || typeof sessions.get !== 'function') return null;
    let session;
    try {
      session = sessions.get(sessionId);
    } catch {
      session = undefined;
    }
    if (!session) {
      progressCache.delete(String(sessionId));
      return null;
    }
    const state = refreshProgress(session);
    const now = Date.now();
    const elapsed = state.turnStartedAt > 0
      ? (state.phase === 'done' && state.lastAt > 0 ? Math.max(0, state.lastAt - state.turnStartedAt) : Math.max(0, now - state.turnStartedAt))
      : 0;
    return {
      phase: state.phase,
      turn: state.turn,
      step: state.step,
      tool: state.tool,
      toolCount: state.toolCount,
      elapsedMs: elapsed,
      updatedAt: state.lastAt,
      action: state.action,
      todos: state.todos,
      trail: state.trail.slice(-4),
    };
  }

  function decorateTasks(tasks) {
    return tasks.map((task) => {
      if (task.kind !== 'running' && task.kind !== 'waiting') return task;
      const progress = progressFor(task.id);
      return progress ? { ...task, progress } : task;
    });
  }

  async function writeBridgeFile() {
    const origin = webOrigin();
    if (origin === '') {
      bridgeTimer = setTimeout(() => {
        bridgeTimer = null;
        if (!disposed) void writeBridgeFile().catch(() => {});
      }, 500);
      return;
    }
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      origin,
      basePath: BASE,
      token,
      pid: process.pid,
      updatedAt: Date.now(),
    };
    await mkdir(dirname(bridgePath), { recursive: true, mode: 0o700 });
    const temporary = `${bridgePath}.${process.pid}.tmp`;
    await writeFile(temporary, JSON.stringify(payload), { encoding: 'utf8', mode: 0o600 });
    await rename(temporary, bridgePath);
    await chmod(bridgePath, 0o600).catch(() => {});
  }

  async function removeBridgeFile() {
    try {
      const raw = await readFile(bridgePath, 'utf8');
      const value = JSON.parse(raw);
      if (value && value.token === token) await unlink(bridgePath);
    } catch {
      // The bridge may already be gone or owned by a newer activation.
    }
  }

  async function hostTasks() {
    const now = Date.now();
    if (hostCache && now - hostCacheAt < HOST_CACHE_MS) return hostCache;
    const controller = ctx.get('sessionController');
    if (!controller || typeof controller.list !== 'function') {
      hostCache = [];
      hostCacheAt = now;
      return hostCache;
    }
    let value;
    try {
      value = await controller.list({}, AbortSignal.timeout(2_500));
    } catch {
      hostCache = hostCache ?? [];
      hostCacheAt = now;
      return hostCache;
    }
    const items = Array.isArray(value?.items) ? value.items : [];
    const sessions = ctx.get('sessions');
    const titles = ctx.get('sessionTitle');
    const tasks = [];
    for (const item of items) {
      if (tasks.length >= MAX_TASKS) break;
      if (!item || item.blank || item.origin === 'subagent' || item.parentSessionId) continue;
      if (!item.running) continue;
      const id = String(item.sessionId ?? '');
      if (id === '') continue;
      let title = '';
      try {
        const live = sessions?.get?.(id);
        if (live) title = titles?.get?.(live)?.title ?? '';
      } catch {
        title = '';
      }
      tasks.push({
        id,
        title: title || projectName(item.cwd) || id,
        project: projectName(item.cwd),
        kind: 'running',
        pendingKind: '',
        pendingTool: '',
        current: false,
        updatedAt: Number(item.updatedAt) || 0,
      });
    }
    tasks.sort((left, right) => right.updatedAt - left.updatedAt);
    hostCache = tasks;
    hostCacheAt = now;
    return tasks;
  }

  async function currentState() {
    const now = Date.now();
    if (clientSnapshot && now - clientSnapshot.receivedAt <= CLIENT_FRESH_MS) {
      const state = sanitizeBridge({ source: 'client', tasks: clientSnapshot.tasks });
      return { ...state, tasks: decorateTasks(state.tasks) };
    }
    const tasks = await hostTasks();
    const state = sanitizeBridge({ source: 'host', tasks });
    return { ...state, tasks: decorateTasks(state.tasks) };
  }

  async function launchDesktop() {
    const appPath = desktopAppPaths().find((candidate) => existsSync(candidate));
    if (!appPath) return { ok: false, error: 'desktop-app-not-installed' };
    try {
      const child = process.platform === 'darwin'
        ? spawn('open', [appPath], { detached: true, stdio: 'ignore' })
        : spawn(appPath, [], { detached: true, stdio: 'ignore', windowsHide: true });
      child.unref();
      return { ok: true, appPath };
    } catch {
      return { ok: false, error: 'launch-failed' };
    }
  }

  const route = webServer.register({
    kind: 'prefix',
    path: BASE,
    handler: async (request, response) => {
      const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
      const path = url.pathname;
      try {
        if (request.method === 'GET' && path === `${BASE}/api/state`) {
          if (!authorized(request)) {
            json(response, 401, { error: 'unauthorized' });
            return;
          }
          desktopSeenAt = Date.now();
          json(response, 200, await currentState());
          return;
        }

        if (request.method === 'GET' && path === `${BASE}/api/health`) {
          json(response, 200, {
            ok: true,
            pid: process.pid,
            desktopInstalled: desktopAppPaths().some((candidate) => existsSync(candidate)),
            desktopConnected: desktopSeenAt > 0 && Date.now() - desktopSeenAt < 6_000,
          });
          return;
        }

        if (request.method === 'POST' && path === `${BASE}/api/client-state`) {
          if (!clientRequest(request)) {
            json(response, 403, { error: 'untrusted-origin' });
            return;
          }
          const body = await readBody(request);
          const tasks = sanitizeTasks(body?.tasks);
          clientSnapshot = { tasks, receivedAt: Date.now() };
          json(response, 200, { ok: true, accepted: tasks.length });
          return;
        }

        if (request.method === 'GET' && path === `${BASE}/api/progress`) {
          if (!clientRequest(request)) {
            json(response, 403, { error: 'untrusted-origin' });
            return;
          }
          const now = Date.now();
          let tasks = [];
          if (clientSnapshot && now - clientSnapshot.receivedAt <= CLIENT_FRESH_MS) {
            tasks = clientSnapshot.tasks;
          } else {
            tasks = await hostTasks();
          }
          const progress = {};
          for (const task of tasks) {
            if (task.kind !== 'running' && task.kind !== 'waiting') continue;
            const value = progressFor(task.id);
            if (value) progress[task.id] = value;
          }
          json(response, 200, { generatedAt: now, progress });
          return;
        }

        if (request.method === 'GET' && path === `${BASE}/api/command`) {
          if (!clientRequest(request)) {
            json(response, 403, { error: 'untrusted-origin' });
            return;
          }
          if (pendingCommand && Date.now() - pendingCommand.at <= COMMAND_TTL_MS) {
            const command = { type: pendingCommand.type, sessionId: pendingCommand.sessionId };
            pendingCommand = null;
            json(response, 200, { command });
          } else {
            pendingCommand = null;
            json(response, 200, { command: null });
          }
          return;
        }

        if (request.method === 'POST' && path === `${BASE}/api/command`) {
          if (!authorized(request)) {
            json(response, 401, { error: 'unauthorized' });
            return;
          }
          const body = await readBody(request);
          const sessionId = boundedString(body?.sessionId, 120);
          if (body?.type !== 'open' || sessionId === '') {
            json(response, 400, { error: 'invalid-command' });
            return;
          }
          pendingCommand = { type: 'open', sessionId, at: Date.now() };
          json(response, 202, { ok: true });
          return;
        }

        if (request.method === 'POST' && path === `${BASE}/api/launch-desktop`) {
          if (!clientRequest(request)) {
            json(response, 403, { error: 'untrusted-origin' });
            return;
          }
          const result = await launchDesktop();
          json(response, result.ok ? 200 : 409, result);
          return;
        }

        json(response, 404, { error: 'not-found' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'internal-error';
        const invalid = message === 'body-too-large' || message === 'invalid-json';
        json(response, invalid ? 400 : 500, { error: invalid ? message : 'internal-error' });
      }
    },
  });

  void writeBridgeFile().catch(() => {});

  ctx.effect(() => () => {
    disposed = true;
    if (bridgeTimer !== null) clearTimeout(bridgeTimer);
    route();
    void removeBridgeFile();
  });
}
