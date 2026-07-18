import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import {
  InfoCircledIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import Tooltip from '@/molecules/tooltip';

type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  helpText?: ReactNode;
  infoText?: ReactNode;
  error?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const Label = forwardRef<HTMLLabelElement, LabelProps>((props, ref) => {
  const {
    className,
    children,
    helpText,
    infoText,
    error,
    leftIcon,
    rightIcon,
    ...rest
  } = props;

  const iconColor = error ? '#d40000' : 'currentColor';

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-label`,
        error && `${CLASS_PREFIX}-ui-label--error`,
        className,
      )}
      {...rest}
    >
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-ui-label-icon`}>{leftIcon}</span>
      )}
      {children}
      {helpText && (
        <Tooltip type="dark" tip={helpText}>
          <span className={`${CLASS_PREFIX}-ui-label-icon`}>
            <QuestionMarkCircledIcon
              width={16}
              height={16}
              color={iconColor}
            />
          </span>
        </Tooltip>
      )}
      {infoText && (
        <Tooltip type="dark" tip={infoText}>
          <span className={`${CLASS_PREFIX}-ui-label-icon`}>
            <InfoCircledIcon width={16} height={16} color={iconColor} />
          </span>
        </Tooltip>
      )}
      {rightIcon && (
        <span className={`${CLASS_PREFIX}-ui-label-icon`}>{rightIcon}</span>
      )}
    </LabelPrimitive.Root>
  );
});

Label.displayName = 'Label';

export default Label;
