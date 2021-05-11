import { PopoverHandler } from "modules/post";
import { MarkdownPreviewRenderer, Plugin } from "obsidian";
import "./main.css"
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  PopoverHandler = PopoverHandler.bind(this);

  async onload() {
    console.log("loading BetterFn");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(this.PopoverHandler);

    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading BetterFn");

    MarkdownPreviewRenderer.unregisterPostProcessor(this.PopoverHandler);
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}
