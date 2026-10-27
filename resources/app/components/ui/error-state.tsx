import type { CSSObject } from '@emotion/react';
import type { ReactNode } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import EmptyState from '@/components/ui/empty-state';
import { ErrorStateIcon } from '@/icons/error-state';

type ErrorStateProps = {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  cssOverride?: CSSObject;
};

const ErrorState = (props: ErrorStateProps) => {
  const { title, description, icon, actions, cssOverride } = props;

  return (
    <Card>
      <CardContent cssOverride={{ display: 'flex', justifyContent: 'center' }}>
        <EmptyState
          icon={icon ?? <ErrorStateIcon />}
          text={title}
          description={description}
          actions={actions}
          cssOverride={{ ...cssOverride, maxWidth: 400 }}
        />
      </CardContent>
    </Card>
  );
};

ErrorState.displayName = 'ErrorState';

export default ErrorState;
export type { ErrorStateProps };
