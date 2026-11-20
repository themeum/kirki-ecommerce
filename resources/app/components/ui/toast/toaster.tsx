import { type CSSProperties, useEffect, useRef } from 'react';
import { Toaster as SonnerToaster } from 'sonner';

import { toastPauseStore } from '@/components/ui/toast/toast-pause-store';
import { defineStyles, scoped } from '@/theme/mixins';

const TOASTER_STYLE = { '--width': '330px' } as CSSProperties;

const Toaster = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerOver = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        return;
      }

      const root = rootRef.current;
      const target = event.target instanceof Node ? event.target : null;

      toastPauseStore.setPaused(Boolean(root && target && root.contains(target)));
    };

    const handlePointerOut = (event: PointerEvent) => {
      if (event.relatedTarget !== null) {
        return;
      }

      toastPauseStore.setPaused(false);
    };

    document.addEventListener('pointerover', handlePointerOver);
    document.addEventListener('pointerout', handlePointerOut);

    return () => {
      document.removeEventListener('pointerover', handlePointerOver);
      document.removeEventListener('pointerout', handlePointerOut);
      toastPauseStore.setPaused(false);
    };
  }, []);

  return (
    <div ref={rootRef} data-toaster-root="" css={scoped(styles.root)}>
      <SonnerToaster
        position="bottom-right"
        toastOptions={{ unstyled: true }}
        style={TOASTER_STYLE}
      />
    </div>
  );
};

Toaster.displayName = 'Toaster';

export default Toaster;

const styles = defineStyles({
  root: {
    display: 'contents',
  },
});
