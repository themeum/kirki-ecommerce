import { css } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import Container from '@/components/ui/container';
import { theme } from '@/theme';
import { scoped } from '@/theme/mixins';

type FullPageContainerProps = ComponentPropsWithoutRef<typeof Container>;

const FullPageContainer = forwardRef<HTMLDivElement, FullPageContainerProps>(
  (props, ref) => {
    const { css: cssProp, scrollable = false, children, ...rest } = props;

    return (
      <Container
        ref={ref}
        scrollable={scrollable}
        css={css(styles.root, cssProp)}
        {...rest}
      >
        {children}
      </Container>
    );
  },
);

FullPageContainer.displayName = 'FullPageContainer';

export default FullPageContainer;

const styles = {
  root: scoped({
    minHeight: '100vh',
    maxWidth: '100%',
    backgroundColor: theme.colors.background.fill,
  }),
};
