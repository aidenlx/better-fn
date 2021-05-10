import { PopoverHandler } from "modules/post";
import { MarkdownPreviewRenderer, MarkdownView, Plugin, TAbstractFile } from "obsidian";
import { createPopper } from "@popperjs/core";
import { fnInfo } from "modules/renderChild";
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  fnInfo: fnInfo[] = [];

  layoutChangedTimes = 0;

  /** Update path in fnInfo when file is renamed or moved */
  renameAction = (file: TAbstractFile, oldPath: string) => {
    for (const info of this.fnInfo) {
      if (info.sourcePath === oldPath) info.sourcePath = file.path;
    }
  };

  checkFreq = 20;
  /** Remove redundant element from fnInfo */
  layoutChangedAction = () => {
    this.layoutChangedTimes++;
    if (this.layoutChangedTimes > this.checkFreq) {
      this.layoutChangedTimes = 0;

      const paths: string[] = [];
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView)
          paths.push(leaf.view.file.path);
      });
      this.fnInfo = this.fnInfo.filter((v) => paths.includes(v.sourcePath));
    }
  }

  PopoverHandler = PopoverHandler.bind(this);

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    // this.app.vault.on("rename",this.renameAction);  
    // this.app.workspace.on("layout-change", this.layoutChangedAction);

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    MarkdownPreviewRenderer.unregisterPostProcessor(this.PopoverHandler);
    // this.app.vault.off("rename",this.renameAction);
    // this.app.workspace.off("layout-change", this.layoutChangedAction);
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
