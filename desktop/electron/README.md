# Xiaoqi Pet — Windows / Linux

This is the cross-platform companion built with Electron. It reads the same loopback bridge as the macOS Swift app, shows the pet and task panel, and supports Windows, Linux and macOS.

The macOS Swift app in `desktop/` remains the recommended native experience on macOS. This Electron app is primarily for Windows and Linux, and is also useful for development. On macOS it refuses to start while the native app is running, so two pets cannot appear at once.

## Run from source

Requires Node.js 22+ and npm.

```sh
cd desktop/electron
npm install
npm start
```

On macOS, if DSH's terminal environment exports `ELECTRON_RUN_AS_NODE=1`, launch with:

```sh
env -u ELECTRON_RUN_AS_NODE npm start
```

## Build distributables

```sh
npm run dist:win     # Windows zip (x64 + arm64)
npm run dist:linux   # Linux AppImage (x64 + arm64)
```

Artifacts are written to `desktop/electron/dist/`. They are unsigned. Windows SmartScreen may warn on first launch; Linux needs a compositing window manager for transparent windows.

If you want the DSH plugin's **Show on desktop** button to launch the app, place the built app at one of these paths:

- Windows: `%LOCALAPPDATA%\Programs\Xiaoqi Pet\Xiaoqi Pet.exe`, `%LOCALAPPDATA%\XiaoqiPet\Xiaoqi Pet.exe`, or `%ProgramFiles%\Xiaoqi Pet\Xiaoqi Pet.exe`
- Linux: `~/.local/bin/xiaoqi-pet`, `~/.local/share/xiaoqi-pet/Xiaoqi Pet.AppImage`, or `/opt/Xiaoqi Pet/xiaoqi-pet`

Otherwise launch it manually from the built folder.

## Behavior

- Transparent, frameless, always-on-top pet window.
- Drag the pet to move it; the position is remembered.
- A single task gets a task-name bubble under the pet.
- Two or more tasks show a task panel with one color-coded bordered card per task; cards show checklist/action progress and a recent trail.
- Click a task card to send the open-session command to DSH and bring the DSH app forward via `dsh://open`.
- The tray menu can show/hide the pet, open the panel, or quit.
- The signed-in DSH account wallet balance is shown on the pet's belly; it refreshes about once a minute and is hidden when signed out.
- Native notifications are used for new waiting tasks and background completions.
- Reads the bridge from:
  - macOS: `~/Library/Application Support/XiaoqiPet/bridge.json`
  - Windows: `%APPDATA%/XiaoqiPet/bridge.json`
  - Linux: `$XDG_CONFIG_HOME/xiaoqi-pet/bridge.json` or `~/.config/xiaoqi-pet/bridge.json`

## Verification status

The macOS Electron build is exercised in this checkout. Windows and Linux packages are configured but were not run on those operating systems in this environment; build them on each target OS and verify transparency, tray behavior, click-to-open and DPI scaling before calling them release-ready.
