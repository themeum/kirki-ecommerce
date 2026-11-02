export const isTinyMceFloatPanelNode = (node: EventTarget | null) => {
  return node instanceof Element && node.closest('.mce-floatpanel') !== null;
};
