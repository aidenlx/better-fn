import BetterFn from "main";
import { MarkdownPostProcessor, MarkdownPostProcessorContext } from "obsidian";
import {createPopper} from '@popperjs/core'

const PopperOption: Parameters<typeof createPopper>[2] = {
  placement: "top",
};

function insertAfter(newNode:Node, referenceNode:Node) {
  if (referenceNode.parentNode)
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  else
    console.error("%o has no parentNode", referenceNode);
}

function cloneChild(from:HTMLElement,to:HTMLElement) {
  while (to.firstChild) to.removeChild(to.firstChild);
  from.childNodes.forEach((node) => {
    //filter backref
    if (
      node.nodeName !== "A" ||
      !(node as HTMLAnchorElement).hasClass("footnote-backref")
    )
      to.appendChild(node);
  }); 
}

export const post: MarkdownPostProcessor = function (this: BetterFn, el, ctx) {

  const plugin = this;

  type callback = Parameters<NodeListOf<Element>["forEach"]>[0];

  function forEach(selector: string, callback: callback): boolean {
    const result = el.querySelectorAll(selector);
    if (result.length !== 0) result.forEach(callback);
    return result.length !== 0;
  }

  function fnRef(v: Element) {
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

    const { id: refId, innerText } = sup;
    const { docId } = ctx;

    // empty sup
    while (sup.firstChild) sup.removeChild(sup.firstChild);
    sup.innerText = innerText;
    sup.setAttr("aria-describedby", refId.replace(/^fnref-/, "tt-"));

    let foundIndex = plugin.footnotes.findIndex((v) => v.docId === docId && v.refId === refId);
    if (foundIndex !== -1) {
      plugin.footnotes[foundIndex].refEl = sup;
      let { pop } = plugin.footnotes[foundIndex]
      if (pop){
        const src = pop.state.elements.popper;
        const popEl = createDiv(
          {
            cls: "popper",
            attr: { id: refId.replace(/^fnref-/, "tt-"), role: "tooltip" },
          },
          (el) => cloneChild(src, el)
        );
        insertAfter(popEl,sup);
        let popperInstance = createPopper(
          sup,
          popEl,
          PopperOption
        );
        setHover(popperInstance, sup, popEl);
        pop.destroy();
        plugin.footnotes[foundIndex].pop = popperInstance;
      } else console.error("refEl %o found in footnotes, pop null",sup)
    } else {
      plugin.footnotes.push({ refId, docId, refEl: sup, pop: null });
    }

  }
  const success = forEach("sup.footnote-ref",fnRef);

  function footnote(v: Element) {
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

    const refObjIndex = plugin.footnotes.findIndex(
      (v) => v.docId === docId && v.refId === fnId.replace(/^fn-/, "fnref-")
    );

    const { refEl, pop } = plugin.footnotes[refObjIndex];
    
    if (pop){
      cloneChild(li,pop.state.elements.popper);
    } else {
      const popEl = createDiv(
        {
          cls: "popper",
          attr: { id: fnId.replace(/^fn-/, "tt-"), role: "tooltip" },
        },
        (el) => cloneChild(li, el)
      );
      insertAfter(popEl,refEl)
      let popperInstance = createPopper(refEl, popEl,PopperOption);

      setHover(popperInstance, refEl, popEl);

      plugin.footnotes[refObjIndex].pop = popperInstance;

    }

  }

  if (!success) {
    if (forEach("section.footnotes li", footnote))
      el.style.display = 'none';
  }

  console.log(plugin.footnotes)

};


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
// 1. 完整
// 2. 仅ref所在行更新(fn无变化，行内容更新) - 集中存储refs，根据ctx.docId区分，!popper有lifecycle
// 3. 仅section.fn更新(fn内容更新) - 隐藏该部分，找refs中对应，更新el/popper
