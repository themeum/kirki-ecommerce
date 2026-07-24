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
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

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
          {rightText && <span css={styles.rightText}>{rightText}</span>}
        </Flex>
        <div
          ref={barRef}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={label || 'Progress'}
          tabIndex={onChange ? 0 : undefined}
          css={styles.track}
          onMouseDown={handleMouseDown}
        >
          <div
            css={styles.fill}
            style={
              {
                '--progressbar-fill-width': `${progress}%`,
                '--progressbar-fill-color': progressBarColor || undefined,
              } as CSSProperties
            }
          />
          {showProgressIndicator && (
            <div
              css={styles.thumb}
              style={{ '--progressbar-thumb-left': `${progress}%` } as CSSProperties}
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

const styles = {
  track: scoped({
    position: 'relative',
    height: '6px',
    width: '100%',
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.full,
    cursor: 'pointer',
    userSelect: 'none',
  }),
  fill: scoped({
    height: '100%',
    width: 'var(--progressbar-fill-width)',
    backgroundColor: 'var(--progressbar-fill-color, ' +
      theme.colors.background.fillBrand +
      ')',
    borderRadius: 'inherit',
    transition: 'width 0.2s ease',
    zIndex: 1,
  }),
  thumb: scoped({
    position: 'absolute',
    top: '50%',
    left: 'var(--progressbar-thumb-left)',
    transform: 'translate(-50%, -50%)',
    height: '16px',
    width: '16px',
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.hover}`,
    cursor: 'grab',
    zIndex: 9999,
    transition: 'transform 0.2s ease, left 0.2s ease',
    '&:active': {
      cursor: 'grabbing',
      transform: 'translate(-50%, -50%) scale(0.95)',
    },
  }),
  rightText: scoped({
    color: theme.colors.text.muted,
  }),
};
