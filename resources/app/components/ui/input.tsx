import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type InputProps = ComponentPropsWithoutRef<'input'> & {
  error?: boolean;
};

const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { className, error, type = 'text', ...rest } = props;

  return (
    <input
      ref={ref}
      type={type}
      data-error={error ? 'true' : undefined}
      className={classNames(
        `${CLASS_PREFIX}-ui-input`,
        error && `${CLASS_PREFIX}-ui-input--error`,
        className,
      )}
      {...rest}
    />
  );
});

Input.displayName = 'Input';

export default Input;
