import { BridgeEl, PopoverHandler } from "./processor";
import {
  MarkdownPreviewRenderer,
  MarkdownView,
  Plugin,
  TextFileView,
  Workspace,
  WorkspaceLeaf,
} from "obsidian";
import "./main.css";
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

type leafAction = Parameters<Workspace["iterateAllLeaves"]>[0];

type onUnloadFileModified = TextFileView["onUnloadFile"] & {
  modified?: boolean;
};
export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  onUnloadFileBak?: TextFileView["onUnloadFile"];

  /** Remove redundant element from fnInfo */
  modifyOnUnloadFile: leafAction = (leaf) => {
    if (
      leaf.view instanceof MarkdownView &&
      !(leaf.view.onUnloadFile as onUnloadFileModified).modified
    ) {
      const view = leaf.view;
      const src = leaf.view.onUnloadFile;
      if (!this.onUnloadFileBak) this.onUnloadFileBak = src;
      view.onUnloadFile = (file) => {
        // custom code here
        const list = (
          view.previewMode.containerEl.querySelector(
            ".markdown-preview-section"
          ) as BridgeEl
        ).infoList;
        if (list) list.length = 0;

        return src.bind(view)(file);
      };
      (view.onUnloadFile as onUnloadFileModified).modified = true;
    }
  };

  revertOnUnloadFile: leafAction = (leaf) => {
    if (leaf.view instanceof MarkdownView) {
      if (
        (leaf.view.onUnloadFile as onUnloadFileModified).modified &&
        this.onUnloadFileBak
      )
        leaf.view.onUnloadFile = this.onUnloadFileBak.bind(leaf.view);
    }
  };

  /** refresh opened MarkdownView */
  refresh: leafAction = (leaf) => {
    // placeholder for now
  };

  /** get function to perform certain actions on all leaves */
  doAllLeaves =
    (...actions: leafAction[]) =>
    () => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        for (const action of actions) {
          action(leaf);
        }
      });
    };
  
  layoutChangeCallback = this.doAllLeaves(this.modifyOnUnloadFile);

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.registerEvent(
      this.app.workspace.on("layout-change", this.layoutChangeCallback)
    );
    this.doAllLeaves(this.modifyOnUnloadFile, this.refresh)();

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    MarkdownPreviewRenderer.unregisterPostProcessor(this.PopoverHandler);
    this.doAllLeaves(this.revertOnUnloadFile, this.refresh)();
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
