import BetterFn from "main";
import { MarkdownPostProcessor } from "obsidian";
import { empty } from "./tools";
import { bridgeInfo, PopoverRenderChild, PopoverValue, toPopoverId } from "./renderChild";

export interface BridgeEl extends HTMLElement {
  infoList?: bridgeInfo[];
}

// prettier-ignore
export const PopoverHandler: MarkdownPostProcessor = function (
  this: BetterFn, el, ctx
) {
  // @ts-ignore
  const bridge = ctx.containerEl as BridgeEl;
  if (!bridge.infoList) bridge.infoList = [];

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

  /**
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   */
  function findInfoIndex(id: string): number {
    return infoList.findIndex((v) => v.refId === id.replace(/^fn-/, "fnref-"));
  }

  function callbackRef(v: Element) {
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
    empty(sup);
    sup.innerText = srcText;
    sup.setAttr("aria-describedby", refId.replace(/^fnref-/, "pp-"));

    const index = findInfoIndex(refId);
    const id = toPopoverId(refId);

    if (index !== -1) {
      const info = infoList[index];
      const { renderChild } = info;
      info.refEl = sup;

      if (renderChild && renderChild.popovers.has(id)) {
        const popper = renderChild.popovers.get(id) as PopoverValue;
        popper.instance.destroy();
        renderChild.createPopover(refId, popper.element, sup);
      } else console.error("refEl %o found in footnotes, pop null", sup);
    } else {
      infoList.push({
        refId,
        sourcePath,
        refEl: sup,
        renderChild: null,
      });
    }
  }
  function callbackFn(v: Element) {
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
    const li = v as HTMLLIElement;

    const { id: fnId } = li;

    const find = el.querySelector("div.popper-container");

    const container: HTMLElement =
      (find as HTMLElement) ??
      el.appendChild(createDiv({ cls: "popper-container" }));

    const child = new PopoverRenderChild(container, infoList);

    const index = findInfoIndex(fnId);

    if (index !== -1) {
      child.createPopover(fnId, li, index);
      infoList[index].renderChild = child;
    } else
      console.error(
        "Unable to create popover: ref info not found in %o",
        infoList
      );

    ctx.addChild(child);
  }

  if (!forEach("sup.footnote-ref", callbackRef)) {
    if (forEach("section.footnotes li", callbackFn))
      el.firstElementChild?.setAttr("style", "display: none;");
  }
};
