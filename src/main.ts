import { BridgeEl, PopoverHandler } from "modules/post";
import { bridgeInfo } from "modules/renderChild";
import { MarkdownPreviewRenderer, MarkdownView, Plugin, TAbstractFile } from "obsidian";
import "./main.css"
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  /** Update path in bridgeInfo when file is renamed or moved */
  renameAction(file: TAbstractFile, oldPath: string) {
    this.iterateAllInfo((infoList)=>{
      for (const info of infoList) {
        if (info.sourcePath === oldPath) info.sourcePath = file.path;
      }
    })
  };

  layoutChangedTimes = 0;
  checkFreq = 20;
  /** Remove redundant element from fnInfo */
  layoutChangedAction = () => {
    this.layoutChangedTimes++;

    if (this.layoutChangedTimes >= this.checkFreq) {
      this.layoutChangedTimes = 0;

      const paths: string[] = [];
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (leaf.view instanceof MarkdownView)
          paths.push(leaf.view.file.path);
      });

      this.iterateAllInfo((infoList)=>{
        let index = infoList.findIndex(v=>!paths.includes(v.sourcePath));
        while (index!==-1){
          infoList.splice(index,1);
          index = infoList.findIndex(v=>!paths.includes(v.sourcePath));
        }
      })
    }

  }

  iterateAllInfo(callback: (infoList: bridgeInfo[]) => any) {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView){
        const infoList = (
          leaf.view.previewMode.containerEl.querySelector(
            ".markdown-preview-section"
          ) as BridgeEl
        ).infoList;
        if (infoList)
          callback(infoList);
      }
    });
  }

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);
    this.app.vault.on("rename",this.renameAction);  
    this.app.workspace.on("layout-change", this.layoutChangedAction);

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    MarkdownPreviewRenderer.unregisterPostProcessor(this.PopoverHandler);
    this.app.vault.off("rename",this.renameAction);
    this.app.workspace.off("layout-change", this.layoutChangedAction);
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
