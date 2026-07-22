import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
} from 'react';

import Flex from '@/components/ui/flex';
import Label from '@/components/ui/label';
import { CLASS_PREFIX } from '@/conf';

type ProgressBarProps = {
  value?: number;
  onChange?: (value: number) => void;
  label?: string;
  rightText?: ReactNode;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
  progressBarColor?: string;
  showProgressIndicator?: boolean;
};

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (props, ref) => {
    const {
      value = 50,
      onChange,
      label = '',
      rightText,
      style = {},
      labelStyle = {},
      progressBarColor = '',
      showProgressIndicator = true,
    } = props;

    const [progress, setProgress] = useState(value);
    const barRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
      setProgress(value);
    }, [value]);

    const updateValueFromEvent = (e: MouseEvent | globalThis.MouseEvent) => {
      if (!barRef.current || !onChange) {
        return;
      }

      const rect = barRef.current.getBoundingClientRect();
      const clientX = e.clientX ?? e.pageX;
      const percent = ((clientX - rect.left) / rect.width) * 100;
      const normalized = Math.min(100, Math.max(0, percent));
      const rounded = Math.round(normalized);
      setProgress(rounded);
      onChange(rounded);
    };

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      updateValueFromEvent(e);
    };

    const handleThumbMouseDown = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      isDragging.current = true;
    };

    useEffect(() => {
      const handleMove = (e: globalThis.MouseEvent) => {
        if (isDragging.current) {
          updateValueFromEvent(e);
        }
      };

      const stopDragging = () => {
        isDragging.current = false;
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', stopDragging);

      return () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', stopDragging);
      };
    }, []);

    return (
      <Flex ref={ref} direction="column" gap={16} style={style}>
        <Flex style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          {label && <Label style={labelStyle}>{label}</Label>}
          {rightText && (
            <span className={`${CLASS_PREFIX}-ui-progressbar-right`}>
              {rightText}
            </span>
          )}
        </Flex>
        <div
          ref={barRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label || 'Progress'}
          tabIndex={onChange ? 0 : undefined}
          className={`${CLASS_PREFIX}-ui-progressbar`}
          onMouseDown={handleMouseDown}
        >
          <div
            className={`${CLASS_PREFIX}-ui-progressbar-fill`}
            style={{
              width: `${progress}%`,
              backgroundColor: progressBarColor || undefined,
            }}
          />
          {showProgressIndicator && (
            <div
              className={`${CLASS_PREFIX}-ui-progressbar-thumb`}
              style={{ left: `${progress}%` }}
              onMouseDown={handleThumbMouseDown}
            />
          )}
        </div>
      </Flex>
    );
  },
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
