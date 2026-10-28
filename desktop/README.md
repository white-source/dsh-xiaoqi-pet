# Xiaoqi Pet for macOS

The native companion that puts Xiaoqi on the real desktop, outside the DeepSeek Harness window. It is a borderless, transparent, always-on-top macOS app that reads the live bridge exposed by the DSH plugin and shows what each running session is doing and how far it has got.

## Build

Requires macOS 13 or later and the Xcode command-line tools (`xcrun swiftc`).

```sh
cd desktop
./build.sh --install
open -a "$HOME/Applications/Xiaoqi Pet.app"
```

`build.sh` produces `dist/Xiaoqi Pet.app`, ad-hoc signs it, and `--install` copies it to `~/Applications`.

The app is an `LSUIElement` (no Dock icon). Use the paw icon in the menu bar to show or hide the pet, pin it, open the board, reconnect, or quit.

## What it shows

- The pet always floats above other windows and can be dragged anywhere. The pin freezes the position.
- The caption under the pet follows the active task: the current checklist item or concrete action where one is available, otherwise the phase (`Thinking`, `Running a tool`, `Writing the answer`).
- With one active task, a compact bubble under the pet begins with the task name and shows its action and elapsed time.
- With two or more sessions, the bottom bubble is hidden and a stack of color-coded drawer cards slides out beside the pet. Each task has its own stable color; cards show the current checklist item/action, elapsed time and recent trail. Clicking a card opens that session in DSH.
- The board row shows the current checklist item and concrete action (for example `修改 client.js` or `运行：Build the macOS app`), elapsed time, and the last three actions.
- Clicking a row queues an open-session command for DSH and brings the Harness window forward.
- A notice bubble appears when a session starts waiting for you or finishes while the pet is in another app.

## How the bridge works

The DSH plugin starts a token-protected loopback endpoint and writes discovery metadata to:

```
~/Library/Application Support/XiaoqiPet/bridge.json
```

The app reads that file, calls `/xiaoqi-pet/api/state` every 1.2 seconds with the bearer token, and calls `/xiaoqi-pet/api/command` when you open a session. The bridge is loopback-only; the token rotates when the plugin reloads. No message content is transferred, only session titles, project folder names, and derived progress facts.

The plugin also polls `/xiaoqi-pet/api/progress` for the in-page board. When the native app is connected, the in-page pet hides itself so you do not see two Xiaoqis; if the app is not running, the in-page pet comes back and its board has a **Show on desktop** button.

## Uninstall

Quit from the paw menu, then remove `~/Applications/Xiaoqi Pet.app`. The DSH plugin can stay installed; without the app, it simply runs in-page.
