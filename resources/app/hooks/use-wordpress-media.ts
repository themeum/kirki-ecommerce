const WP_MEDIA_FRAME_ATTRIBUTE = 'data-wp-media-frame';

const WP_MEDIA_FRAME_SELECTOR = `[${WP_MEDIA_FRAME_ATTRIBUTE}]`;

const GUARDED_EVENTS = [
  'pointerdown',
  'mousedown',
  'mouseup',
  'click',
  'touchstart',
  'touchend',
  'focusin',
  'focusout',
  'wheel',
  'touchmove',
];

const openedFrames = new Set<HTMLElement>();

const isWpMediaNode = (node: EventTarget | null) => {
  return (
    node instanceof Element && node.closest(WP_MEDIA_FRAME_SELECTOR) !== null
  );
};

const stopWpMediaEvent = (event: Event) => {
  const relatedTarget = event instanceof FocusEvent ? event.relatedTarget : null;

  if (isWpMediaNode(event.target) || isWpMediaNode(relatedTarget)) {
    event.stopPropagation();
  }
};

const attachEventGuard = () => {
  for (const eventName of GUARDED_EVENTS) {
    document.body.addEventListener(eventName, stopWpMediaEvent);
  }
};

const detachEventGuard = () => {
  for (const eventName of GUARDED_EVENTS) {
    document.body.removeEventListener(eventName, stopWpMediaEvent);
  }
};

const isWpMediaFrameOpen = () => {
  return openedFrames.size > 0;
};

const openWpMediaFrame = (frameElement?: HTMLElement | null) => {
  if (!frameElement || openedFrames.has(frameElement)) {
    return;
  }

  frameElement.setAttribute(WP_MEDIA_FRAME_ATTRIBUTE, '');
  openedFrames.add(frameElement);

  if (openedFrames.size === 1) {
    attachEventGuard();
  }
};

const closeWpMediaFrame = (frameElement?: HTMLElement | null) => {
  if (!frameElement || !openedFrames.delete(frameElement)) {
    return;
  }

  frameElement.removeAttribute(WP_MEDIA_FRAME_ATTRIBUTE);

  if (openedFrames.size === 0) {
    detachEventGuard();
  }
};

const useWordpressMedia = () => {
  return {
    closeWpMediaFrame,
    isWpMediaFrameOpen,
    isWpMediaNode,
    openWpMediaFrame,
  };
};

export default useWordpressMedia;

export { WP_MEDIA_FRAME_ATTRIBUTE, WP_MEDIA_FRAME_SELECTOR };

