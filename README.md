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

### Option A — straight from GitHub (needs `git` on the machine)

Open the Harness Web UI → **Plugins** panel → *install bundle* and use

```
github:2646601154/dsh-sidebar-panel-fold
```

or from an agent session through the plugin-manager tool:

```json
{ "action": "install_bundle", "target": "github:2646601154/dsh-sidebar-panel-fold" }
```

The bundle is enabled as soon as it installs. If the sidebar does not change immediately, reload the window (`Ctrl+R` / `Cmd+R`).

### Option B — clone, then install the directory

```bash
git clone https://github.com/2646601154/dsh-sidebar-panel-fold.git
```

then point *install bundle* at the absolute path of the clone:

```json
{ "action": "install_bundle", "target": "D:\\code\\dsh-sidebar-panel-fold" }
```

This is also what you want if you plan to edit the plugin — a directory install is linked, so changes take effect without reinstalling.

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

安装：在插件面板里用 `github:2646601154/dsh-sidebar-panel-fold` 直接装；或者把仓库克隆到本地后用 `install_bundle` 指向该目录（目录安装是软链，适合想改代码的人）。装完若侧栏没变化，按 `Ctrl+R` 刷新窗口。

## License

MIT
