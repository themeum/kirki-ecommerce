import { useEffect, useRef } from 'react';

import Toast from '@/components/toast';
import { CLASS_PREFIX } from '@/conf';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeToast } from '@/store/toastSlice';

const ToastController = () => {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.toast?.toasts);
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timersRef.current[toast.id]) {
        return;
      }

      timersRef.current[toast.id] = setTimeout(async () => {
        await toast.onSuccess?.();
        dispatch(removeToast(toast.id));
        delete timersRef.current[toast.id];
      }, toast.duration || 3000);
    });

    Object.keys(timersRef.current).forEach((id) => {
      const stillExists = toasts.some((t) => t.id === id);
      if (!stillExists) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });
  }, [toasts, dispatch]);

  return (
    <div className={`${CLASS_PREFIX}-toast-container`}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          title={toast.title}
          variant={toast.variant as 'default' | 'warning' | 'delete' | 'success' | 'error'}
          duration={toast.duration}
          undoAction={toast.undoAction}
          onUndo={() => {
            toast.undoAction?.();
            dispatch(removeToast(toast.id));
          }}
          onClose={async () => {
            await toast.onSuccess?.();
            dispatch(removeToast(toast.id));
          }}
        />
      ))}
    </div>
  );
};

export default ToastController;
