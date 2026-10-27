import AppKit
import Combine
import Foundation

enum L10n {
    static let isChinese = Locale.preferredLanguages.first?.lowercased().hasPrefix("zh") ?? false

    static func text(_ en: String, _ zh: String) -> String {
        isChinese ? zh : en
    }

    static func status(_ task: RemoteTask) -> String {
        switch task.kind {
        case "waiting": return text("Needs you", "需要你")
        case "running": return text("Running", "进行中")
        case "done": return text("Done", "已完成")
        default: return ""
        }
    }

    static func pending(kind: String?, tool: String?) -> String {
        switch kind ?? "" {
        case "approval":
            if let tool, !tool.isEmpty {
                return text("Waiting for approval · \(tool)", "等待确认 · \(tool)")
            }
            return text("Waiting for tool approval", "等待确认工具调用")
        case "question":
            return text("Waiting for your answer", "等待你回答问题")
        case "plan-review":
            return text("Plan needs review", "计划待你确认")
        default:
            return text("Waiting for you", "等待你处理")
        }
    }

    static func relative(_ milliseconds: Double) -> String {
        guard milliseconds > 0 else { return "" }
        let date = Date(timeIntervalSince1970: milliseconds / 1000)
        let delta = max(0, Date().timeIntervalSince(date))
        if delta < 60 { return text("just now", "刚刚") }
        if delta < 3600 {
            let minutes = max(1, Int(delta / 60))
            return text("\(minutes) min ago", "\(minutes) 分钟前")
        }
        if delta < 86_400 {
            let hours = max(1, Int(delta / 3600))
            return text("\(hours) h ago", "\(hours) 小时前")
        }
        let formatter = DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }

    static func taskMeta(_ task: RemoteTask) -> String {
        var parts: [String] = []
        if !task.project.isEmpty { parts.append(task.project) }
        switch task.kind {
        case "waiting":
            parts.append(pending(kind: task.pendingKind, tool: task.pendingTool))
        case "running":
            parts.append(text("Working", "正在处理"))
        case "done":
            parts.append(text("Completed", "已完成"))
        default:
            break
        }
        if task.kind != "running" || task.progress == nil {
            let age = relative(task.updatedAt)
            if !age.isEmpty { parts.append(age) }
        }
        return parts.joined(separator: " · ")
    }

    static func phase(_ phase: String) -> String {
        switch phase {
        case "thinking": return text("Thinking", "思考中")
        case "tool": return text("Running a tool", "执行工具中")
        case "responding": return text("Writing the answer", "生成回复中")
        case "done": return text("Finished", "已完成")
        default: return text("Preparing", "准备中")
        }
    }

    static func phasePrimary(_ progress: RemoteProgress) -> String {
        switch progress.phase {
        case "tool":
            let tool = progress.tool ?? ""
            return tool.isEmpty
                ? text("Running a tool", "执行工具中")
                : text("Running \(tool)", "正在执行 \(tool)")
        case "thinking":
            if progress.step > 0 {
                return text("Thinking · step \(progress.step)", "思考中 · 第 \(progress.step) 步")
            }
            return text("Thinking", "思考中")
        case "responding": return text("Writing the answer", "生成回复中")
        case "done": return text("Finished", "已完成")
        default: return text("Preparing", "准备中")
        }
    }

    static func phaseShort(_ progress: RemoteProgress) -> String {
        let todo = todoLine(progress)
        if !todo.isEmpty {
            return todo.count > 24 ? String(todo.prefix(23)) + "…" : todo
        }
        if let action = progress.action {
            let label = actionLabel(action)
            return label.count > 28 ? String(label.prefix(27)) + "…" : label
        }
        switch progress.phase {
        case "tool":
            let tool = progress.tool ?? ""
            if tool.isEmpty { return text("Running a tool", "执行中") }
            let short = tool.count > 12 ? String(tool.prefix(11)) + "…" : tool
            return text("Running \(short)", "执行 \(short)")
        case "thinking":
            return progress.step > 0
                ? text("Thinking · step \(progress.step)", "思考 · 第\(progress.step)步")
                : text("Thinking", "思考中")
        case "responding": return text("Writing", "生成回复")
        case "done": return text("Done", "已完成")
        default: return text("Preparing", "准备中")
        }
    }

    static func elapsed(_ milliseconds: Double) -> String {
        guard milliseconds > 0 else { return "" }
        let total = Int(milliseconds / 1000)
        let minutes = total / 60
        let seconds = total % 60
        if minutes >= 60 {
            let hours = minutes / 60
            let remainder = minutes % 60
            return text("\(hours)h \(remainder)m", "\(hours) 小时 \(remainder) 分")
        }
        if minutes > 0 { return text("\(minutes)m \(seconds)s", "\(minutes) 分 \(seconds) 秒") }
        return text("\(seconds)s", "\(seconds) 秒")
    }

