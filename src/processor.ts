import BetterFn from "main";
import { MarkdownPostProcessor } from "obsidian";
import {
  bridgeInfo, createPopover
} from "modules/renderChild";

export interface BridgeEl extends HTMLElement {
  infoList?: infoList;
}

/** key: fnref-1-(1-)-asjfaskdlfa */
export type infoList = Map<string, bridgeInfo>;

/**
 * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
 */
export function findInfoKeys(id: string, from: infoList): string[] | null {
  if (from.has(id)) return [id];
  else {
    const keys = [...from.keys()];
    const match = keys.filter(
      (key) =>
        key.replace(/(?<=^fnref-\d+?-)\d+?-/, "") ===
        id.replace(/^fn-/, "fnref-")
    );
    if (match.length) return match;
    else return null;
  }
}

// prettier-ignore
export const PopoverHandler: MarkdownPostProcessor = function (
  this: BetterFn, el, ctx
) {
  // @ts-ignore
  const bridge = ctx.containerEl as BridgeEl;
  if (!bridge.infoList) bridge.infoList = new Map();

  const { infoList } = bridge;

  type callback = Parameters<NodeListOf<Element>["forEach"]>[0];

  /**
   * Performs the specified action for each node that matches given selector in current element.
   * @param selector Used to match element descendants of node
   * @param callback A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the list.
   * @returns whether selector has any match
   */
  function forEach(selector: string, callback: callback): boolean {
    const result = el.querySelectorAll(selector);
    if (result.length !== 0) result.forEach(callback);
    return result.length !== 0;
  }

  const callbackRef = (v: Element) => {
    // <sup
    //   data-footnote-id="fnref-1-aa7e756d44d79c16"
    //   class="footnote-ref"
    //   id="fnref-1-aa7e756d44d79c16"
    //   ><a
    //     href="#fn-1-aa7e756d44d79c16"
    //     class="footnote-link"
    //     target="_blank"
    //     rel="noopener"
    //     >[1]</a
    //   ></sup
    // >
    const sup = v as HTMLElement;

    const { id: refId, innerText: srcText } = sup;
    const { sourcePath } = ctx;
    sup.empty();
    sup.innerText = srcText;
    sup.setAttr("aria-describedby", refId.replace(/^fnref-/, "pp-"));

    if (infoList.has(refId)) {
      // if rendered before (only rerender changed paragraph)
      const info = infoList.get(refId) as bridgeInfo;
      const { popover } = info;
      info.refEl = sup;
      if (!popover) {
        console.error("refEl %o found in %o, pop null", sup, infoList);
        return;
      }
      const { html } = popover;
      createPopover(infoList, html, sup);
    } else {
      // if never render (full render)
      infoList.set(refId, {
        sourcePath,
        refEl: sup,
        popover: null,
      });
    }
  }

  const refProcess = forEach("sup.footnote-ref", callbackRef);
  if (refProcess) return;

  // <li
  //   data-line="0"
  //   data-footnote-id="fn-1-aa7e756d44d79c16"
  //   id="fn-1-aa7e756d44d79c16"
  // >
  //   content
  //   <a
  //     href="#fnref-1-aa7e756d44d79c16"
  //     class="footnote-backref footnote-link"
  //     target="_blank"
  //     rel="noopener"
  //     >↩︎</a
  //   >
  // </li>
  if (
    el.children.length === 1 &&
    el.firstElementChild?.matches("section.footnotes")
  ) {
    const section = el.firstElementChild;
    for (const v of section.querySelectorAll("li")) {
      const li = v as HTMLLIElement;
      const { id: fnId } = li;
      const keys = findInfoKeys(fnId, infoList);
  
      if (keys) {
        for (const k of keys) {
          createPopover(infoList, li, k);
        }
      } else
        console.error(
          "Unable to create popover: ref info not found in %o",
          infoList
        );
    }
    // NOTE: using "display:none" or hidden will block markdown-preview-pusher
    if (!this.settings.showFnRef) section.addClass("visuallyhidden");
  }
};
