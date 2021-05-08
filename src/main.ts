import { Plugin } from 'obsidian';
// import { BetterFnSettings, DEFAULT_SETTINGS, BetterFnSettingTab } from 'settings';

export default class BetterFn extends Plugin {
	// settings: BetterFnSettings = DEFAULT_SETTINGS;

	async onload() {
		console.log('loading plugin');

		// await this.loadSettings();

		// this.addSettingTab(new BetterFnSettingTab(this.app, this));

	}

	onunload() {
		console.log('unloading plugin');
	}

	// async loadSettings() {
	// 	this.settings = {...this.settings,...(await this.loadData())};
	// }

	// async saveSettings() {
	// 	await this.saveData(this.settings);
	// }
}