import AppKit
import SwiftUI

enum PetAssets {
    static let pet: NSImage? = {
        guard let url = Bundle.main.url(forResource: "pet", withExtension: "svg") else { return nil }
        return NSImage(contentsOf: url)
    }()
}

extension PetMood {
    var color: Color {
        switch self {
        case .waiting: return Color(red: 0.88, green: 0.57, blue: 0.18)
        case .running: return Color(red: 0.16, green: 0.55, blue: 0.50)
        case .done: return Color(red: 0.12, green: 0.56, blue: 0.39)
        case .idle: return .clear
        }
    }
}

struct PetStageView: View {
    @ObservedObject var model: PetModel
    let onToggleBoard: () -> Void
    let onToggleLock: () -> Void
    let onBeginDrag: () -> Void
    let onDrag: () -> Void
    let onEndDrag: () -> Void

    @State private var hovering = false
    @State private var dragMoved = false
    @State private var breathe = false

    private var mood: PetMood { model.mood }

    var body: some View {
        VStack(spacing: 0) {
            ZStack(alignment: .topTrailing) {
                ZStack {
                    if mood != .idle {
                        Circle()
                            .fill(mood.color.opacity(0.12))
                            .frame(width: 118, height: 118)
                            .blur(radius: 12)
                            .offset(y: 2)
                    }
                    if let image = PetAssets.pet {
                        Image(nsImage: image)
                            .resizable()
                            .interpolation(.high)
                            .scaledToFit()
                            .frame(width: 128, height: 128)
                            .scaleEffect(breathe ? (mood == .waiting ? 1.035 : 1.02) : 1)
                            .offset(y: breathe ? (mood == .running ? -4 : -2) : 0)
                            .rotationEffect(.degrees(mood == .waiting ? (breathe ? 2.4 : -2.4) : 0))
                            .shadow(color: .black.opacity(0.22), radius: 10, y: 6)
                    } else {
                        Image(systemName: "pawprint.fill")
                            .font(.system(size: 54, weight: .semibold))
                            .foregroundStyle(mood == .idle ? Color.secondary : mood.color)
                            .frame(width: 128, height: 128)
                    }
                }
                .frame(width: 140, height: 134)
                .contentShape(Rectangle())
                .onTapGesture {
                    if !dragMoved { onToggleBoard() }
                }
                .gesture(
                    DragGesture(minimumDistance: 3)
                        .onChanged { value in
                            guard !model.locked else { return }
                            if !dragMoved {
                                let distance = hypot(value.translation.width, value.translation.height)
                                if distance < 3 { return }
                                dragMoved = true
                                onBeginDrag()
                            }
                            onDrag()
                        }
                        .onEnded { _ in
                            if dragMoved { onEndDrag() }
                            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                                dragMoved = false
                            }
                        }
                )

                if model.badgeCount > 0 {
                    badge
                        .offset(x: -4, y: 6)
                }
            }
            .overlay(alignment: .topLeading) {
                Button(action: onToggleLock) {
                    Image(systemName: model.locked ? "pin.fill" : "pin")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(model.locked ? Color.white : Color.secondary)
                        .frame(width: 25, height: 25)
                        .background(
                            Circle().fill(model.locked ? moodColor.opacity(0.9) : Color.primary.opacity(0.06))
                        )
                        .overlay(Circle().strokeBorder(Color.primary.opacity(0.09), lineWidth: 0.5))
                }
                .buttonStyle(.plain)
                .opacity(hovering || model.locked ? 1 : 0)
                .animation(.easeOut(duration: 0.12), value: hovering)
                .padding(.leading, 8)
                .padding(.top, 10)
                .help(model.locked
                      ? L10n.text("Unpin position", "解除固定")
                      : L10n.text("Pin position", "固定位置"))
            }

            Text(model.caption)
                .font(.system(size: 11, weight: .medium))
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .padding(.horizontal, 10)
                .padding(.vertical, 4)
                .background(.ultraThinMaterial, in: Capsule())
                .overlay(Capsule().strokeBorder(Color.primary.opacity(0.08), lineWidth: 0.5))
                .padding(.top, -4)
                .allowsHitTesting(false)
        }
        .frame(width: 164, height: 186, alignment: .bottom)
        .onHover { value in
            hovering = value
        }
        .onAppear { startBreathing() }
        .onChange(of: model.mood) { _ in startBreathing() }
        .contextMenu {
            Button(L10n.text("Open task board", "打开任务看板")) { onToggleBoard() }
            Button(model.locked
                   ? L10n.text("Unpin position", "解除固定")
                   : L10n.text("Pin position", "固定位置")) { onToggleLock() }
            Divider()
            Button(L10n.text("Quit Xiaoqi", "退出小栖")) { NSApp.terminate(nil) }
        }
        .accessibilityElement(children: .contain)
        .accessibilityLabel(L10n.text("Xiaoqi desktop companion", "小栖桌面伙伴"))
    }

    private var moodColor: Color {
        mood == .idle ? Color.accentColor : mood.color
    }

    private var badge: some View {
        Text(model.badgeCount > 9 ? "9+" : "\(model.badgeCount)")
            .font(.system(size: 10, weight: .bold))
            .foregroundStyle(.white)
            .frame(minWidth: 22, minHeight: 22)
            .padding(.horizontal, 2)
            .background(Capsule().fill(model.badgeKind == "waiting" ? PetMood.waiting.color : model.badgeKind == "done" ? PetMood.done.color : PetMood.running.color))
            .overlay(Capsule().strokeBorder(Color(nsColor: .windowBackgroundColor), lineWidth: 2))
            .shadow(color: .black.opacity(0.2), radius: 4, y: 2)
            .accessibilityLabel(L10n.text("\(model.badgeCount) notices", "\(model.badgeCount) 条提醒"))
    }

    private func startBreathing() {
        breathe = false
        let duration: Double
        switch mood {
        case .running: duration = 0.9
        case .waiting: duration = 1.55
        case .done: duration = 2.1
        case .idle: duration = 4.2
        }
        let reduceMotion = NSWorkspace.shared.accessibilityDisplayShouldReduceMotion
        guard !reduceMotion else { return }
        DispatchQueue.main.async {
            withAnimation(.easeInOut(duration: duration).repeatForever(autoreverses: true)) {
                breathe = true
            }
        }
    }
}

