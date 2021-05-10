import { post } from 'modules/post';
import { Plugin } from 'obsidian';
import {createPopper} from '@popperjs/core'
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

export default class BetterFn extends Plugin {
  // settings: BetterFnSettings = DEFAULT_SETTINGS;

  fnInfo: {
    refId: string;
    docId: string;
		refEl: HTMLElement;
    pop: ReturnType<typeof createPopper> | null;
  }[] = [];

  async onload() {
    console.log("loading plugin");

    // await this.loadSettings();

    this.registerMarkdownPostProcessor(post.bind(this));
    // this.addSettingTab(new BetterFnSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading plugin");
  }

  // async loadSettings() {
  // 	this.settings = {...this.settings,...(await this.loadData())};
  // }

  // async saveSettings() {
  // 	await this.saveData(this.settings);
  // }
}