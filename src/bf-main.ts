import "./main.css";

import { around } from "monkey-around";
import {
  Editor,
  editorEditorField,
  editorInfoField,
  HoverPopover,
  Keymap,
  MarkdownRenderer,
  MarkdownView,
  Plugin,
  View,
  Workspace,
} from "obsidian";
import { BetterFnSettingTab, DEFAULT_SETTINGS } from "settings";

import { BridgeEl, PopoverHandler } from "./processor";
import { EditorView } from "@codemirror/view";

type leafAction = Parameters<Workspace["iterateAllLeaves"]>[0];

type MarkdownViewModified = MarkdownView & {
  onUnloadFile_revert?: ReturnType<typeof around>;
};

/** check if given view's onload is intact */
const isIntact = (view: View): view is MarkdownView =>
  view instanceof MarkdownView &&
  (view as MarkdownViewModified).onUnloadFile_revert === undefined;
export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  settings = DEFAULT_SETTINGS;

  /** Remove redundant element from fnInfo */
  modifyOnUnloadFile: leafAction = (leaf) => {
    if (!isIntact(leaf.view)) return;
    const view = leaf.view;
    const revert = around(leaf.view, {
      // eslint-disable-next-line prefer-arrow/prefer-arrow-functions
      onUnloadFile(next) {
        return function (this: any, ...args) {
          const bridgeEl = view.previewMode.containerEl.querySelector(
            ".markdown-preview-section",
          ) as BridgeEl;
          const { infoList, singleton } = bridgeEl;
          if (infoList) {
            infoList.forEach((info) => info.popover?.tippy.destroy());
            infoList.clear();
          }
          if (singleton) {
            singleton.destroy();
            bridgeEl.singleton = null;
          }
          return next.apply(this, args);
        };
      },
    });
    const mod = leaf.view as MarkdownViewModified;
    mod.onUnloadFile_revert = revert;
    this.register(() => {
      revert();
      mod.onUnloadFile_revert = undefined;
    });
  };

  clearInfoList: leafAction = (leaf) => {
    if (leaf.view instanceof MarkdownView) {
      const bridgeEl = leaf.view.previewMode.containerEl.querySelector(
        ".markdown-preview-section",
      ) as BridgeEl;
      const { infoList, singleton } = bridgeEl;
      if (infoList) {
        infoList.forEach((info) => info.popover?.tippy.destroy());
        bridgeEl.infoList = undefined;
      }
      if (singleton) {
        singleton.destroy();
        bridgeEl.singleton = undefined;
      }
    }
  };

  /** refresh opened MarkdownView */
  refresh: leafAction = (leaf) => {
    setTimeout(() => {
      if (leaf.view instanceof MarkdownView) {
        leaf.view.previewMode.rerender(true);
      }
    }, 200);
  };

  /** get the function that perform given actions on all leaves */
  getLoopAllLeavesFunc =
    (...actions: leafAction[]) =>
    () =>
      actions.forEach((action) => this.app.workspace.iterateAllLeaves(action));

  layoutChangeCallback = this.getLoopAllLeavesFunc(this.modifyOnUnloadFile);

  private extractFootnoteContent(content: string, mark: string): string {
    const targetFootnote = `[${mark}]:`;
    const start = content.indexOf(targetFootnote);

    if (start === -1) {
      return "";
    }

    const footnoteRegex = /^\[[^\]]+\]:/gm;
    footnoteRegex.lastIndex = start + targetFootnote.length;

    const match = footnoteRegex.exec(content);
    const end = match ? match.index : content.length;

    let footnoteContent = content.substring(start + targetFootnote.length, end);

    return footnoteContent
      .split("\n")
      .map((line) => line.trim())
      .join("\n");
  }

  initLivePreviewExtension = () => {
    this.registerEditorExtension(
      EditorView.domEventHandlers({
        mouseover: (e: MouseEvent, editorView: EditorView) => {
          if (Keymap.isModifier(e, "Mod")) {
            if (!(e.target as HTMLElement).hasClass("cm-footref")) return;

            const field = editorView.state.field(editorInfoField);
            const editor: Editor = (field as any).editMode?.editor;

            const pos = editorView.posAtDOM(e.target as Node);
            const editorPos = editor.offsetToPos(pos);
            const editorLine = editor.getLine(editorPos.line);
            const startMarkIndex = editorLine.lastIndexOf("[", editorPos.ch);
            const endMarkIndex = editorLine.indexOf("]", editorPos.ch);
            const mark = editorLine.substring(startMarkIndex + 1, endMarkIndex);

            const content = editorView.state.doc.toString();
            const footnoteContent = this.extractFootnoteContent(content, mark);

            const hoverPopover = new HoverPopover(
              <any>editorView,
              <HTMLElement>e.target,
              100,
            );

            hoverPopover.hoverEl.toggleClass("bn-hover-popover", true);
            MarkdownRenderer.render(
              field.app,
              footnoteContent,
              hoverPopover.hoverEl,
              <string>field?.file?.path,
              hoverPopover,
            );

            const embeds =
              hoverPopover.hoverEl?.querySelectorAll(".internal-link");
            embeds?.forEach((embed) => {
              const el = embed as HTMLAnchorElement;
              const href = el.getAttribute("data-href");
              if (!href) return;

              const destination = field.app.metadataCache.getFirstLinkpathDest(
                href,
                <string>field?.file?.path,
              );
              if (!destination) embed.classList.add("is-unresolved");

              this.registerDomEvent(el, "mouseover", (e) => {
                e.stopPropagation();
                field.app.workspace.trigger("hover-link", {
                  event: e,
                  source: "markdown",
                  hoverParent: hoverPopover.hoverEl,
                  targetEl: el,
                  linktext: href,
                  sourcePath: el.href,
                });
              });
            });
          }
        },
      }),
    );
  };

  async onload() {
    console.log("loading BetterFn");

    await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.registerEvent(
      this.app.workspace.on("layout-change", this.layoutChangeCallback),
    );
    this.initLivePreviewExtension();
    this.getLoopAllLeavesFunc(this.modifyOnUnloadFile, this.refresh)();

    this.addSettingTab(new BetterFnSettingTab(this));
  }

  onunload() {
    console.log("unloading BetterFn");

    this.getLoopAllLeavesFunc(this.clearInfoList, this.refresh)();
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
