import { BridgeEl, PopoverHandler } from "modules/post";
import { bridgeInfo } from "modules/renderChild";
import {
  MarkdownPreviewRenderer,
  MarkdownView,
  Plugin,
  TAbstractFile,
  TextFileView,
} from "obsidian";
import "./main.css";
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

type onLoadFileModified = TextFileView["onLoadFile"] & {
  modified?: boolean;
};
export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  onLoadFileBak?: TextFileView["onLoadFile"];

  /** Remove redundant element from fnInfo */
  modifyOnLoadFile = () => {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (
        leaf.view instanceof MarkdownView &&
        !(leaf.view.onLoadFile as onLoadFileModified).modified
      ) {
        const view = leaf.view;
        const src = leaf.view.onLoadFile;
        if (!this.onLoadFileBak) this.onLoadFileBak = src;
        view.onLoadFile = (file) => {
          // custom code here
          (
            view.previewMode.containerEl.querySelector(
              ".markdown-preview-section"
            ) as BridgeEl
          ).infoList = undefined;

          return src.bind(view)(file);
        };
        (view.onLoadFile as onLoadFileModified).modified = true;
      }
    });
  };

  revertOnLoadFile = () => {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        if (
          (leaf.view.onLoadFile as onLoadFileModified).modified &&
          this.onLoadFileBak
        )
          leaf.view.onLoadFile = this.onLoadFileBak.bind(leaf.view);
      }
    });
  }

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.modifyOnLoadFile();
    this.app.workspace.on("layout-change", this.modifyOnLoadFile);

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    MarkdownPreviewRenderer.unregisterPostProcessor(this.PopoverHandler);
    this.app.workspace.off("layout-change", this.modifyOnLoadFile);
    this.revertOnLoadFile();
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