    static func progressDetails(_ progress: RemoteProgress) -> String {
        var parts: [String] = []
        if progress.turn > 0 { parts.append(text("turn \(progress.turn)", "第 \(progress.turn) 轮")) }
        if progress.step > 0 { parts.append(text("step \(progress.step)", "第 \(progress.step) 步")) }
        if progress.toolCount > 0 { parts.append(text("\(progress.toolCount) tools", "\(progress.toolCount) 个工具")) }
        let time = elapsed(progress.elapsedMs)
        if !time.isEmpty { parts.append(time) }
        return parts.joined(separator: " · ")
    }

    static func progressCounts(_ progress: RemoteProgress) -> String {
        var parts: [String] = []
        if progress.turn > 0 { parts.append(text("turn \(progress.turn)", "第 \(progress.turn) 轮")) }
        if progress.step > 0 { parts.append(text("step \(progress.step)", "第 \(progress.step) 步")) }
        if progress.toolCount > 0 { parts.append(text("\(progress.toolCount) tools", "\(progress.toolCount) 个工具")) }
        return parts.joined(separator: " · ")
    }

    static func actionLabel(_ action: RemoteAction) -> String {
        let target = action.target
        let label: String
        switch action.kind {
        case "read": label = text("Read \(target)", "读取 \(target)")
        case "write": label = text("Write \(target)", "写入 \(target)")
        case "edit": label = text("Edit \(target)", "修改 \(target)")
        case "bash": label = text("Run: \(target)", "运行：\(target)")
        case "glob": label = text("Find \(target)", "查找 \(target)")
        case "grep": label = text("Search \(target)", "搜索 \(target)")
        case "image": label = text("View \(target)", "查看 \(target)")
        case "plugin": label = text("Plugin: \(target)", "插件操作：\(target)")
        case "inspect": label = text("Inspect: \(target)", "检查接口：\(target)")
        case "search": label = text("Search web: \(target)", "检索：\(target)")
        case "fetch": label = text("Fetch: \(target)", "读取网页：\(target)")
        case "subagent": label = text("Delegate: \(target)", "调度子任务：\(target)")
        case "workflow": label = text("Workflow: \(target)", "运行工作流：\(target)")
        case "present": label = text("Present deliverables", "整理交付物")
        case "skill": label = text("Skill: \(target)", "加载技能：\(target)")
        case "todo": label = text("Update checklist", "更新任务清单")
        case "schedule": label = text("Schedule: \(target)", "定时任务：\(target)")
        default: label = target.isEmpty ? text("Use a tool", "调用工具") : text("Use \(target)", "调用 \(target)")
        }
        return action.done == true ? "\(label) ✓" : label
    }

    static func actionLine(_ progress: RemoteProgress) -> String {
        if let action = progress.action { return actionLabel(action) }
        return phase(progress.phase)
    }

    static func todoLine(_ progress: RemoteProgress) -> String {
        guard let todos = progress.todos, todos.total > 0 else { return "" }
        if !todos.current.isEmpty { return todos.current }
        if todos.completed >= todos.total { return text("Checklist complete", "任务清单已完成") }
        return ""
    }

    static func todoCount(_ progress: RemoteProgress) -> String {
        guard let todos = progress.todos, todos.total > 0 else { return "" }
        return text("\(todos.completed)/\(todos.total) done", "\(todos.completed)/\(todos.total) 项")
    }

    static func trail(_ progress: RemoteProgress) -> String {
        progress.trail.suffix(3).map { item in
            if item.kind == "action" {
                let label = actionLabel(RemoteAction(
                    kind: item.actionKind ?? "tool",
                    target: item.label,
                    detail: nil,
                    done: item.done
                ))
                return label.count > 42 ? String(label.prefix(41)) + "…" : label
            }
            switch item.kind {
            case "tool": return item.label.isEmpty ? text("tool", "工具") : item.label
            case "toolDone": return text("\(item.label) ✓", "\(item.label) ✓")
            case "thinking": return text("think", "思考")
            case "reply": return text("answer", "回复")
            case "turn": return text("start", "开始")
            default: return item.label
            }
        }.joined(separator: "  →  ")
    }
}

enum PetMood: String {
    case idle
    case running
    case waiting
    case done
}

struct RemoteTrailItem: Codable, Equatable {
    let kind: String
    let label: String
    let at: Double
    let actionKind: String?
    let done: Bool?
}

struct RemoteAction: Codable, Equatable {
    let kind: String
    let target: String
    let detail: String?
    let done: Bool?
}

struct RemoteTodos: Codable, Equatable {
    let total: Int
    let completed: Int
    let current: String
}

struct RemoteProgress: Codable, Equatable {
    let phase: String
    let turn: Int
    let step: Int
    let tool: String?
    let toolCount: Int
    let elapsedMs: Double
    let updatedAt: Double
    let action: RemoteAction?
    let todos: RemoteTodos?
    let trail: [RemoteTrailItem]
}