struct BoardView: View {
    @ObservedObject var model: PetModel
    let onClose: () -> Void
    let onToggleLock: () -> Void
    let onOpenTask: (RemoteTask) -> Void

    var body: some View {
        VStack(spacing: 0) {
            header
            if !model.connected {
                connectionBanner
            }
            Divider().opacity(0.35)
            content
            Divider().opacity(0.35)
            footer
        }
        .frame(width: 344)
        .frame(maxHeight: .infinity)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.6)
        )
        .shadow(color: .black.opacity(0.28), radius: 22, y: 12)
        .padding(12)
    }

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 7) {
                    Text(L10n.text("Xiaoqi", "小栖"))
                        .font(.system(size: 15, weight: .bold))
                    HStack(spacing: 4) {
                        Circle()
                            .fill(model.connected ? PetMood.done.color : Color.secondary.opacity(0.5))
                            .frame(width: 5, height: 5)
                        Text(L10n.text("LIVE", "实时"))
                            .font(.system(size: 8, weight: .bold))
                            .tracking(0.6)
                            .foregroundStyle(.secondary)
                    }
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(Color.primary.opacity(0.055)))
                    .overlay(Capsule().strokeBorder(Color.primary.opacity(0.08), lineWidth: 0.5))
                }
                Text(model.summary)
                    .font(.system(size: 11))
                    .foregroundStyle(.secondary)
                    .lineLimit(1)
            }
            Spacer(minLength: 0)
            HStack(spacing: 4) {
                BoardIconButton(systemName: model.locked ? "pin.fill" : "pin",
                                active: model.locked,
                                help: model.locked
                                    ? L10n.text("Unpin position", "解除固定")
                                    : L10n.text("Pin position", "固定位置"),
                                action: onToggleLock)
                BoardIconButton(systemName: "xmark", action: onClose)
            }
        }
        .padding(.horizontal, 14)
        .padding(.top, 13)
        .padding(.bottom, 10)
    }

    private var connectionBanner: some View {
        HStack(spacing: 7) {
            ProgressView()
                .controlSize(.small)
            Text(L10n.text("Waiting for the DSH bridge…", "等待 DSH 连接…"))
                .font(.system(size: 10.5))
                .foregroundStyle(.secondary)
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 7)
        .background(PetMood.waiting.color.opacity(0.09))
    }

    private var content: some View {
        ScrollView(.vertical, showsIndicators: false) {
            if model.tasks.isEmpty {
                emptyState
            } else {
                VStack(alignment: .leading, spacing: 4) {
                    if !model.waiting.isEmpty {
                        section(L10n.text("Needs you", "需要你"), tasks: model.waiting)
                    }
                    if !model.running.isEmpty {
                        section(L10n.text("In progress", "进行中"), tasks: model.running)
                    }
                    if !model.done.isEmpty {
                        section(L10n.text("Just finished", "刚完成"), tasks: model.done)
                    }
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var emptyState: some View {
        VStack(spacing: 8) {
            Image(systemName: model.connected ? "sparkles" : "bolt.horizontal.circle")
                .font(.system(size: 28, weight: .light))
                .foregroundStyle(model.connected ? PetMood.running.color : Color.secondary)
            Text(model.connected
                 ? L10n.text("All sessions are quiet", "所有会话都安静了")
                 : L10n.text("Waiting for DSH", "等待 DSH 连接"))
                .font(.system(size: 12.5, weight: .semibold))
            Text(model.connected
                 ? L10n.text("Xiaoqi will speak up when a task starts or needs you.", "任务开始运行或需要你处理时，小栖会提醒你。")
                 : L10n.text("Open the DeepSeek Harness window to reconnect.", "打开 DeepSeek Harness 窗口即可重新连接。"))
                .font(.system(size: 10.5))
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .lineSpacing(2)
                .frame(maxWidth: 236)
        }
        .frame(maxWidth: .infinity, minHeight: 290)
        .padding(20)
    }

    private func section(_ label: String, tasks: [RemoteTask]) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(label.uppercased())
                    .font(.system(size: 9.5, weight: .semibold))
                    .tracking(0.7)
                    .foregroundStyle(.secondary)
                Spacer()
                Text("\(tasks.count)")
                    .font(.system(size: 9.5, weight: .semibold))
                    .foregroundStyle(.tertiary)
            }
            .padding(.horizontal, 7)
            .padding(.top, 7)
            .padding(.bottom, 3)
            ForEach(tasks) { task in
                TaskRowView(task: task, onOpen: onOpenTask)
            }
        }
    }

    private var footer: some View {
        HStack(spacing: 6) {
            Image(systemName: model.locked ? "pin.fill" : "hand.draw")
                .font(.system(size: 9.5))
            Text(model.locked
                 ? L10n.text("Pinned in place · click the pin to unlock", "位置已固定 · 点击图钉可解锁")
                 : L10n.text("Drag Xiaoqi anywhere · click a task to focus DSH", "拖动小栖到任意位置 · 点击任务切到 DSH"))
                .lineLimit(1)
            Spacer(minLength: 0)
        }
        .font(.system(size: 9.5))
        .foregroundStyle(.secondary)
        .padding(.horizontal, 14)
        .padding(.vertical, 9)
    }
}

