window.__ModuleLoader__.load({
  id: "dsh-sidebar-panel-fold",
  factory(require) {
    const React = require("react");
    const h = React.createElement;

    /** Locale namespace owned by this plugin. */
    const NS = "sidebar-panel-fold";
    /** Attribute set on <html> while the global panel rows are folded away. */
    const FOLD_ATTR = "data-dsh-panel-fold";
    /** Where the fold preference survives a reload. */
    const STORAGE_KEY = "dsh.sidebar-panel-fold.folded";
    /** Marks the one row that must stay visible while the group is folded. */
    const HEADER_MARK = "data-dspf-header";
    /** The shipped sidebar renders its global panel rows in this nav. */
    const PANEL_LIST_SELECTOR = 'nav[class*="panelList"]';

    const zh = { group: "扩展" };
    const en = { group: "Extensions" };

    const CSS = `
.dspf-glyph {
	display: inline-flex;
	flex: none;
	align-items: center;
	justify-content: center;
	color: inherit;
}
.dspf-chevron {
	transition: transform 0.15s var(--ds-ease-in-out);
}
.dspf-chevron[data-folded="1"] {
	transform: rotate(-90deg);
}
html[${FOLD_ATTR}="1"] ${PANEL_LIST_SELECTOR} > button[class*="panelRow"]:not(:has([${HEADER_MARK}])) {
	display: none !important;
}
`;

    function readFolded() {
      try {
        return window.localStorage.getItem(STORAGE_KEY) === "1";
      } catch {
        return false;
      }
    }

    function writeFolded(value) {
      try {
        window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
      } catch {
        /* a blocked storage quota is not worth failing the click over */
      }
    }

    /** Fold state lives outside React so the row and the attribute agree. */
    let folded = readFolded();
    const listeners = new Set();

    function applyAttribute(value) {
      const root = document.documentElement;
      if (value) root.setAttribute(FOLD_ATTR, "1");
      else root.removeAttribute(FOLD_ATTR);
    }

    function setFolded(value) {
      if (value === folded) return;
      folded = value;
      writeFolded(value);
      applyAttribute(value);
      for (const listener of [...listeners]) listener();
    }

    function subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    /** Re-render the header glyph whenever the fold state changes. */
    function useFolded() {
      const [, bump] = React.useReducer((n) => n + 1, 0);
      React.useEffect(() => subscribe(bump), []);
      return folded;
    }

    /**
     * The group header's glyph. The shipped row draws the label and owns the
     * click, so this component only paints state and marks its own row.
     */
    function GroupHeader({ size = 16 }) {
      const isFolded = useFolded();
      return h(
        React.Fragment,
        null,
        h("style", { "data-plugin": "sidebar-panel-fold" }, CSS),
        h(
          "span",
          { className: "dspf-glyph", [HEADER_MARK]: "1" },
          h(
            "svg",
            {
              className: "dspf-chevron",
              width: size,
              height: size,
              viewBox: "0 0 16 16",
              "data-folded": isFolded ? "1" : "0",
              "aria-hidden": "true",
            },
            h("path", {
              d: "M4 6.5 8 10.5 12 6.5",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: 1.6,
              strokeLinecap: "round",
              strokeLinejoin: "round",
            }),
          ),
        ),
      );
    }

    /** The header row this plugin renders, or null for any other row. */
    function headerButtonOf(target) {
      if (!(target instanceof Element)) return null;
      const button = target.closest("button");
      if (button === null) return null;
      return button.querySelector("[" + HEADER_MARK + "]") === null
        ? null
        : button;
    }

    return {
      inject: ["slots", "locale"],
      apply(ctx) {
        const t = ctx.locale.bind(NS);

        ctx.effect(
          () => ctx.locale.register(NS, { zh, en }),
          "sidebar-panel-fold: dictionaries",
        );
        ctx.effect(() => {
          applyAttribute(folded);
          return () => document.documentElement.removeAttribute(FOLD_ATTR);
        }, "sidebar-panel-fold: fold attribute");

        /** Take the header click before the row's panel selection runs. */
        ctx.effect(() => {
          const onClick = (event) => {
            if (headerButtonOf(event.target) === null) return;
            event.preventDefault();
            event.stopPropagation();
            setFolded(!folded);
          };
          document.addEventListener("click", onClick, true);
          return () => document.removeEventListener("click", onClick, true);
        }, "sidebar-panel-fold: header click");

        ctx.slots.inject("sidebar.panellist", () =>
          ctx.slots.register(
            {
              name: "sidebar.panellist",
              id: "sidebar-panel-fold",
              order: -1,
              label: () => t("group"),
              locale: NS,
            },
            GroupHeader,
          ),
        );
      },
    };
  },
});