struct RemoteTask: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let project: String
    let kind: String
    let pendingKind: String?
    let pendingTool: String?
    let current: Bool
    let updatedAt: Double
    let progress: RemoteProgress?
}

struct BridgeState: Codable, Equatable {
    let schemaVersion: Int
    let generatedAt: Double
    let source: String
    let tasks: [RemoteTask]
}

struct BridgeDescriptor: Codable {
    let schemaVersion: Int
    let origin: String
    let basePath: String
    let token: String
    let pid: Int
    let updatedAt: Double
}

struct PetNotice: Identifiable {
    let id = UUID()
    let kind: String
    let title: String
    let body: String
}

enum BridgeError: LocalizedError {
    case noDescriptor
    case unavailable
    case badResponse(Int)
    case invalidPayload

    var errorDescription: String? {
        switch self {
        case .noDescriptor:
            return L10n.text("Waiting for DSH bridge", "等待 DSH 连接")
        case .unavailable:
            return L10n.text("DSH bridge unavailable", "DSH 桥接不可用")
        case .badResponse(let code):
            return "HTTP \(code)"
        case .invalidPayload:
            return L10n.text("Invalid bridge payload", "状态数据格式错误")
        }
    }
}

final class BridgeClient {
    static let bridgeURL: URL = {
        FileManager.default.homeDirectoryForCurrentUser
            .appendingPathComponent("Library/Application Support/XiaoqiPet/bridge.json")
    }()

    private var descriptor: BridgeDescriptor?
    private var descriptorLoadedAt = Date.distantPast
    private let session: URLSession

    init() {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 2.5
        configuration.timeoutIntervalForResource = 4
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        session = URLSession(configuration: configuration)
    }

    @discardableResult
    func reloadDescriptor(force: Bool = true) -> BridgeDescriptor? {
        if !force, descriptor != nil, Date().timeIntervalSince(descriptorLoadedAt) < 5 {
            return descriptor
        }
        do {
            let data = try Data(contentsOf: Self.bridgeURL)
            let value = try JSONDecoder().decode(BridgeDescriptor.self, from: data)
            guard URL(string: value.origin) != nil, value.basePath.hasPrefix("/") else {
                descriptor = nil
                return nil
            }
            descriptor = value
            descriptorLoadedAt = Date()
            return value
        } catch {
            descriptor = nil
            return nil
        }
    }

    private func endpoint(_ descriptor: BridgeDescriptor, suffix: String) -> URL? {
        URL(string: descriptor.origin + descriptor.basePath + suffix)
    }

    private func request(_ descriptor: BridgeDescriptor, url: URL, method: String = "GET", body: Data? = nil) -> URLRequest {
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("Bearer \(descriptor.token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        return request
    }

    func fetchState(completion: @escaping (Result<BridgeState, Error>) -> Void) {
        fetchState(retried: false, completion: completion)
    }

    private func fetchState(retried: Bool, completion: @escaping (Result<BridgeState, Error>) -> Void) {
        guard let descriptor = reloadDescriptor(force: false), let url = endpoint(descriptor, suffix: "/api/state") else {
            completion(.failure(BridgeError.noDescriptor))
            return
        }
        let task = session.dataTask(with: request(descriptor, url: url)) { [weak self] data, response, error in
            guard let self else { return }
            if let error {
                completion(.failure(error))
                return
            }
            guard let http = response as? HTTPURLResponse else {
                completion(.failure(BridgeError.unavailable))
                return
            }
            if http.statusCode == 401, !retried {
                _ = self.reloadDescriptor(force: true)
                self.fetchState(retried: true, completion: completion)
                return
            }
            guard http.statusCode == 200, let data else {
                completion(.failure(BridgeError.badResponse(http.statusCode)))
                return
            }
            do {
                let state = try JSONDecoder().decode(BridgeState.self, from: data)
                completion(.success(state))
            } catch {
                completion(.failure(BridgeError.invalidPayload))
            }
        }
        task.resume()
    }

    func openSession(_ sessionId: String, completion: ((Bool) -> Void)? = nil) {
        guard let descriptor = reloadDescriptor(force: false),
              let url = endpoint(descriptor, suffix: "/api/command") else {
            completion?(false)
            return
        }
        let payload = try? JSONSerialization.data(withJSONObject: ["type": "open", "sessionId": sessionId])
        let task = session.dataTask(with: request(descriptor, url: url, method: "POST", body: payload)) { _, response, _ in
            let code = (response as? HTTPURLResponse)?.statusCode ?? 0
            completion?(code >= 200 && code < 300)
        }
        task.resume()
    }
}

final class PetModel: ObservableObject {
    @Published private(set) var tasks: [RemoteTask] = []
    @Published private(set) var connected = false
    @Published private(set) var source = "host"
    @Published private(set) var lastUpdated: Date?
    @Published var boardOpen = false
    @Published var locked: Bool {
        didSet { UserDefaults.standard.set(locked, forKey: "xiaoqi.pet.locked") }
    }

