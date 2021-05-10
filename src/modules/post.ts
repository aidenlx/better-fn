import BetterFn from "main";
import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";
import { createPopper } from "@popperjs/core";
import { cloneChild, empty, insertAfter } from "./tools";

const PopperOption: Parameters<typeof createPopper>[2] = {
  placement: "top",
};

export const post: MarkdownPostProcessor = function (this: BetterFn, el, ctx) {
  const plugin = this;

  type callback = Parameters<NodeListOf<Element>["forEach"]>[0];

  function forEach(selector: string, callback: callback): boolean {
    const result = el.querySelectorAll(selector);
    if (result.length !== 0) result.forEach(callback);
    return result.length !== 0;
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

    const { id: refId, innerText:srcText } = sup;
    const { docId } = ctx;

    empty(sup);
    sup.innerText = srcText;
    sup.setAttr("aria-describedby", refId.replace(/^fnref-/, "tt-"));

    const foundIndex = plugin.fnInfo.findIndex(
      (v) => v.docId === docId && v.refId === refId
    );
    if (foundIndex !== -1) {
      const info = plugin.fnInfo[foundIndex];
      info.refEl = sup;
      const { pop } = info;
      if (pop) {
        const src = pop.state.elements.popper;
        pop.destroy();
        info.pop = createPopover(refId, src, sup);
      } else console.error("refEl %o found in footnotes, pop null", sup);
    } else {
      plugin.fnInfo.push({ refId, docId, refEl: sup, pop: null });
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
    const { docId } = ctx;

    const foundIndex = plugin.fnInfo.findIndex(
      (v) => v.docId === docId && v.refId === fnId.replace(/^fn-/, "fnref-")
    );
    if (foundIndex !== -1) {
      const info = plugin.fnInfo[foundIndex];
      const { refEl, pop } = info;
      if (pop) {
        const popEl = pop.state.elements.popper;
        cloneChild(li, popEl);
      } else {
        info.pop = createPopover(fnId, li, refEl);
      }
    } else
      console.error(
        "Unable to create popover: ref info not found in %o",
        plugin.fnInfo
      );
  }

  if (!forEach("sup.footnote-ref", callbackRef)) {
    if (forEach("section.footnotes li", callbackFn)) el.style.display = "none";
  }
};

/**
 *
 * @param id "fnref-" or "fn-"
 * @param childSrc source of popover content
 * @param refEl popover will be insert after this
 * @returns Popper.Instance
 */
function createPopover(
  id: string,
  childSrc: HTMLElement,
  refEl: HTMLElement
): ReturnType<typeof createPopper> {
  const popEl = createDiv(
    {
      cls: "popper",
      attr: { id: id.replace(/^(?:fn|fnref)-/, "tt-"), role: "tooltip" },
    },
    (el) => {
      const filter = (node: ChildNode) =>
        node.nodeName !== "A" ||
        !(node as HTMLAnchorElement).hasClass("footnote-backref");
      cloneChild(childSrc, el, filter);
    }
  );
  insertAfter(popEl, refEl);
  const popperInstance = createPopper(refEl, popEl, PopperOption);
  setHover(popperInstance, refEl, popEl);
  return popperInstance;
}

function setHover(
  popperInstance: ReturnType<typeof createPopper>,
  refEl: HTMLElement,
  popEl: HTMLElement
) {
  function show() {
    popEl.setAttribute("data-show", "");

    // We need to tell Popper to update the tooltip position
    // after we show the tooltip, otherwise it will be incorrect
    popperInstance.update();
  }

  function hide() {
    popEl.removeAttribute("data-show");
  }

  const showEvents = ["mouseenter", "focus"];
  const hideEvents = ["mouseleave", "blur"];

  showEvents.forEach((event) => {
    refEl.addEventListener(event, show);
  });

  hideEvents.forEach((event) => {
    refEl.addEventListener(event, hide);
  });
}
