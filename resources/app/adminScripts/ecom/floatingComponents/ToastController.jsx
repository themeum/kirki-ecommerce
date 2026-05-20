import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeToast } from "../store/toastSlice";
import Toast from "../components/Toast";
import { CLASS_PREFIX } from "conf";

const ToastController = () => {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toast?.toasts);
  const timersRef = useRef({});

  useEffect(() => {
    toasts.forEach((toast) => {
      if (timersRef.current[toast.id]) return;

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
          variant={toast.variant}
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