    var onNotice: ((PetNotice) -> Void)?
    var onStateChange: (() -> Void)?

    private var previousKinds: [String: String] = [:]
    private var previousWaiting: Set<String> = []
    private var didSeed = false

    init() {
        locked = UserDefaults.standard.bool(forKey: "xiaoqi.pet.locked")
    }

    var waiting: [RemoteTask] { tasks.filter { $0.kind == "waiting" } }
    var running: [RemoteTask] { tasks.filter { $0.kind == "running" } }
    var done: [RemoteTask] { tasks.filter { $0.kind == "done" } }

    var mood: PetMood {
        if !waiting.isEmpty { return .waiting }
        if !running.isEmpty { return .running }
        if !done.isEmpty { return .done }
        return .idle
    }

    var badgeCount: Int {
        if !waiting.isEmpty { return waiting.count }
        if !done.isEmpty { return done.count }
        return running.count
    }

    var badgeKind: String {
        if !waiting.isEmpty { return "waiting" }
        if !done.isEmpty { return "done" }
        return "running"
    }

    var caption: String {
        if !waiting.isEmpty {
            return L10n.text("\(waiting.count) need you", "\(waiting.count) 个待处理")
        }
        if !running.isEmpty {
            if let focus = running.first, let progress = focus.progress {
                let phase = L10n.phaseShort(progress)
                return running.count > 1
                    ? L10n.text("\(running.count) running · \(phase)", "\(running.count) 进行中 · \(phase)")
                    : phase
            }
            return L10n.text("\(running.count) running", "\(running.count) 进行中")
        }
        if !done.isEmpty {
            return L10n.text("\(done.count) finished", "\(done.count) 个已完成")
        }
        return connected ? L10n.text("Quietly here", "安静陪伴") : L10n.text("Waiting for DSH…", "等待 DSH…")
    }

    var summary: String {
        var parts: [String] = []
        if !waiting.isEmpty {
            parts.append(L10n.text("\(waiting.count) need you", "\(waiting.count) 个任务需要你"))
        }
        if !running.isEmpty {
            parts.append(L10n.text("\(running.count) running", "\(running.count) 个任务进行中"))
        }
        if !done.isEmpty {
            parts.append(L10n.text("\(done.count) just finished", "\(done.count) 个任务刚完成"))
        }
        if parts.isEmpty {
            return connected
                ? L10n.text("All sessions are quiet", "所有会话都在休息")
                : L10n.text("Waiting for DSH bridge", "等待 DSH 连接")
        }
        return parts.joined(separator: " · ")
    }

    func apply(_ state: BridgeState) {
        let incoming = state.tasks
        let oldKinds = previousKinds
        let oldWaiting = previousWaiting
        tasks = incoming
        connected = true
        source = state.source
        lastUpdated = Date()

        let nextKinds = Dictionary(uniqueKeysWithValues: incoming.map { ($0.id, $0.kind) })
        let nextWaiting = Set(incoming.filter { $0.kind == "waiting" }.map(\.id))

        if didSeed {
            var fresh: [PetNotice] = []
            for task in incoming {
                if task.kind == "waiting", !oldWaiting.contains(task.id) {
                    fresh.append(PetNotice(
                        kind: "waiting",
                        title: task.title,
                        body: L10n.pending(kind: task.pendingKind, tool: task.pendingTool)
                    ))
                } else if task.kind == "done", oldKinds[task.id] == "running", !task.current {
                    fresh.append(PetNotice(
                        kind: "done",
                        title: task.title,
                        body: L10n.text("Task complete", "任务完成")
                    ))
                }
            }
            if let notice = fresh.first {
                onNotice?(notice)
            }
        }

        previousKinds = nextKinds
        previousWaiting = nextWaiting
        didSeed = true
        onStateChange?()
    }

    func markDisconnected() {
        connected = false
        onStateChange?()
    }

    func toggleLock() {
        locked.toggle()
    }

    func toggleBoard() {
        boardOpen.toggle()
        if !boardOpen {
            boardOpen = false
        }
    }

    func closeBoard() {
        boardOpen = false
    }

    func activateDSH() {
        if let app = NSRunningApplication.runningApplications(withBundleIdentifier: "com.deepseek.dsh").first {
            app.activate(options: [.activateAllWindows, .activateIgnoringOtherApps])
            return
        }
        if let url = URL(string: "dsh://open") {
            NSWorkspace.shared.open(url)
            return
        }
        NSWorkspace.shared.launchApplication("DeepSeek Harness")
    }
}
