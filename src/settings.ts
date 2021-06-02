import BetterFn from "main";
import { PluginSettingTab, Setting } from "obsidian";

export interface BetterFnSettings {
  showFnRef: boolean;
  smooth: boolean;
}

export const DEFAULT_SETTINGS: BetterFnSettings = {
  showFnRef: false,
  smooth: true,
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
    new Setting(this.containerEl)
      .setName("Smooth transition")
      .setDesc(
        createFragment((descEl) => {
          descEl
            .createEl("video", {
              attr: {
                src: "https://img.aidenlx.top/uPic/SmoothTransition.mp4",
                width: "80%",
                autoplay: "",
              },
            })
            .onClickEvent(function () {
              (this as HTMLVideoElement).play();
            });
          descEl.createDiv({}, (el) => {
            el.appendText("Allow smooth transition between popovers");
            el.createEl("br");
            el.appendText(
              "Note: if enabled, only one popover can be shown at a time",
            );
          });
        }),
      )
      .addToggle((toggle) => {
        toggle.setValue(this.plugin.settings.smooth);
        toggle.onChange(async (value) => {
          this.plugin.settings.smooth = value;
          this.plugin.getLoopAllLeavesFunc(
            this.plugin.clearInfoList,
            this.plugin.refresh,
          )();
          await this.plugin.saveSettings();
        });
      });
  }
}
