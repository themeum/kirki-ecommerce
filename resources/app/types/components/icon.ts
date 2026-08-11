import type { CSSProperties, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

type IconColorProps = {
  color?: string;
};

type IconDimensionProps = {
  height?: string | number;
  width?: string | number;
};

type IconStyleProps = {
  style?: CSSProperties;
  className?: string;
};

type ArrowDownUpFilledProps = {
  top?: string;
  bottom?: string;
};

export type {
  ArrowDownUpFilledProps,
  IconColorProps,
  IconDimensionProps,
  IconProps,
  IconStyleProps,
};
