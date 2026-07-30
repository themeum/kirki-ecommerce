import type { CSSObject } from '@emotion/react';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import Flex from '@/components/ui/flex';
import { mergeCss } from '@/theme/mixins';

type ActionGroupProps = ComponentPropsWithoutRef<typeof Flex>;

const ActionGroup = forwardRef<HTMLDivElement, ActionGroupProps>(
  (props, ref) => {
    const { cssOverride, gap = 2, children, ...rest } = props;

    return (
      <Flex
        ref={ref}
        gap={gap}
        data-action-group="true"
        cssOverride={mergeCss(styles.root, cssOverride)}
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
  root: {
    marginLeft: 'auto',
    alignItems: 'center',
  } satisfies CSSObject,
};
