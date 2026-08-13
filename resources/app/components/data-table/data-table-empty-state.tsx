import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import EmptyState from '@/components/ui/empty-state';
import { __ } from '@/wpi18n';

type DataTableEmptyStateProps = {
  icon?: ReactNode;
  text?: string;
  cssOverride?: CSSObject;
};

const DataTableEmptyState = ({ icon, text, cssOverride }: DataTableEmptyStateProps) => (
  <EmptyState
    icon={icon}
    text={text ?? __('No items found', 'kirki-ecommerce')}
    cssOverride={cssOverride}
  />
);

DataTableEmptyState.displayName = 'DataTableEmptyState';

export default DataTableEmptyState;
export type { DataTableEmptyStateProps };
