import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import classNames from 'classnames';

import Container from '@/components/ui/container';
import { CLASS_PREFIX } from '@/conf';

type FullPageContainerProps = ComponentPropsWithoutRef<typeof Container>;

const FullPageContainer = forwardRef<HTMLDivElement, FullPageContainerProps>(
  (props, ref) => {
    const { scrollable = false, className, children, ...rest } = props;

    return (
      <Container
        ref={ref}
        scrollable={scrollable}
        className={classNames(
          `${CLASS_PREFIX}-ui-full-page-container`,
          className,
        )}
        {...rest}
      >
        {children}
      </Container>
    );
  },
);

FullPageContainer.displayName = 'FullPageContainer';

export default FullPageContainer;
