# dsh-plugin-wallpaper

DeepSeek Harness Web GUI 的自定义壁纸插件：设置一张背景图，并可分别调节
**主界面 / 侧边栏 / 输入框 / 消息气泡** 的壁纸可见度（半透明遮罩）。

## 功能

- 壁纸图片：`data:` URI、`http(s)://` URL，或本机图片文件路径（自动内联为 data URI）
- 铺满方式：cover（铺满裁剪）/ contain（完整显示）/ stretch（拉伸）
- 四个区域独立调节「壁纸可见度」：0% = 完全隐藏，100% = 完全透明可见
- 设置面板可折叠；拖动滑块即时生效；浅色 / 深色主题均支持

## 安装

> 本插件以官方「组合包 bundle」格式分发：`package.json` 声明 `dsh.bundle`，
> 用 `dsh plugin add` 安装时会自动激活。若你的 dsh 版本没有 `dsh plugin` 命令，
> 见下方「手动方式」。

### 方式 A：从 npm 安装（包发布后）
```sh
dsh plugin --profile web add dsh-plugin-wallpaper
```

### 方式 B：从 tarball 安装
```sh
dsh plugin --profile web add ./dsh-plugin-wallpaper-0.1.0.tgz
```

### 方式 C：从 GitHub 安装（拉取源码，需要包的 prepare 构建脚本）
```sh
dsh plugin --profile web add github:<你的用户名>/dsh-plugin-wallpaper
```

### 手动方式（不依赖 `dsh plugin`）
1. 把本包放入 `~/.dsh/profiles/web/node_modules/dsh-plugin-wallpaper/`
2. 在 `~/.dsh/profiles/web/cordis.patch.yml` 追加：
   ```yaml
   - insert:
       - id: wallpaper
         name: dsh-plugin-wallpaper
   ```

### 安装后必需步骤：设置命名空间白名单

DSH 的 API 网关只允许 `WEB_SETTINGS_NAMESPACES` 白名单里的设置命名空间被网页端
读写——这是 DSH 当前版本（rc.6）的设计边界（官方注释说明未来会移到
`settings.register()` 由插件自行声明暴露）。**不执行这步，网页端的壁纸设置面板不会显示**
（宿主端的壁纸仍能注入，只是无法在界面上调节）。

一键脚本（自动定位 apiproxy 文件并加行，幂等，可重复执行）：
```sh
node scripts/expose-namespace.mjs
```

或手动编辑 `node_modules/@deepseek-ai/dsh-host-apiproxy/lib/index.js`，
把 `"ui-wallpaper"` 加进 `WEB_SETTINGS_NAMESPACES` 数组：
```js
const WEB_SETTINGS_NAMESPACES = [
  "agent-loop",
  "shell",
  "locale",
  "permission",
  "ui-conversation",
  "ui-theme",
  "web-search-deepseek",
  "ui-wallpaper"
];
```

> 注意：白名单修改在 dsh 升级 / 重装后会丢失，需重新执行脚本或手动加行。

最后重启 `dsh web`，打开 `http://127.0.0.1:3080`。

## 使用

- 「设置 → 通用 → 壁纸」：总开关、图片地址、铺满方式、各区域可见度滑块
- 图片留空则插件不生效（界面保持默认主题）；填入任意一种图片来源后生效
- 本地路径示例：`C:\Users\me\Pictures\wallpaper.png`

## 许可

MIT
