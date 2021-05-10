
/** Remove all child nodes of the element from the DOM. */
export function empty(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild);
}

export function insertAfter(newNode: Node, referenceNode: Node): boolean {
  if (referenceNode.parentNode)
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  else console.error("fail to insert dom, %o has no parentNode", referenceNode);

  return Boolean(referenceNode.parentNode);
}


export function cloneChild(
  from: HTMLElement,
  to: HTMLElement,
  filter?: (node:ChildNode) => boolean
) {
  empty(to);
  from.childNodes.forEach((node) => {
    if (!filter || filter(node)) to.appendChild(node);
  });
}