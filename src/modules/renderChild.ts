import { MarkdownRenderChild } from "obsidian";
import tippy, { Instance, Props, roundArrow } from 'tippy.js';
import { cloneChild } from "./tools";
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/light-border.css';
import 'tippy.js/dist/svg-arrow.css';

const PopoverOption: Partial<Props> = {
  interactive: true,
  theme: "light-border",
  arrow: roundArrow,
  placement: 'bottom',
  delay: [200, null],
  trigger: 'mouseenter click',
  hideOnClick: true,
};

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
  ): PopoverValue;
  createPopover(
    srcId: string,
    srcEl: HTMLElement,
    refEl: HTMLElement
  ): PopoverValue;
  createPopover(
    srcId: string,
    srcEl: HTMLElement,
    indexOrEl: number | HTMLElement
  ): PopoverValue {
    const id = toPopoverId(srcId);
    const popEl = createDiv(undefined, (el) => {
        const filter = (node: ChildNode) =>
          node.nodeName !== "A" ||
          !(node as HTMLAnchorElement).hasClass("footnote-backref");
        cloneChild(srcEl, el, filter);
    });
    this.containerEl.appendChild(popEl);
    const refEl =
      typeof indexOrEl === "number" ? this.fnInfo[indexOrEl].refEl : indexOrEl;
    const instance = tippy(refEl,{
      content: popEl,
      ...PopoverOption
    })

    const out = { instance, element: popEl };
    console.log(out);
    this.popovers.set(id, out);
    return out;
  }

}

export function toPopoverId(srcId: string) {
  return srcId.replace(/^(?:fn|fnref)-/, "pop-");
}