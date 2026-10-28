import AppKit
import Combine
import Foundation

final class AppDelegate: NSObject, NSApplicationDelegate, NSMenuDelegate {
    private let model = PetModel()
    private let bridge = BridgeClient()
    private var petWindow: PetWindowController!
    private var boardWindow: BoardWindowController!
    private var drawerWindow: DrawerWindowController!
    private var bubbleWindow: BubbleWindowController!
    private var noticeWindow: NoticeWindowController!
    private var statusItem: NSStatusItem!
    private var pollTimer: Timer?
    private var inFlight = false
    private var failures = 0

    private var showHideItem: NSMenuItem!
    private var boardItem: NSMenuItem!
    private var pinItem: NSMenuItem!

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        if CommandLine.arguments.contains("--light") {
            NSApp.appearance = NSAppearance(named: .aqua)
        }
        NSWindow.allowsAutomaticWindowTabbing = false
        UserDefaults.standard.register(defaults: ["xiaoqi.pet.locked": false])

        petWindow = PetWindowController(model: model)
        boardWindow = BoardWindowController(model: model, bridge: bridge, petController: petWindow)
        drawerWindow = DrawerWindowController(model: model, bridge: bridge, petController: petWindow)
        bubbleWindow = BubbleWindowController(model: model, petController: petWindow)
        noticeWindow = NoticeWindowController()

        model.onNotice = { [weak self] notice in
            guard let self else { return }
            self.noticeWindow.show(notice, near: self.petWindow.panel.frame)
        }
        petWindow.onFrameChanged = { [weak self] frame in
            guard let self else { return }
            self.boardWindow.reposition(near: frame)
            self.drawerWindow.reposition(near: frame)
            self.bubbleWindow.reposition(near: frame)
            self.noticeWindow.reposition(near: frame)
        }

        buildStatusItem()
        petWindow.show()
        refreshState()
        if CommandLine.arguments.contains("--board") {
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { [weak self] in
                self?.model.boardOpen = true
            }
        }
        pollTimer = Timer.scheduledTimer(withTimeInterval: 1.2, repeats: true) { [weak self] _ in
            self?.refreshState()
        }
        RunLoop.main.add(pollTimer!, forMode: .common)
        print("Xiaoqi Pet started")
    }

    func applicationWillTerminate(_ notification: Notification) {
        pollTimer?.invalidate()
        if let statusItem {
            NSStatusBar.system.removeStatusItem(statusItem)
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        false
    }

    private func buildStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "pawprint.fill", accessibilityDescription: "Xiaoqi")
            button.image?.isTemplate = true
            button.toolTip = L10n.text("Xiaoqi desktop companion", "小栖桌面伙伴")
        }
        let menu = NSMenu()
        menu.autoenablesItems = false
        menu.delegate = self

        showHideItem = NSMenuItem(title: "", action: #selector(togglePetVisibility), keyEquivalent: "")
        showHideItem.target = self
        menu.addItem(showHideItem)

        boardItem = NSMenuItem(title: "", action: #selector(toggleBoardFromMenu), keyEquivalent: "")
        boardItem.target = self
        menu.addItem(boardItem)

        pinItem = NSMenuItem(title: "", action: #selector(togglePinFromMenu), keyEquivalent: "")
        pinItem.target = self
        menu.addItem(pinItem)

        menu.addItem(.separator())

        let reconnect = NSMenuItem(title: L10n.text("Reconnect", "重新连接"), action: #selector(reconnect), keyEquivalent: "r")
        reconnect.target = self
        menu.addItem(reconnect)

        let quit = NSMenuItem(title: L10n.text("Quit Xiaoqi", "退出小栖"), action: #selector(quit), keyEquivalent: "q")
        quit.target = self
        menu.addItem(quit)

        statusItem.menu = menu
        menuWillOpen(menu)
    }

    func menuWillOpen(_ menu: NSMenu) {
        showHideItem.title = petWindow.isVisible
            ? L10n.text("Hide Xiaoqi", "隐藏小栖")
            : L10n.text("Show Xiaoqi", "显示小栖")
        boardItem.title = model.boardOpen
            ? L10n.text("Close task board", "收起任务看板")
            : L10n.text("Open task board", "打开任务看板")
        pinItem.title = model.locked
            ? L10n.text("Unpin position", "解除固定")
            : L10n.text("Pin position", "固定位置")
        pinItem.state = model.locked ? .on : .off
    }

    @objc private func togglePetVisibility() {
        if petWindow.isVisible {
            model.boardOpen = false
            noticeWindow.hide()
            petWindow.hide()
            drawerWindow.petVisibilityChanged()
            bubbleWindow.petVisibilityChanged()
        } else {
            petWindow.show()
            drawerWindow.petVisibilityChanged()
            bubbleWindow.petVisibilityChanged()
        }
    }

    @objc private func toggleBoardFromMenu() {
        if !petWindow.isVisible { petWindow.show() }
        model.boardOpen.toggle()
        if model.boardOpen {
            boardWindow.reposition(near: petWindow.panel.frame)
        }
    }

    @objc private func togglePinFromMenu() {
        model.toggleLock()
    }

    @objc private func reconnect() {
        _ = bridge.reloadDescriptor(force: true)
        failures = 0
        refreshState()
    }

    @objc private func quit() {
        NSApp.terminate(nil)
    }

    private func refreshState() {
        guard !inFlight else { return }
        inFlight = true
        bridge.fetchState { [weak self] result in
            DispatchQueue.main.async {
                guard let self else { return }
                self.inFlight = false
                switch result {
                case .success(let state):
                    self.failures = 0
                    self.model.apply(state)
                case .failure(let error):
                    self.failures += 1
                    if self.failures == 1 {
                        print("Xiaoqi bridge: \(error.localizedDescription)")
                    }
                    if self.failures >= 3 {
                        self.model.markDisconnected()
                    }
                }
            }
        }
    }
}
