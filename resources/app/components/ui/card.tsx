import {
  forwardRef,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent,
  type ReactNode,
} from 'react';
import classNames from 'classnames';
import { useNavigate } from 'react-router';

import { CLASS_PREFIX } from '@/conf';
import type { CardType } from '@/types';

type CardVariantType = CardType | 'large' | 'tartiary' | 'navbar';

type CardProps = Omit<HTMLAttributes<HTMLDivElement>, 'children'> & {
  children?: ReactNode;
  type?: CardVariantType;
  link?: string | false;
  style?: CSSProperties;
};

const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    children,
    className,
    style,
    type = 'default',
    link = false,
    onClick,
    ...rest
  } = props;
  const navigate = useNavigate();

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    if (link) {
      navigate(link);
    }
    onClick?.(event);
  };

  return (
    <div
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-card`,
        `${CLASS_PREFIX}-ui-card--${type}`,
        className,
      )}
      style={{
        ...style,
        cursor: link ? 'pointer' : style?.cursor,
      }}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </div>
  );
});

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
