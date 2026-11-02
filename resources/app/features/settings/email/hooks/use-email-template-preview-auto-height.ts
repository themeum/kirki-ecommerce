import type { RefObject } from 'react';
import { useEffect } from 'react';

export const useEmailTemplatePreviewAutoHeight = (
  iframeRef: RefObject<HTMLIFrameElement | null>,
  isReady: boolean,
) => {
  useEffect(() => {
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!isReady || !iframe || !doc?.documentElement) {
      return;
    }

    const resize = () => {
      iframe.style.height = '0px';
      iframe.style.height = `${doc.documentElement.scrollHeight}px`;
    };

    resize();

    const observer = new ResizeObserver(resize);
    observer.observe(doc.documentElement);

    return () => observer.disconnect();
  }, [isReady, iframeRef]);
};
