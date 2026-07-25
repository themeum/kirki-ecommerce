import { css } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import Flex from '@/components/ui/flex';
import { scoped } from '@/theme/mixins';

type ActionGroupProps = ComponentPropsWithoutRef<typeof Flex>;

const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  (props, ref) => {
    const { css: cssProp, gap = 2, children, ...rest } = props;

    return (
      <Flex
        ref={ref}
        gap={gap}
        data-action-group="true"
        css={css(styles.root, cssProp)}
        {...rest}
      >
        {children}
      </Flex>
    );
  },
);

ActionGroup.displayName = 'ActionGroup';

export default ActionGroup;

const styles = {
  root: scoped({
    marginLeft: 'auto',
    alignItems: 'center',
  }),
};