struct BoardIconButton: View {
    let systemName: String
    var active = false
    var help: String = ""
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(active ? Color.accentColor : Color.secondary)
                .frame(width: 26, height: 26)
                .background(
                    RoundedRectangle(cornerRadius: 7, style: .continuous)
                        .fill(active ? Color.accentColor.opacity(0.12) : Color.clear)
                )
        }
        .buttonStyle(.plain)
        .help(help)
    }
}

struct TaskRowView: View {
    let task: RemoteTask
    let onOpen: (RemoteTask) -> Void
    @State private var hovering = false

    private var dotColor: Color {
        switch task.kind {
        case "waiting": return PetMood.waiting.color
        case "running": return PetMood.running.color
        case "done": return PetMood.done.color
        default: return .secondary
        }
    }

    private func progressColor(_ phase: String) -> Color {
        switch phase {
        case "tool": return PetMood.waiting.color
        case "responding": return PetMood.done.color
        case "thinking": return PetMood.running.color
        default: return .secondary
        }
    }

    private func progressSymbol(_ phase: String) -> String {
        switch phase {
        case "tool": return "wrench.and.screwdriver.fill"
        case "responding": return "text.bubble.fill"
        case "thinking": return "brain.head.profile"
        default: return "hourglass"
        }
    }

    private func actionSymbol(_ progress: RemoteProgress) -> String {
        guard let action = progress.action else { return progressSymbol(progress.phase) }
        switch action.kind {
        case "read", "write", "edit": return "doc.text.fill"
        case "bash": return "terminal.fill"
        case "glob", "grep": return "magnifyingglass"
        case "image": return "photo.fill"
        case "plugin": return "puzzlepiece.extension.fill"
        case "inspect": return "wrench.and.screwdriver.fill"
        case "search", "fetch": return "globe"
        case "subagent": return "person.2.fill"
        case "workflow": return "point.3.connected.trianglepath.dotted"
        case "todo": return "checklist"
        case "present": return "shippingbox.fill"
        default: return progressSymbol(progress.phase)
        }
    }

    private func progressHeadline(_ progress: RemoteProgress) -> String {
        if progress.phase == "tool", let tool = progress.tool, !tool.isEmpty {
            return L10n.text("Running \(tool)", "正在执行 \(tool)")
        }
        return L10n.phase(progress.phase)
    }

