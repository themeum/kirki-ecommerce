import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as SwitchPrimitive from '@radix-ui/react-switch';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type SwitchProps = ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>;

const Switch = forwardRef<ElementRef<typeof SwitchPrimitive.Root>, SwitchProps>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <SwitchPrimitive.Root
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-switch`, className)}
        {...rest}
      >
        <SwitchPrimitive.Thumb
          className={`${CLASS_PREFIX}-ui-switch-thumb`}
        />
      </SwitchPrimitive.Root>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
