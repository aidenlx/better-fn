import BetterFn from "main";
import { MarkdownPostProcessor } from "obsidian";
import { empty } from "./tools";
import { fnInfo, PopperRenderChild } from "./renderChild";



// prettier-ignore
export const PopoverHandler: MarkdownPostProcessor = function (
  this: BetterFn, el, ctx
) {
  const plugin = this;

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
   * Performs the specified action for object that matches id
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   * @param ifFound action when object is found
   * @param notFound action when no match is found
   */
  function findFnInfo(
    id: string,
    ifFound?: (found: BetterFn["fnInfo"][0]) => void,
    notFound?: () => void
  ) {
    const foundIndex = plugin.fnInfo.findIndex(
      (v) =>
        v.docId === ctx.docId &&
        v.sourcePath === ctx.sourcePath &&
        v.refId === id.replace(/^fn-/, "fnref-")
    );
    if (foundIndex !== -1 && ifFound) ifFound(plugin.fnInfo[foundIndex]);
    else if (notFound) notFound();
  }

  /**
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   */
  function findFnInfoIndex(id: string): number {
    return plugin.fnInfo.findIndex(
      (v) =>
        v.docId === ctx.docId &&
        v.sourcePath === ctx.sourcePath &&
        v.refId === id.replace(/^fn-/, "fnref-")
    );
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
    const { docId, sourcePath } = ctx;

    empty(sup);
    sup.innerText = srcText;
    sup.setAttr("aria-describedby", refId.replace(/^fnref-/, "tt-"));

    const index = findFnInfoIndex(refId);
    let newObj : fnInfo["obj"] = null;

    if (index!==-1) {
      const info = plugin.fnInfo[index];
      info.refEl = sup;
      if (info.obj) {
        const { obj } = info;
        obj.popperInst.destroy();
        const {inst} = obj.renderChild.createPopover(refId, obj.popperEl, sup);
        obj.popperInst = inst
      } else console.error("refEl %o found in footnotes, pop null", sup);
    } else {
      plugin.fnInfo.push({ refId, docId, sourcePath, refEl: sup, obj: null })
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

    const child = new PopperRenderChild(
      el.appendChild(createDiv({ cls: "popper-container" })),
      plugin.fnInfo
    );

    const index = findFnInfoIndex(fnId);

    if (index!==-1){

      const { inst, popEl } = child.createPopover(fnId,li,index);
      
      plugin.fnInfo[index].obj = {
        popperInst: inst,
        popperEl: popEl,
        renderChild: child,
      };
      
    } else {
      console.error(
        "Unable to create popover: ref info not found in %o",
        plugin.fnInfo
      )
    }

    ctx.addChild(child);
  }

  if (!forEach("sup.footnote-ref", callbackRef)) {
    if (forEach("section.footnotes li", callbackFn))
      el.firstElementChild?.setAttr("style", "display: none;");
  }
};