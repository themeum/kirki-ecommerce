import { useEffect, useRef } from 'react';

const MAX_TILT_DEGREES = 12;
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

const useParcelTilt = <T extends HTMLElement>() => {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const element = ref.current;

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const offsetX = clamp((event.clientX - (rect.left + rect.width / 2)) / window.innerWidth);
      const offsetY = clamp((event.clientY - (rect.top + rect.height / 2)) / window.innerHeight);

      element.style.setProperty('--tilt-x', `${(-offsetY * MAX_TILT_DEGREES * 2).toFixed(2)}deg`);
      element.style.setProperty('--tilt-y', `${(offsetX * MAX_TILT_DEGREES * 2).toFixed(2)}deg`);
    };

    const handlePointerLeave = () => {
      ref.current?.style.setProperty('--tilt-x', '0deg');
      ref.current?.style.setProperty('--tilt-y', '0deg');
    };

    window.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
    };
  }, []);

  return ref;
};

export default useParcelTilt;
