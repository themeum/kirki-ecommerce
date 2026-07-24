import type { CSSProperties, ReactNode } from 'react';

type StyleProps = {
  className?: string;
  style?: CSSProperties;
};

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

type BadgeType =
  | 'published'
  | 'secondary'
  | 'trashed'
  | 'draft'
  | 'pending'
  | 'processing'
  | 'onHold'
  | 'refunded'
  | 'requested'
  | 'default';

type AlertType = 'success' | 'fail' | 'pending';
type HeadingType = 'primary' | 'secondary' | 'tertiary' | '';
type LabelType = 'error' | '';
type TableType = 'default' | 'variation' | 'wide';
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

type PaginationData = {
  current_page: number;
  last_page: number;
  from: number;
  total: number;
  has_more_pages: boolean;
  className?: string;
  style?: CSSProperties;
};

export type {
  AlertType, BadgeType, ButtonSize, ButtonState, ButtonType, ConfirmationVariant, ContainerSize, DropdownItemState, DropdownPosition, DropdownSize, FlexDirection, HeadingType, InputState, LabelFieldProps, LabelType, PaginationData, SelectOption, SelectState, StyleProps, TableAlignment, TableType, ThumbnailSize,
  ThumbnailType, TooltipPosition
};

