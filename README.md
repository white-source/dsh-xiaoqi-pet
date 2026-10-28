# Xiaoqi Desk Pet

Xiaoqi is a companion for DeepSeek Harness with two surfaces:

- a frame-wide pet inside the DSH Web UI, and
- a native macOS pet that lives on the real desktop, outside the Harness window.

Both read the same live session state. The native pet is a separate always-on-top, transparent window; drag it anywhere and pin it. When it connects, the in-page pet hides so you do not see two Xiaoqis. Quit the native app and the in-page pet comes back.

## What it does

- **One pet, every session.** The board groups sessions into *Needs you*, *In progress*, and *Just finished*, with title, project folder, status, and update time.
- **Task-name bubble for one task.** With a single active session, a compact bubble under the pet begins with the task name and shows the current action and elapsed time.
- **Color-coded task drawers for several tasks.** With two or more active sessions, the bottom bubble disappears and one drawer card per task fans out beside the pet. Each task keeps a stable, distinct color. Cards show the checklist item or action, elapsed time and recent trail; clicking a card brings DSH forward and opens that exact session.
- **Task-specific progress while you are elsewhere.** The board shows the current checklist item, the concrete action in flight (for example `修改 client.js`, `运行：Build the macOS app`, `读取 README.md`), elapsed time, and the last three actions. The native pet's caption follows the current task or action.
- **Live, not polled.** The in-page board reads the Session list and status snapshots supplied to the `shell.overlay` slot. The native app polls the token-protected local bridge every 1.2 seconds.
- **Speaks up.** A new approval, question, plan review, or a session finishing in the background raises a notice. In the native app the notice is a separate non-blocking desktop bubble.
- **Drag and pin.** Move the pet anywhere; pin the position. The in-page pet uses viewport-relative coordinates and the native app uses screen coordinates, both persisted locally.
- **Open the exact session.** Clicking a task row on the native board queues an open-session command for DSH and brings Harness to the front. The in-page row opens it directly.
- **English and Chinese**, light and dark system appearance, original SVG artwork, no external images or fonts.

No message content is read for the board. The bridge transfers session titles, project folder names, checklist text, tool/action labels, and derived timing facts only.

## Install the DSH plugin

From a local checkout:

```sh
dsh plugin --profile web add /absolute/path/to/dsh-xiaoqi-pet
```

After the npm release:

```sh
dsh plugin --profile web add dsh-xiaoqi-pet
```

Then reopen or reload the DSH Web UI. The in-page pet appears near the bottom-left.

## Install the native macOS pet

Requires macOS 13 or later and Xcode command-line tools.

```sh
cd desktop
./build.sh --install
open -a "$HOME/Applications/Xiaoqi Pet.app"
```

The app is a menu-bar accessory (`LSUIElement`) with no Dock icon. Its paw menu offers show/hide, pin, open board, reconnect, and quit.

If the native app is not running, the in-page board's monitor button tries to launch it from `~/Applications/Xiaoqi Pet.app` or `/Applications/Xiaoqi Pet.app`.

See [desktop/README.md](desktop/README.md) for build details and the local bridge contract.

## What "pinned" means

- **In-page pet:** a frame-wide overlay inside the DSH Web UI. It stays above the sidebar, conversation, and composer, and remembers its viewport-relative position.
- **Native pet:** a separate borderless `NSPanel` at the floating window level, with `.canJoinAllSpaces` and `.fullScreenAuxiliary`. It is always-on-top across Spaces and can be placed anywhere on the desktop, including outside the Harness window.

## Compatibility

- DSH `0.2.1-rc.1` through `0.2.1-rc.3`
- Chromium-based DSH Web UI for the in-page pet
- macOS 13+ for the native pet
- No runtime dependencies, no install scripts, no outbound network calls

## Development

The bundle is plain JavaScript: `index.js` is the Host half (bridge, session progress, local command queue), and `client.js` is the Web module registered in `shell.overlay`.

```sh
node --check client.js
node --check index.js
npm pack --dry-run
./desktop/build.sh
```

Useful check after a change:

```sh
TOKEN=$(python3 -c 'import json,os; print(json.load(open(os.path.expanduser("~/Library/Application Support/XiaoqiPet/bridge.json")))["token"])')
curl -sS -H "Authorization: Bearer $TOKEN" http://127.0.0.1:PORT/xiaoqi-pet/api/state
```

## License

MIT. See [LICENSE](LICENSE).
