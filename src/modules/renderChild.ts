import "tippy.js/dist/tippy.css";
import "./theme.css";
import "tippy.js/animations/shift-toward-subtle.css";

import { infoList } from "processor";
import tippy, { Instance, Props } from "tippy.js";

import { unwarp } from "./tools";

tippy.setDefaultProps({
  interactive: true,
  arrow: true,
  theme: "obsidian",
  placement: "bottom",
  delay: [100, 0],
  trigger: "mouseenter click",
  hideOnClick: true,
  animation: "shift-toward-subtle",
  duration: [200, 150],
  allowHTML: true,
  zIndex:
    +getComputedStyle(document.body)
      .getPropertyValue("--layer-popover")
      .trim() ?? 30,
});

export type bridgeInfo = {
  sourcePath: string;
  refEl: HTMLElement;
  popover: popover | null;
};

type popover = {
  tippy: Instance<Props>;
  html: string;
};

type mutationParam = {
  callback: MutationCallback;
  option: MutationObserverInit;
};
/**
 * Create new Popper instance for footnote popover
 * @param contentEl the element whose children will be used as popover content
 * @param infoIndex index used to fetch reference element from infoList
 * @returns Popper.Instance
 */
export function createPopover(
  infoList: infoList,
  contentEl: HTMLElement,
  infoKey: string,
  showButtom?: boolean,
): popover;
export function createPopover(
  infoList: infoList,
  html: string,
  infoKey: string,
  showButtom?: boolean,
): popover;
export function createPopover(
  infoList: infoList,
  contentEl: HTMLElement,
  refEl: HTMLElement,
  showButtom?: boolean,
): popover;
export function createPopover(
  infoList: infoList,
  html: string,
  refEl: HTMLElement,
  showButtom?: boolean,
): popover;
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function createPopover(
  infoList: infoList,
  elOrHtml: HTMLElement | string,
  keyOrEl: string | HTMLElement,
  showButtom = false,
): popover {
  let html: string;
  const contentEl = typeof elOrHtml !== "string" ? elOrHtml : null;

  if (contentEl) {
    // unwarp <p>
    const warpped = contentEl.querySelector("p");
    if (warpped) unwarp(warpped);

    html = contentEl.innerHTML;
  } else html = elOrHtml as string;

  if (typeof keyOrEl === "string" && !infoList.has(keyOrEl)) {
    console.error("no info for key %s in %o", keyOrEl, infoList);
    throw new TypeError("no info for key");
  }

  const refEl =
    typeof keyOrEl === "string"
      ? (infoList.get(keyOrEl) as bridgeInfo).refEl
      : keyOrEl;
  const key = typeof keyOrEl === "string" ? keyOrEl : keyOrEl.id;

  if (!refEl.parentElement) throw new Error("no parent for refEl");
  const warpper = createSpan();
  refEl.parentElement.insertBefore(warpper, refEl);
  warpper.appendChild(refEl);
  const instance = tippy(refEl, {
    content: html,
    appendTo: warpper,
    onTrigger: (inst, evt) => {
      if (evt.type === "click") {
        const defaultValue = tippy.defaultProps.zIndex;
        inst.popper.style.zIndex = (defaultValue - 1).toString();
      }
    },
  });

  refEl.addEventListener("dblclick", (evt) => {
    const child = refEl.firstElementChild;
    if (child instanceof HTMLAnchorElement && showButtom) {
      child.click();
    }
  });

  // Monitor internal embed loadings
  if (typeof elOrHtml !== "string") {
    const srcEl = elOrHtml;
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

  const info = infoList.get(key) as bridgeInfo;
  if (info.popover) info.popover.tippy.destroy();
  const out = {
    tippy: instance,
    html: html,
  };
  info.popover = out;
  return out;
}
