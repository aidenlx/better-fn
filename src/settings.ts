import BetterFn from "main";
import { PluginSettingTab, App, Setting } from "obsidian";

export interface BetterFnSettings {}

export const DEFAULT_SETTINGS: BetterFnSettings = {};

export class BetterFnSettingTab extends PluginSettingTab {
  plugin: BetterFn;

  constructor(app: App, plugin: BetterFn) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {}
}
