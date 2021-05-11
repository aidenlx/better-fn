import { MarkdownRenderChild } from "obsidian";
import tippy, { Instance, Props, roundArrow } from 'tippy.js';
import { unwarp } from "./tools";
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import 'tippy.js/dist/svg-arrow.css';
import 'tippy.js/animations/shift-toward-subtle.css';

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
});

export type fnInfo = {
  refId: string;
  docId: string;
  sourcePath: string;
  refEl: HTMLElement;
  renderChild: PopoverRenderChild | null;
};

export type PopoverValue = { instance: Instance<Props>; element: HTMLElement }

export class PopoverRenderChild extends MarkdownRenderChild {
  popovers: Map<
    string, // id: pp-...
    PopoverValue
  >;
  fnInfo: fnInfo[];

  unload() {
    for (const popper of this.popovers.values()) {
      popper.instance.destroy();
    }
  }

  constructor(containerEl: HTMLElement, info: fnInfo[]) {
    super(containerEl);
    this.fnInfo = info;
    this.popovers = new Map();
  }

  /**
   * Create new Popper instance for footnote popover
   * @param id id from .footnote/.footnote-ref ("fnref-" or "fn-")
   * @param srcEl the element whose children will be used as popover content
   * @param infoIndex index used to fetch reference element from fnInfo
   * @returns Popper.Instance
   */
  createPopover(
    srcId: string,
    srcEl: HTMLElement,
    infoIndex: number
  ): void;
  createPopover(
    srcId: string,
    srcEl: HTMLElement,
    refEl: HTMLElement
  ): void;
  createPopover(
    srcId: string,
    srcEl: HTMLElement,
    indexOrEl: number | HTMLElement
  ): void {
    const id = toPopoverId(srcId);
    const popEl = createDiv(undefined, (el) => {
      // remove footnote-backref from srcEl
      const filter = srcEl.querySelectorAll("a.footnote-backref");
      filter.forEach((match) => {
        if (match.parentElement) match.parentElement.removeChild(match);
      });

      // unwarp <p>
      const warpped = srcEl.querySelector("p");
      if (warpped)
        unwarp(warpped);
      
      // clone to new <div>
      while (srcEl.firstChild) el.appendChild(srcEl.firstChild);

    });
    
    this.containerEl.appendChild(popEl);
    const refEl =
      typeof indexOrEl === "number" ? this.fnInfo[indexOrEl].refEl : indexOrEl;
    const instance = tippy(refEl,{
      content: popEl
    })

    const out = { instance, element: popEl };
    this.popovers.set(id, out);
  }

}

export function toPopoverId(srcId: string) {
  return srcId.replace(/^(?:fn|fnref)-/, "pop-");
}