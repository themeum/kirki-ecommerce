import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import Container from '@/components/ui/container';
import { theme } from '@/theme';
import { mergeCss, defineStyles } from '@/theme/mixins';

type FullPageContainerProps = ComponentPropsWithoutRef<typeof Container>;

const FullPageContainer = forwardRef<HTMLDivElement, FullPageContainerProps>(
  (props, ref) => {
    const { cssOverride, scrollable = false, children, ...rest } = props;

    return (
      <Container
        ref={ref}
        scrollable={scrollable}
        cssOverride={mergeCss(styles.root, cssOverride)}
        {...rest}
      >
        {children}
      </Container>
    );
  },
);

FullPageContainer.displayName = 'FullPageContainer';

export default FullPageContainer;

const styles = defineStyles({
  root: {
    minHeight: '100vh',
    maxWidth: '100%',
    backgroundColor: theme.colors.background.fill,
  },
});