    var body: some View {
        Button {
            onOpen(task)
        } label: {
            HStack(spacing: 9) {
                Circle()
                    .fill(dotColor)
                    .frame(width: 7, height: 7)
                    .overlay(Circle().strokeBorder(dotColor.opacity(0.18), lineWidth: 4))
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 5) {
                        Text(task.title)
                            .font(.system(size: 12.2, weight: .semibold))
                            .lineLimit(1)
                            .truncationMode(.tail)
                        if task.current {
                            Text(L10n.text("CURRENT", "当前"))
                                .font(.system(size: 7, weight: .bold))
                                .tracking(0.4)
                                .foregroundStyle(Color.accentColor)
                                .padding(.horizontal, 4)
                                .padding(.vertical, 1)
                                .background(Capsule().fill(Color.accentColor.opacity(0.12)))
                        }
                    }
                    Text(L10n.taskMeta(task))
                        .font(.system(size: 10.2))
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                        .truncationMode(.tail)
                    if let progress = task.progress, task.kind == "running" || task.kind == "waiting" {
                        let todo = L10n.todoLine(progress)
                        if !todo.isEmpty {
                            HStack(spacing: 6) {
                                Image(systemName: "checklist")
                                    .font(.system(size: 10.5, weight: .semibold))
                                    .foregroundStyle(PetMood.running.color)
                                Text(todo)
                                    .font(.system(size: 11.6, weight: .semibold))
                                    .foregroundStyle(.primary.opacity(0.9))
                                    .lineLimit(1)
                                    .truncationMode(.tail)
                                Spacer(minLength: 4)
                                Text(L10n.todoCount(progress))
                                    .font(.system(size: 10.5, weight: .medium))
                                    .foregroundStyle(.secondary)
                                    .lineLimit(1)
                            }
                            .padding(.top, 2)
                        }
                        HStack(alignment: .top, spacing: 6) {
                            Image(systemName: actionSymbol(progress))
                                .font(.system(size: 10.5, weight: .semibold))
                                .foregroundStyle(progressColor(progress.phase))
                                .padding(.top, 2)
                            Text(L10n.actionLine(progress))
                                .font(.system(size: 12.2, weight: .semibold))
                                .foregroundStyle(progressColor(progress.phase))
                                .lineLimit(2)
                                .fixedSize(horizontal: false, vertical: true)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                        .padding(.top, 1)
                        HStack(spacing: 8) {
                            if !progress.trail.isEmpty {
                                Text(L10n.trail(progress))
                                    .font(.system(size: 10.8, weight: .medium))
                                    .foregroundStyle(.primary.opacity(0.7))
                                    .lineLimit(1)
                                    .truncationMode(.tail)
                            }
                            Spacer(minLength: 4)
                            Text(L10n.elapsed(progress.elapsedMs))
                                .font(.system(size: 10.8, weight: .medium))
                                .foregroundStyle(.secondary)
                                .lineLimit(1)
                                .fixedSize()
                        }
                    }
                }
                Spacer(minLength: 0)
                Image(systemName: "chevron.right")
                    .font(.system(size: 8.5, weight: .semibold))
                    .foregroundStyle(.tertiary)
                    .opacity(hovering ? 1 : 0.15)
            }
            .padding(.horizontal, 7)
            .padding(.vertical, 7)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 9, style: .continuous)
                    .fill(hovering ? Color.primary.opacity(0.065) : Color.clear)
            )
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .onHover { hovering = $0 }
        .help(L10n.text("Focus DeepSeek Harness and open this session", "切到 DeepSeek Harness 并打开这个会话"))
    }
}

struct NoticeView: View {
    let notice: PetNotice

    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            ZStack {
                Circle()
                    .fill(notice.kind == "waiting" ? PetMood.waiting.color : PetMood.done.color)
                    .frame(width: 21, height: 21)
                Image(systemName: notice.kind == "waiting" ? "exclamationmark" : "checkmark")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(notice.title)
                    .font(.system(size: 12, weight: .semibold))
                    .lineLimit(1)
                Text(notice.body)
                    .font(.system(size: 10.5))
                    .foregroundStyle(.secondary)
                    .lineLimit(2)
            }
            Spacer(minLength: 0)
        }
        .padding(.horizontal, 13)
        .padding(.vertical, 11)
        .frame(width: 320, alignment: .leading)
        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .strokeBorder(Color.primary.opacity(0.1), lineWidth: 0.6)
        )
        .shadow(color: .black.opacity(0.24), radius: 16, y: 8)
        .padding(10)
    }
}
