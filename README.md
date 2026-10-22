# dsh-sidebar-panel-fold

A tiny **DeepSeek Harness Web UI** plugin that adds a collapsible group header to the sidebar, so the global panel entries stop eating the whole column.

```
▾ Menu entries        ← this plugin
    Plugins
    Plugin Market
    Schedules
    Context
    SSH
    MCP Connectors
```

Collapse it and only one row is left:

```
▸ Menu entries
```

The fold state is remembered in `localStorage`, so it survives a reload.

## Install

### 1. Clone it somewhere stable

```bash
git clone https://github.com/2646601154/dsh-sidebar-panel-fold.git
```

### 2. Install the directory as a bundle

Open the Harness Web UI → **Plugins** panel → *install bundle*, and give it the absolute path of the cloned directory, e.g.

```
/Users/you/code/dsh-sidebar-panel-fold
```

or on Windows `D:\code\dsh-sidebar-panel-fold`.

From an agent session you can do the same through the plugin-manager tool:

```json
{ "action": "install_bundle", "target": "D:\\code\\dsh-sidebar-panel-fold" }
```

The bundle is enabled on install. If the sidebar does not change immediately, reload the window (`Ctrl+R` / `Cmd+R`).

If your plugin manager accepts npm-style specs, `github:2646601154/dsh-sidebar-panel-fold` works as `target` too — it resolves through pnpm, so it needs git available on the machine.

## How it works (and why it is done this way)

`sidebar.panellist` is a plain list slot: each entry may only declare `{ id, order, label }`, and the shipped sidebar renders every entry as a **flat row** inside `nav[class*="panelList"]`. There is no grouping API, and replacing the whole `sidebar` slot (`shadows-shipped-ui`) would throw away the session tree. So the plugin:

1. registers its own entry in `sidebar.panellist` with `order: -1` and a localized `label` thunk — that is the header row;
2. marks its own glyph with `data-dspf-header` and paints a chevron from inside its slot component;
3. intercepts the click of that row in the **document capture phase** (`preventDefault()` + `stopPropagation()`), so the host's `selectPanel(id)` never runs — the plugin has no matching main panel, and that call would throw;
4. toggles `data-dsh-panel-fold="1"` on `<html>`; a component-scoped stylesheet hides every other panel row while it is set:

```css
html[data-dsh-panel-fold="1"] nav[class*="panelList"] > button[class*="panelRow"]:not(:has([data-dspf-header])) {
  display: none !important;
}
```

Nothing else in the sidebar is touched: no DOM is written outside the component, no other plugin's entries are re-registered, and everything (attribute, listener, `<style>`) is removed when the plugin unloads.

## Compatibility

The hide rule matches the shipped CSS-module class names by suffix (`panelList`, `panelRow`) because they carry a build hash. If a future Harness release renames them, folding silently stops working; the fix is the two suffixes at the top of [`client.js`](./client.js) (`PANEL_LIST_SELECTOR` and the `panelRow` match). Issues and PRs welcome.

Written against `@deepseek-ai/dsh-client-ui-sidebar` as shipped in DeepSeek Harness `0.2.1-rc.2`.

## Layout

| File | Purpose |
| --- | --- |
| `index.js` | Host half — intentionally empty `apply()` |
| `client.js` | Web half — group header, click interception, fold stylesheet |
| `locale/*.json` | Marketplace card copy (zh / en) |
| `cordis.patch.yml` | Bundle patch that inserts the plugin |

## 中文说明

在侧边栏面板列表最上方加一行「功能入口」标题行，点一下就把 插件 / 插件市场 / 自动化任务 / 上下文洞察 / SSH / MCP 连接器 整组收起，再点展开。折叠状态记在 `localStorage`，刷新后保持。

安装方式同上：把仓库克隆到本地，用插件面板或 `install_bundle` 指向该目录（也支持 `github:2646601154/dsh-sidebar-panel-fold` 这种写法，前提是机器上有 git）。安装后若侧栏没变化，按 `Ctrl+R` 刷新窗口。

## License

MIT
