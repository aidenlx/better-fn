export const insertAfter = (newNode: Node, referenceNode: Node): boolean => {
  if (referenceNode.parentNode)
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  else console.error("fail to insert dom, %o has no parentNode", referenceNode);

  return Boolean(referenceNode.parentNode);
};

export const unwarp = (el: HTMLElement) => {
  // get the element's parent node
  const parent = el.parentNode;

  if (parent) {
    // move all children out of the element
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    // remove the empty element
    parent.removeChild(el);
  }
};
