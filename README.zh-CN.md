# 小栖桌宠

小栖是 DeepSeek Harness 的桌宠，有两个形态：

- DSH 网页里的全帧浮层桌宠（全平台）；
- 在 Harness 窗口之外的独立置顶桌宠：
  - macOS：原生 Swift App；
  - Windows/Linux：Electron 伴侣（包含源码和构建脚本）。

两边读取同一份实时会话状态。原生桌宠连接后，网页里的桌宠会自动隐藏，避免出现两只；退出原生 App，网页桌宠就会回来。

## 功能

- **一只宠物，多个会话。** 看板把会话分成「需要你」「进行中」「刚完成」，显示标题、项目目录、状态和更新时间。
- **肚子上的账户余额。** 已登录的 DSH 账户钱包余额（充值 + 赠送）以小徽章显示在桌宠肚子上，即使没有任务也会显示，大约每分钟刷新；未登录时自动隐藏。网页内右键小栖可关闭，刷新页面后恢复。
- **独立边框和任务配色。** 看板内每个任务都是单独卡片，有清晰的细边框、轻微底色和稳定任务色，多个任务不会混成一片。
- **切到别的应用也能看到任务相关的进展。** 看板会显示当前清单项、正在做的具体动作（例如 `修改 client.js`、`运行：构建 macOS App`、`读取 README.md`）、已用时和最近三个动作。原生桌宠下方的状态条跟随当前任务或动作。
- **实时而非轮询。** 网页看板读取 `shell.overlay` 槽位提供的 Session 列表和状态快照；原生 App 每 1.2 秒读取一次带 token 的本地桥接。
- **主动提醒。** 新的工具确认、问题、计划审核，或后台会话完成时会出现通知。原生 App 使用独立的桌面通知气泡，不阻挡鼠标。
- **拖动与固定。** 网页桌宠使用窗口内相对坐标，原生桌宠使用屏幕坐标；两者都会记住位置，图钉可锁定。
- **直达会话。** 点击原生看板里的任务会发送打开会话命令并切到 Harness；网页看板则直接打开。
- **中英文、明暗主题、原创 SVG 形象**，不加载外部图片或字体。

看板不会读取消息正文。桥接只传会话标题、项目目录名、任务清单文本、工具/动作标签和推导出的时间信息。

## 安装 DSH 插件

本地目录安装：

```sh
dsh plugin --profile web add /absolute/path/to/dsh-xiaoqi-pet
```

npm 发布后：

```sh
dsh plugin --profile web add dsh-xiaoqi-pet
```

然后重新打开或刷新 DSH Web UI。网页桌宠默认在左下角。

## 安装桌面桌宠

### macOS 原生 App

需要 macOS 13+ 和 Xcode 命令行工具。

```sh
cd desktop
./build.sh --install
open -a "$HOME/Applications/Xiaoqi Pet.app"
```

App 是菜单栏附属应用（`LSUIElement`），没有 Dock 图标。菜单栏爪印里可以显示/隐藏、固定、打开看板、重新连接或退出。

如果原生 App 没运行，网页看板上的显示器按钮会尝试从 `~/Applications/Xiaoqi Pet.app` 或 `/Applications/Xiaoqi Pet.app` 启动它。

构建细节和本地桥接协议见 [desktop/README.md](desktop/README.md)。

### Windows / Linux Electron 伴侣

跨平台伴侣在 `desktop/electron`，读取同一个桥接，使用相同的任务配色和点击跳转流程。

```sh
cd desktop/electron
npm install
npm start
```

构建：

```sh
npm run dist:win     # Windows zip
npm run dist:linux   # Linux AppImage
```

详见 [desktop/electron/README.md](desktop/electron/README.md)。Windows/Linux 包已配置，但当前环境未在对应系统上实机运行；发布前需在目标系统或 GitHub Actions 中构建验证。

## “固定”的范围

- **网页桌宠：** DSH Web UI 内的全帧浮层，滚动、切换会话时始终停在上层，位置按视口相对坐标保存。
- **原生桌宠：** 独立的无边框 `NSPanel`，浮窗层级、跨 Space、全屏辅助，可以放到桌面任何位置，包括 Harness 窗口之外。

## 兼容性

- DSH `0.2.1-rc.1` 至 `0.2.1-rc.3`
- 网页桌宠需要基于 Chromium 的 DSH Web UI
- macOS 原生桌宠需要 macOS 13+
- Windows/Linux 使用 Electron 伴侣
- 无运行时依赖、无安装脚本、无对外网络请求

## 开发

`index.js` 是 Host 部分（桥接、进度推导、本地命令队列），`client.js` 注册到 `shell.overlay`。

```sh
node --check client.js
node --check index.js
npm pack --dry-run
./desktop/build.sh
```

## 许可证

MIT，见 [LICENSE](LICENSE)。
