import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import EmptyState from '@/components/ui/empty-state';
import { EmptySearchIcon } from '@/icons/empty-state';
import { __ } from '@/wpi18n';

type DataTableEmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  cssOverride?: CSSObject;
};

const DataTableEmptyState = (props: DataTableEmptyStateProps) => {
  const {
    icon = <EmptySearchIcon />,
    title = __('No records found', 'kirki-ecommerce'),
    description = __('Try a different search or clear your filters.', 'kirki-ecommerce'),
    actions,
    cssOverride,
  } = props;

  return (
    <EmptyState
      icon={icon}
      text={title}
      description={description}
      actions={actions}
      cssOverride={cssOverride}
    />
  );
};

DataTableEmptyState.displayName = 'DataTableEmptyState';

export default DataTableEmptyState;
export type { DataTableEmptyStateProps };
