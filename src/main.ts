import { BridgeEl, PopoverHandler } from "./processor";
import { MarkdownView, Plugin, TextFileView, View, Workspace } from "obsidian";
import "./main.css";
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

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

  /** Remove redundant element from fnInfo */
  modifyOnUnloadFile: leafAction = (leaf) => {
    if (!isIntact(leaf.view)) return;
    const view = leaf.view;
    const src = leaf.view.onUnloadFile;
    view.onUnloadFile = (file) => {
      // custom code here
      const list = (
        view.previewMode.containerEl.querySelector(
          ".markdown-preview-section"
        ) as BridgeEl
      ).infoList;
      if (list) list.length = 0;

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

  /** refresh opened MarkdownView */
  refresh: leafAction = (leaf) => {
    // placeholder for now
  };

  /** get the function that perform given actions on all leaves */
  getLoopAllLeavesFunc =
    (...actions: leafAction[]) =>
    () => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        for (const action of actions) {
          action(leaf);
        }
      });
    };

  layoutChangeCallback = this.getLoopAllLeavesFunc(this.modifyOnUnloadFile);

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.registerEvent(
      this.app.workspace.on("layout-change", this.layoutChangeCallback)
    );
    this.getLoopAllLeavesFunc(this.modifyOnUnloadFile, this.refresh)();

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    this.getLoopAllLeavesFunc(this.revertOnUnloadFile, this.refresh)();
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
