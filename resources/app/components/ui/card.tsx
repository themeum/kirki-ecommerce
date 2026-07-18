import { forwardRef, type HTMLAttributes } from 'react';
import classNames from 'classnames';

import { CLASS_PREFIX } from '@/conf';

const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <div
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-card`, className)}
        {...rest}
      />
    );
  },
);

Card.displayName = 'Card';

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <div
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-card-header`, className)}
        {...rest}
      />
    );
  },
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<
  HTMLHeadingElement,
  HTMLAttributes<HTMLHeadingElement>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <h3
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-card-title`, className)}
      {...rest}
    />
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>((props, ref) => {
  const { className, ...rest } = props;

  return (
    <p
      ref={ref}
      className={classNames(`${CLASS_PREFIX}-ui-card-description`, className)}
      {...rest}
    />
  );
});

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <div
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-card-content`, className)}
        {...rest}
      />
    );
  },
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { className, ...rest } = props;

    return (
      <div
        ref={ref}
        className={classNames(`${CLASS_PREFIX}-ui-card-footer`, className)}
        {...rest}
      />
    );
  },
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
