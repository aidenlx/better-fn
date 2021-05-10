import { MarkdownRenderChild } from "obsidian";
import { createPopper, Instance, Instance as popperInst } from "@popperjs/core";
import { cloneChild } from "./tools";

const PopperOption: Parameters<typeof createPopper>[2] = {
  placement: "top",
};

export type fnInfo = {
  refId: string;
  docId: string;
  sourcePath: string;
  refEl: HTMLElement;
  obj: {
    renderChild: PopperRenderChild;
    popperInst: Instance;
    popperEl: HTMLElement;
  } | null;
};

export class PopperRenderChild extends MarkdownRenderChild {
  instances: popperInst[] = [];
  fnInfo: fnInfo[];

  unload() {
    for (const inst of this.instances) {
      inst.destroy();
    }
  }

  constructor(containerEl: HTMLElement, info: fnInfo[]) {
    super(containerEl);
    this.fnInfo = info;
  }

  /**
   * Create new Popper instance for footnote popover
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   * @param srcEl the element whose children will be used as popover content
   * @param infoIndex index used to fetch reference element from fnInfo
   * @returns Popper.Instance
   */
  createPopover(
    id: string,
    srcEl: HTMLElement,
    infoIndex: number
  ): { inst: Instance; popEl: HTMLElement };
  createPopover(
    id: string,
    srcEl: HTMLElement,
    refEl: HTMLElement
  ): { inst: Instance; popEl: HTMLElement };
  createPopover(
    id: string,
    srcEl: HTMLElement,
    indexOrEl: number | HTMLElement
  ): { inst: Instance; popEl: HTMLElement } {
    const popEl = createDiv(
      {
        cls: "popper",
        attr: { id: id.replace(/^(?:fn|fnref)-/, "tt-"), role: "tooltip" },
      },
      (el) => {
        const filter = (node: ChildNode) =>
          node.nodeName !== "A" ||
          !(node as HTMLAnchorElement).hasClass("footnote-backref");
        cloneChild(srcEl, el, filter);
      }
    );
    this.containerEl.appendChild(popEl);
    const refEl =
      typeof indexOrEl === "number" ? this.fnInfo[indexOrEl].refEl : indexOrEl;
    const popperInstance = createPopper(refEl, popEl, PopperOption);
    setEventHandler(popperInstance, refEl, popEl);
    this.instances.push(popperInstance);
    return { inst: popperInstance, popEl };
  }
}

function setEventHandler(
  popperInstance: popperInst,
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
