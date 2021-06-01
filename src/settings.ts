import BetterFn from "main";
import { PluginSettingTab, Setting } from "obsidian";

export interface BetterFnSettings {
  showFnRef: boolean;
}

export const DEFAULT_SETTINGS: BetterFnSettings = {
  showFnRef: false,
};

export class BetterFnSettingTab extends PluginSettingTab {
  plugin: BetterFn;

  constructor(plugin: BetterFn) {
    super(plugin.app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    new Setting(this.containerEl)
      .setName("Show reference")
      .setDesc("Show reference section at the buttom of document")
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.showFnRef);
        toggle.onChange(async (value) => {
          this.plugin.settings.showFnRef = value;
          this.plugin.getLoopAllLeavesFunc(this.plugin.refresh)();
          await this.plugin.saveSettings();
        });
      });
  }
}
