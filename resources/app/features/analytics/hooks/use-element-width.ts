import { useEffect, useState } from 'react';

const useElementWidth = (fallbackWidth: number) => {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    if (!node || typeof ResizeObserver === 'undefined') {
      return;
    }

    const update = (next: number) => {
      if (next > 0) {
        setWidth(Math.round(next));
      }
    };

    update(node.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => update(entries[0]?.contentRect.width ?? 0));
    observer.observe(node);

    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, width };
};

export default useElementWidth;
