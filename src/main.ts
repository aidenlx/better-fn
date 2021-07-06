import "./main.css";

import { around } from "monkey-around";
import { MarkdownView, Plugin, View, Workspace } from "obsidian";
import { BetterFnSettingTab, DEFAULT_SETTINGS } from "settings";

import { BridgeEl, PopoverHandler } from "./processor";

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

  async onload() {
    console.log("loading BetterFn");

    await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.registerEvent(
      this.app.workspace.on("layout-change", this.layoutChangeCallback),
    );
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
