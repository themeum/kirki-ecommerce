import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import {
  InfoCircledIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';
import Tooltip from '@/components/ui/tooltip';

type LabelProps = Omit<
  ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
  'children'
> & {
  children?: ReactNode;
  text?: ReactNode;
  type?: 'error' | 'disabled' | '';
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
    text,
    type,
    helpText,
    infoText,
    error,
    leftIcon,
    rightIcon,
    ...rest
  } = props;
  const content = children ?? text;
  const isError = error || type === 'error';

  const iconColor = isError ? '#d40000' : 'currentColor';

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-label`,
        isError && `${CLASS_PREFIX}-ui-label--error`,
        type === 'disabled' && `${CLASS_PREFIX}-ui-label--disabled`,
        className,
      )}
      {...rest}
    >
      {leftIcon && (
        <span className={`${CLASS_PREFIX}-ui-label-icon`}>{leftIcon}</span>
      )}
      {content}
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
