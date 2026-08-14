# dsh-plugin-wallpaper

DeepSeek Harness Web GUI 的自定义壁纸插件：设置一张背景图，并可分别调节
**主界面 / 侧边栏 / 输入框 / 消息气泡** 的壁纸可见度（半透明遮罩）。

## 功能

- 壁纸图片：`data:` URI、`http(s)://` URL，或本机图片文件路径（自动内联为 data URI）
- 铺满方式：cover（铺满裁剪）/ contain（完整显示）/ stretch（拉伸）
- 四个区域独立调节「壁纸可见度」：0% = 完全隐藏，100% = 完全透明可见
- 设置面板可折叠；拖动滑块即时生效；浅色 / 深色主题均支持

## 安装（4 步）

1. 把 `dsh-plugin-wallpaper` 目录放入你的 profile 依赖位置：
   `~/.dsh/profiles/web/node_modules/dsh-plugin-wallpaper/`
   （或若已发布到 npm：在 profile 目录执行 `npm install dsh-plugin-wallpaper`）

2. 在 profile 的 `cordis.patch.yml` 追加一行（让 dsh 加载插件）：
   ```yaml
   - insert:
       - id: wallpaper
         name: dsh-plugin-wallpaper
   ```

3. **重要**：在 DSH 安装目录下找到
   `node_modules/@deepseek-ai/dsh-host-apiproxy/lib/index.js`，
   把 `"ui-wallpaper"` 加进 `WEB_SETTINGS_NAMESPACES` 数组
   （否则网页端的壁纸设置面板不会显示，这是 DSH 的设置命名空间暴露白名单）：
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

4. 重启 `dsh web`，打开 `http://127.0.0.1:3080`。

> 注：第 3 步修改会在升级 / 重装 DSH 后被覆盖，届时重新加一行即可。

## 使用

- 「设置 → 通用 → 壁纸」：总开关、图片地址、铺满方式、各区域可见度滑块
- 图片留空则插件不生效（界面保持默认主题）；填入任意一种图片来源后生效
- 本地路径示例：`C:\Users\me\Pictures\wallpaper.png`

## 许可

MIT
