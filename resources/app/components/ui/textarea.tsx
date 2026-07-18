import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
  error?: boolean;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((props, ref) => {
  const { className, error, rows = 5, ...rest } = props;

  return (
    <textarea
      ref={ref}
      rows={rows}
      data-error={error ? 'true' : undefined}
      className={classNames(
        `${CLASS_PREFIX}-ui-textarea`,
        error && `${CLASS_PREFIX}-ui-textarea--error`,
        className,
      )}
      {...rest}
    />
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
