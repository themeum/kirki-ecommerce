import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

import { theme } from '@/theme';
import { scoped, scopedMerge, defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ShippingBoxPreviewProps = {
  length: number;
  height: number;
  width: number;
  unit: string;
};

type FaceLabelProps = {
  fullLabel: string;
  shortLabel: string;
  faceWidth: number;
  faceHeight: number;
};

const MIN_FULL_LABEL_SIZE = 9;
const MAX_LABEL_SIZE = 14;
const MIN_LABEL_SIZE = 8;

const FaceLabel = ({
  fullLabel,
  shortLabel,
  faceWidth,
  faceHeight,
}: FaceLabelProps) => {
  const computedSize = Math.min(faceWidth, faceHeight) * 0.25;
  const fontSize = Math.max(
    MIN_LABEL_SIZE,
    Math.min(MAX_LABEL_SIZE, computedSize),
  );
  const useAbbreviation = computedSize < MIN_FULL_LABEL_SIZE;

  return (
    <span
      css={scoped(styles.faceLabel)}
      style={{ fontSize: `${fontSize}px` }}
    >
      {useAbbreviation ? shortLabel : fullLabel}
    </span>
  );
};

FaceLabel.displayName = 'FaceLabel';

const ShippingBoxPreview = ({
  length,
  height,
  width,
  unit,
}: ShippingBoxPreviewProps) => {
  const UNIT_TO_VISUAL: Record<string, number> = { cm: 1, in: 2.54 };
  const PREVIEW = { width: 220, height: 140, depth: 220 };
  const PADDING = 0.9;
  const DRAG_SENSITIVITY = 0.5;

  const [rotation, setRotation] = useState({ x: -20, y: 30 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const toVisual = (value: number) => value * (UNIT_TO_VISUAL[unit] ?? 1);

  const safeLength = Math.max(Number(length) || 0, 0.01);
  const safeWidth = Math.max(Number(width) || 0, 0.01);
  const safeHeight = Math.max(Number(height) || 0, 0.01);

  const lengthV = toVisual(safeLength);
  const widthV = toVisual(safeWidth);
  const heightV = toVisual(safeHeight);

  const scaleX = PREVIEW.width / widthV;
  const scaleY = PREVIEW.height / heightV;
  const scaleZ = PREVIEW.depth / lengthV;

  const scale = Math.min(scaleX, scaleY, scaleZ) * PADDING;

  const widthF = widthV * scale;
  const heightF = heightV * scale;
  const lengthF = lengthV * scale;

  const widthLabel = __('Width', 'kirki-ecommerce');
  const lengthLabel = __('Length', 'kirki-ecommerce');
  const heightLabel = __('Height', 'kirki-ecommerce');

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: rotation.x,
      originY: rotation.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragRef.current.startX;
    const deltaY = event.clientY - dragRef.current.startY;

    setRotation({
      x: dragRef.current.originX - deltaY * DRAG_SENSITIVITY,
      y: dragRef.current.originY + deltaX * DRAG_SENSITIVITY,
    });
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      css={scoped(styles.container)}
      style={{
        perspective: Math.max(600, lengthF * 3),
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        css={scoped(styles.box)}
        style={
          {
            '--w': `${widthF}px`,
            '--h': `${heightF}px`,
            '--l': `${lengthF}px`,
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          } as CSSProperties
        }
      >
        <div css={scopedMerge(styles.face, styles.front)}>
          <FaceLabel
            fullLabel={widthLabel}
            shortLabel={__('W', 'kirki-ecommerce')}
            faceWidth={widthF}
            faceHeight={heightF}
          />
        </div>
        <div css={scopedMerge(styles.face, styles.back)}>
          <FaceLabel
            fullLabel={widthLabel}
            shortLabel={__('W', 'kirki-ecommerce')}
            faceWidth={widthF}
            faceHeight={heightF}
          />
        </div>
        <div css={scopedMerge(styles.face, styles.left)}>
          <FaceLabel
            fullLabel={lengthLabel}
            shortLabel={__('L', 'kirki-ecommerce')}
            faceWidth={lengthF}
            faceHeight={heightF}
          />
        </div>
        <div css={scopedMerge(styles.face, styles.right)}>
          <FaceLabel
            fullLabel={lengthLabel}
            shortLabel={__('L', 'kirki-ecommerce')}
            faceWidth={lengthF}
            faceHeight={heightF}
          />
        </div>
        <div css={scopedMerge(styles.face, styles.top)}>
          <FaceLabel
            fullLabel={heightLabel}
            shortLabel={__('H', 'kirki-ecommerce')}
            faceWidth={widthF}
            faceHeight={lengthF}
          />
        </div>
        <div css={scopedMerge(styles.face, styles.bottom)}>
          <FaceLabel
            fullLabel={heightLabel}
            shortLabel={__('H', 'kirki-ecommerce')}
            faceWidth={widthF}
            faceHeight={lengthF}
          />
        </div>
      </div>
    </div>
  );
};

ShippingBoxPreview.displayName = 'ShippingBoxPreview';

export default ShippingBoxPreview;

const styles = defineStyles({
  container: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    touchAction: 'none',
    userSelect: 'none',
  },
  box: {
    position: 'relative',
    transformStyle: 'preserve-3d',
    margin: 'auto',
    width: 'var(--w)',
    height: 'var(--h)',
  },
  face: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transformStyle: 'preserve-3d',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceLabel: {
    pointerEvents: 'none',
    userSelect: 'none',
    color: theme.colors.text.light,
    fontWeight: 500,
    textAlign: 'center',
    lineHeight: 1.1,
    opacity: 0.9,
    maxWidth: '90%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  front: {
    width: 'var(--w)',
    height: 'var(--h)',
    transform: 'translate(-50%, -50%) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  },
  back: {
    width: 'var(--w)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(180deg) translateZ(calc(var(--l) / 2))',
    background: theme.colors.shipping.boxDark,
  },
  right: {
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  },
  left: {
    width: 'var(--l)',
    height: 'var(--h)',
    transform:
      'translate(-50%, -50%) rotateY(-90deg) translateZ(calc(var(--w) / 2))',
    background: theme.colors.shipping.boxMid,
  },
  top: {
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  },
  bottom: {
    width: 'var(--w)',
    height: 'var(--l)',
    transform:
      'translate(-50%, -50%) rotateX(-90deg) translateZ(calc(var(--h) / 2))',
    background: theme.colors.shipping.boxLight,
  },
});
