import AppKit
import Combine
import SwiftUI

final class XiaoqiPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

private func visibleFrame(containing point: NSPoint) -> NSRect {
    NSScreen.screens.first(where: { $0.frame.contains(point) })?.visibleFrame
        ?? NSScreen.main?.visibleFrame
        ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
}

private func clampOrigin(_ origin: NSPoint, size: NSSize, within frame: NSRect) -> NSPoint {
    NSPoint(
        x: min(max(origin.x, frame.minX + 8), max(frame.minX + 8, frame.maxX - size.width - 8)),
        y: min(max(origin.y, frame.minY + 8), max(frame.minY + 8, frame.maxY - size.height - 8))
    )
}

final class PetWindowController {
    let model: PetModel
    let panel: XiaoqiPanel
    var onFrameChanged: ((NSRect) -> Void)?
    var onRequestOpenBoard: (() -> Void)?

    private var dragStartOrigin = NSPoint.zero
    private var dragStartMouse = NSPoint.zero
    private var dragging = false

    private static let xKey = "xiaoqi.pet.x"
    private static let yKey = "xiaoqi.pet.y"

    init(model: PetModel) {
        self.model = model
        panel = XiaoqiPanel(
            contentRect: NSRect(x: 0, y: 0, width: 164, height: 186),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isMovableByWindowBackground = false
        panel.isReleasedWhenClosed = false
        panel.animationBehavior = .none
        panel.acceptsMouseMovedEvents = true
        panel.titleVisibility = .hidden
        panel.titlebarAppearsTransparent = true

        let view = PetStageView(
            model: model,
            onToggleBoard: { [weak model] in model?.boardOpen.toggle() },
            onToggleLock: { [weak model] in model?.toggleLock() },
            onBeginDrag: { [weak self] in self?.beginDrag() },
            onDrag: { [weak self] in self?.drag() },
            onEndDrag: { [weak self] in self?.endDrag() }
        )
        panel.contentView = NSHostingView(rootView: view )

        let defaults = UserDefaults.standard
        let size = panel.frame.size
        var origin: NSPoint
        if defaults.object(forKey: Self.xKey) != nil, defaults.object(forKey: Self.yKey) != nil {
            origin = NSPoint(
                x: defaults.double(forKey: Self.xKey),
                y: defaults.double(forKey: Self.yKey)
            )
        } else {
            let frame = NSScreen.main?.visibleFrame ?? visibleFrame(containing: .zero)
            origin = NSPoint(x: frame.minX + 38, y: frame.minY + 74)
        }
        let screen = visibleFrame(containing: NSPoint(x: origin.x + size.width / 2, y: origin.y + size.height / 2))
        panel.setFrameOrigin(clampOrigin(origin, size: size, within: screen))
    }

    var isVisible: Bool { panel.isVisible }

    func show() {
        panel.orderFrontRegardless()
    }

    func hide() {
        panel.orderOut(nil)
    }

    func toggle() {
        panel.isVisible ? hide() : show()
    }

    func beginDrag() {
        guard !model.locked else { return }
        dragging = true
        dragStartOrigin = panel.frame.origin
        dragStartMouse = NSEvent.mouseLocation
    }

    func drag() {
        guard dragging, !model.locked else { return }
        let mouse = NSEvent.mouseLocation
        let next = NSPoint(
            x: dragStartOrigin.x + mouse.x - dragStartMouse.x,
            y: dragStartOrigin.y + mouse.y - dragStartMouse.y
        )
        let screen = visibleFrame(containing: NSPoint(x: mouse.x, y: mouse.y))
        panel.setFrameOrigin(clampOrigin(next, size: panel.frame.size, within: screen))
        onFrameChanged?(panel.frame)
    }

    func endDrag() {
        guard dragging else { return }
        dragging = false
        let origin = panel.frame.origin
        UserDefaults.standard.set(origin.x, forKey: Self.xKey)
        UserDefaults.standard.set(origin.y, forKey: Self.yKey)
        onFrameChanged?(panel.frame)
    }
}

final class BoardWindowController {
    let model: PetModel
    let panel: XiaoqiPanel
    let bridge: BridgeClient
    private var cancellable: AnyCancellable?
    private var tasksCancellable: AnyCancellable?
    private weak var petController: PetWindowController?

