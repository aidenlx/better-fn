import "./main.css";

import { MarkdownView, Plugin, TextFileView, View, Workspace } from "obsidian";
import { BetterFnSettingTab, DEFAULT_SETTINGS } from "settings";

import { BridgeEl, PopoverHandler } from "./processor";

type leafAction = Parameters<Workspace["iterateAllLeaves"]>[0];

type MarkdownViewModified = MarkdownView & {
  onUnloadFile: onUnloadFileModified;
};

type onUnloadFileModified = TextFileView["onUnloadFile"] & {
  bak: TextFileView["onUnloadFile"];
};

/** check if given view's onload is intact */
const isIntact = (view: View): view is MarkdownView =>
  view instanceof MarkdownView &&
  (view as MarkdownViewModified).onUnloadFile.bak === undefined;
const isModified = (view: View): view is MarkdownViewModified =>
  view instanceof MarkdownView &&
  (view as MarkdownViewModified).onUnloadFile.bak !== undefined;
export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  settings = DEFAULT_SETTINGS;

  /** Remove redundant element from fnInfo */
  modifyOnUnloadFile: leafAction = (leaf) => {
    if (!isIntact(leaf.view)) return;
    const view = leaf.view;
    const src = leaf.view.onUnloadFile;
    view.onUnloadFile = (file) => {
      // custom code here
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
      return src.call(view, file);
    };
    (leaf.view as MarkdownViewModified).onUnloadFile.bak = src;
  };

  revertOnUnloadFile: leafAction = (leaf) => {
    if (isModified(leaf.view)) {
      (leaf.view as MarkdownView).onUnloadFile =
        leaf.view.onUnloadFile.bak.bind(leaf.view);
    }
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

    this.getLoopAllLeavesFunc(
      this.revertOnUnloadFile,
      this.clearInfoList,
      this.refresh,
    )();
  }

  async loadSettings() {
    this.settings = { ...this.settings, ...(await this.loadData()) };
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
