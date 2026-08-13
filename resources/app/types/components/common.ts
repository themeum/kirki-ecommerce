import type { CSSProperties, ReactNode } from 'react';

import type { SpacingKey } from '@/theme';

type StyleProps = {
  className?: string;
  style?: CSSProperties;
};

type GapValue = SpacingKey | (string & {});
type FlexAlign =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'baseline'
  | 'stretch'
  | 'start'
  | 'end';
type FlexJustify =
  | 'flex-start'
  | 'flex-end'
  | 'center'
  | 'space-between'
  | 'space-around'
  | 'space-evenly'
  | 'start'
  | 'end'
  | 'stretch';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type FlexGrow = number | string;
type FlexShrink = number | string;
type FlexBasis = number | string;

type LabelFieldProps = {
  label?: string;
  helpText?: string;
  error?: string | boolean;
};

type SelectOption = {
  value: string | number;
  title: string;
  heading?: boolean;
  icon?: ReactNode;
  color?: string;
  fallback?: boolean;
  infoText?: string;
  group?: string;
  tagIcon?: ReactNode;
  subText?: string;
};

type ButtonSize = 'small' | 'large' | 'icon' | 'fullWidth' | 'xsm';
type ButtonType =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outlined'
  | 'ghost'
  | 'primarySoft'
  | 'destructiveSoft'
  | 'link'
  | 'inverse'
  | 'blank'
  | 'tartiary'
  | 'invisible';
type ButtonState = 'loading' | 'disabled' | 'active' | 'hover' | '';

type InputState = 'muted' | 'disabled' | 'active' | '';
type SelectState = 'disabled' | 'active' | '';

type AlertType = 'success' | 'fail' | 'pending';
type HeadingType = 'primary' | 'secondary' | 'tertiary' | '';
type LabelType = 'error' | '';
type TableDensity = 'default' | 'compact' | 'wide';
type TableAlignment = 'right' | 'center';
type ContainerSize = 'sm' | 'md' | 'lg' | 'xl' | 'fullWidth';
type ThumbnailSize = 'fullWidth' | 'small' | 'xsm';
type ThumbnailType = 'circle';
type FlexDirection = 'column' | 'row' | '';
type TooltipPosition = 'bottom' | 'top' | 'left' | 'right';
type DropdownSize = 'default' | 'small';
type DropdownPosition = {
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  top?: boolean;
};
type DropdownItemState = 'disabled' | 'titleOnly' | 'defaultSelected' | '';
type ConfirmationVariant = 'default' | 'warning' | 'delete';

export type {
  AlertType,
  ButtonSize,
  ButtonState,
  ButtonType,
  ConfirmationVariant,
  ContainerSize,
  DropdownItemState,
  DropdownPosition,
  DropdownSize,
  FlexAlign,
  FlexBasis,
  FlexDirection,
  FlexGrow,
  FlexJustify,
  FlexShrink,
  FlexWrap,
  GapValue,
  HeadingType,
  InputState,
  LabelFieldProps,
  LabelType,
  SelectOption,
  SelectState,
  StyleProps,
  TableAlignment,
  TableDensity,
  ThumbnailSize,
  ThumbnailType,
  TooltipPosition,
};

