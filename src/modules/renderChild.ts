import { MarkdownRenderChild } from "obsidian";
import tippy, { Instance, Props, roundArrow } from "tippy.js";
import { unwarp } from "./tools";
import "tippy.js/dist/tippy.css";
import "tippy.js/themes/light-border.css";
import "tippy.js/dist/svg-arrow.css";
import "tippy.js/animations/shift-toward-subtle.css";
import { BridgeEl } from "processor";

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
  sourcePath: string;
  refEl: HTMLElement;
  renderChild: PopoverRenderChild | null;
};

        
type mutationParam = {
  callback: MutationCallback;
  option: MutationObserverInit;
}

export type PopoverValue = { instance: Instance<Props>; html: string };

export class PopoverRenderChild extends MarkdownRenderChild {
  popovers: Map<
    string, // id: pp-...
    PopoverValue
  >;
  infoList: Exclude<BridgeEl["infoList"], undefined>;

  unload() {
    for (const popper of this.popovers.values()) {
      popper.instance.destroy();
    }
    this.popovers.clear();
  }

  constructor(containerEl: HTMLElement, info: PopoverRenderChild["infoList"]) {
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
  createPopover(srcId: string, srcEl: HTMLElement, infoKey: string): void;
  createPopover(srcId: string, html: string, infoKey: string): void;
  createPopover(srcId: string, srcEl: HTMLElement, refEl: HTMLElement): void;
  createPopover(srcId: string, html: string, refEl: HTMLElement): void;
  createPopover(
    srcId: string,
    srcElOrCode: HTMLElement | string,
    keyOrEl: string | HTMLElement
  ): void {
    const id = toPopoverId(srcId);

    let html: string;
    const srcEl = typeof srcElOrCode !== "string" ? srcElOrCode : null;

    if (srcEl) {
      // unwarp <p>
      const warpped = srcEl.querySelector("p");
      if (warpped) unwarp(warpped);

      html = srcEl.innerHTML;
    } else html = srcElOrCode as string;

    const refEl =
      typeof keyOrEl === "string"
        ? (this.infoList.get(keyOrEl) as bridgeInfo).refEl
        : keyOrEl;

    const instance = tippy(refEl, {
      content: html,
    });

    // Monitor internal embed loadings
    if (typeof srcElOrCode !== "string") {
      const srcEl = srcElOrCode;
      let allInternalEmbeds;
      if ((allInternalEmbeds = srcEl.querySelectorAll("span.internal-embed"))) {
        const markdownEmbed: mutationParam = {
          // observer should keep connected to track updates in embeded content
          callback: () => instance.setContent(srcEl.innerHTML),
          // If the element being observed is removed from the DOM,
          // and then subsequently released by the browser's garbage collection mechanism,
          // the MutationObserver is likewise deleted.
          option: {
            childList: true,
            subtree: true,
          },
        };

        const internalEmbed: mutationParam = {
          callback: (list, obs) => {
            for (const mutation of list) {
              const span = mutation.target as HTMLSpanElement;

              if (span.hasClass("is-loaded")) {
                if (span.firstElementChild?.matches("div.markdown-embed")) {
                  const mdObs = new MutationObserver(markdownEmbed.callback);
                  mdObs.observe(span.firstElementChild, markdownEmbed.option);
                } else instance.setContent(srcEl.innerHTML);
                obs.disconnect();
              }
            }
          },
          option: { attributeFilter: ["class"] },
        };

        for (const span of allInternalEmbeds) {
          const ieObs = new MutationObserver(internalEmbed.callback);
          ieObs.observe(span, internalEmbed.option);
        }
      }
      let allMathEmbeds;
      if ((allMathEmbeds = srcEl.querySelectorAll("span.math"))) {
        const mathEmbed: mutationParam = {
          callback: (list, obs) => {
            for (const mutation of list) {
              const span = mutation.target as HTMLSpanElement;
              if (span.hasClass("is-loaded")) {
                instance.setContent(srcEl.innerHTML);
                obs.disconnect();
              }
            }
          },
          option: { attributeFilter: ["class"] },
        };

        for (const span of allMathEmbeds) {
          const mathObs = new MutationObserver(mathEmbed.callback);
          mathObs.observe(span, mathEmbed.option);
        }
      }
    }

    const out = { instance, html };
    this.popovers.set(id, out);
  }
}

export function toPopoverId(srcId: string) {
  return srcId.replace(/^(?:fn|fnref)-/, "pop-");
}