    init(model: PetModel, bridge: BridgeClient, petController: PetWindowController) {
        self.model = model
        self.bridge = bridge
        self.petController = petController
        panel = XiaoqiPanel(
            contentRect: NSRect(x: 0, y: 0, width: 368, height: 530),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isReleasedWhenClosed = false
        panel.animationBehavior = .none

        let view = BoardView(
            model: model,
            onClose: { [weak model] in model?.boardOpen = false },
            onToggleLock: { [weak model] in model?.toggleLock() },
            onOpenTask: { [weak self] task in
                self?.open(task)
            }
        )
        panel.contentView = NSHostingView(rootView: view)

        cancellable = model.$boardOpen
            .removeDuplicates()
            .sink { [weak self] open in
                guard let self else { return }
                if open {
                    self.resizeForContent()
                    self.reposition(near: self.petController?.panel.frame)
                    self.panel.orderFrontRegardless()
                } else {
                    self.panel.orderOut(nil)
                }
            }

        tasksCancellable = model.$tasks
            .removeDuplicates()
            .sink { [weak self] _ in
                guard let self, self.model.boardOpen else { return }
                self.resizeForContent()
                self.reposition(near: self.petController?.panel.frame)
            }
    }

    private func resizeForContent() {
        let groups = [model.waiting, model.running, model.done].filter { !$0.isEmpty }
        let desired: CGFloat
        if groups.isEmpty {
            desired = 378
        } else {
            var height: CGFloat = 112
            for group in groups {
                height += 26
                for task in group {
                    let hasProgress = task.progress != nil && (task.kind == "running" || task.kind == "waiting")
                    height += hasProgress ? 128 : 46
                }
            }
            height += CGFloat(max(0, groups.count - 1)) * 4
            desired = min(530, max(300, height))
        }
        panel.setContentSize(NSSize(width: 368, height: desired))
    }

    func reposition(near petFrame: NSRect?) {
        guard let pet = petFrame ?? petController?.panel.frame else { return }
        let screen = visibleFrame(containing: NSPoint(x: pet.midX, y: pet.midY))
        let size = panel.frame.size
        var x = pet.maxX + 12
        if x + size.width > screen.maxX - 8 {
            x = pet.minX - size.width - 12
        }
        if x < screen.minX + 8 {
            x = min(max(screen.minX + 8, pet.midX - size.width / 2), screen.maxX - size.width - 8)
        }
        var y = pet.midY - size.height * 0.55
        y = min(max(y, screen.minY + 8), screen.maxY - size.height - 8)
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }

    private func open(_ task: RemoteTask) {
        bridge.openSession(task.id) { _ in }
        model.activateDSH()
        model.boardOpen = false
    }
}

final class NoticeWindowController {
    private let panel: XiaoqiPanel
    private var hideTimer: Timer?

    init() {
        panel = XiaoqiPanel(
            contentRect: NSRect(x: 0, y: 0, width: 340, height: 108),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.isFloatingPanel = true
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.hidesOnDeactivate = false
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = false
        panel.isReleasedWhenClosed = false
        panel.animationBehavior = .none
        panel.ignoresMouseEvents = true
        panel.alphaValue = 0
    }

    func show(_ notice: PetNotice, near petFrame: NSRect?) {
        hideTimer?.invalidate()
        panel.contentView = NSHostingView(rootView: NoticeView(notice: notice))
        if let pet = petFrame {
            let screen = visibleFrame(containing: NSPoint(x: pet.midX, y: pet.midY))
            let size = panel.frame.size
            var x = pet.midX - size.width / 2
            x = min(max(x, screen.minX + 8), screen.maxX - size.width - 8)
            var y = pet.maxY + 8
            if y + size.height > screen.maxY - 8 {
                y = pet.minY - size.height - 8
            }
            y = min(max(y, screen.minY + 8), screen.maxY - size.height - 8)
            panel.setFrameOrigin(NSPoint(x: x, y: y))
        }
        panel.alphaValue = 0
        panel.orderFrontRegardless()
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.18
            panel.animator().alphaValue = 1
        }
        hideTimer = Timer.scheduledTimer(withTimeInterval: 7, repeats: false) { [weak self] _ in
            self?.hide()
        }
    }

    func reposition(near petFrame: NSRect?) {
        guard panel.isVisible, let pet = petFrame else { return }
        let screen = visibleFrame(containing: NSPoint(x: pet.midX, y: pet.midY))
        let size = panel.frame.size
        var x = pet.midX - size.width / 2
        x = min(max(x, screen.minX + 8), screen.maxX - size.width - 8)
        var y = pet.maxY + 8
        if y + size.height > screen.maxY - 8 {
            y = pet.minY - size.height - 8
        }
        y = min(max(y, screen.minY + 8), screen.maxY - size.height - 8)
        panel.setFrameOrigin(NSPoint(x: x, y: y))
    }

    func hide() {
        hideTimer?.invalidate()
        hideTimer = nil
        NSAnimationContext.runAnimationGroup { context in
            context.duration = 0.16
            panel.animator().alphaValue = 0
        } completionHandler: { [weak self] in
            self?.panel.orderOut(nil)
        }
    }
}
