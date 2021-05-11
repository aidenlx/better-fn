import { MarkdownRenderChild } from "obsidian";
import tippy, { Instance, Props, roundArrow } from "tippy.js";
import { unwarp } from "./tools";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light-border.css";
import "tippy.js/dist/svg-arrow.css";
import "tippy.js/animations/shift-toward-subtle.css";

tippy.setDefaultProps({
  interactive: true,
  theme: "light-border",
  arrow: roundArrow,
  placement: "bottom",
  delay: [100, 0],
  trigger: "mouseenter click",
  hideOnClick: true,
  animation: "shift-toward-subtle",
  duration: [200, 150],
  allowHTML: true,
});

export type bridgeInfo = {
  refId: string;
  sourcePath: string;
  refEl: HTMLElement;
  renderChild: PopoverRenderChild | null;
};

export type PopoverValue = { instance: Instance<Props>; html: string };

export class PopoverRenderChild extends MarkdownRenderChild {
  popovers: Map<
    string, // id: pp-...
    PopoverValue
  >;
  infoList: bridgeInfo[];

  unload() {
    for (const popper of this.popovers.values()) {
      popper.instance.destroy();
    }
  }

  constructor(containerEl: HTMLElement, info: bridgeInfo[]) {
    super(containerEl);
    this.infoList = info;
    this.popovers = new Map();
  }

  /**
   * Create new Popper instance for footnote popover
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   * @param srcEl the element whose children will be used as popover content
   * @param infoIndex index used to fetch reference element from infoList
   * @returns Popper.Instance
   */
  createPopover(srcId: string, srcEl: HTMLElement, infoIndex: number): void;
  createPopover(srcId: string, srcEl: HTMLElement, refEl: HTMLElement): void;
  createPopover(srcId: string, html: string, infoIndex: number): void;
  createPopover(srcId: string, html: string, refEl: HTMLElement): void;
  createPopover(
    srcId: string,
    srcElOrCode: HTMLElement | string,
    indexOrEl: number | HTMLElement
  ): void {
    const id = toPopoverId(srcId);

    let html: string;
    const srcEl = typeof srcElOrCode !== "string" ? srcElOrCode : null;

    if (srcEl) {
      // remove footnote-backref from srcEl
      for (const match of srcEl.querySelectorAll("a.footnote-backref")) {
        if (match.parentElement) match.parentElement.removeChild(match);
      }
      // unwarp <p>
      const warpped = srcEl.querySelector("p");
      if (warpped) unwarp(warpped);

      html = srcEl.innerHTML;
    } else html = srcElOrCode as string;

    const refEl =
      typeof indexOrEl === "number"
        ? this.infoList[indexOrEl].refEl
        : indexOrEl;
    
    const instance = tippy(refEl, {
      content: html,
    });

    if (typeof srcElOrCode !== "string") {
      const srcEl = srcElOrCode;
      if (srcEl.querySelector("span.internal-embed")){
        const internalEmbedObs = new MutationObserver(() =>
          instance.setContent(srcEl.innerHTML)
        );
        internalEmbedObs.observe(srcEl, { childList: true, subtree: true });
        setTimeout(() => {
          internalEmbedObs.disconnect();
        }, 800);
      }
    } 

    const out = { instance, html };
    this.popovers.set(id, out);
  }
}

export function toPopoverId(srcId: string) {
  return srcId.replace(/^(?:fn|fnref)-/, "pop-");
}