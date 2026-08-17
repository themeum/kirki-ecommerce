import type { CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef } from 'react';

import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type CardProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
};

const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div ref={ref} css={scopedMerge(styles.card, cssOverride)} {...rest} />
  );
});

Card.displayName = 'Card';

type CardSectionProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CardHeader = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div ref={ref} css={scopedMerge(styles.header, cssOverride)} {...rest} />
    );
  },
);

CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLDivElement, CardSectionProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div ref={ref} css={scopedMerge(styles.title, cssOverride)} {...rest} />
  );
});

CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        css={scopedMerge(styles.description, cssOverride)}
        {...rest}
      />
    );
  },
);

CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        css={scopedMerge(styles.content, cssOverride)}
        {...rest}
      />
    );
  },
);

CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, CardSectionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div ref={ref} css={scopedMerge(styles.footer, cssOverride)} {...rest} />
    );
  },
);

CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
export type { CardProps };

const styles = defineStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[4],
    width: '100%',
    paddingBlock: theme.spacing[4],
    borderRadius: theme.radius.xl,
    border: `1px solid ${theme.colors.border.secondary}`,
    backgroundColor: theme.colors.background.fill,
    color: theme.colors.text.primary,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[2],
    paddingInline: theme.spacing[4],
  },
  title: {
    margin: 0,
    ...theme.typography.paragraph('semibold'),
    color: theme.colors.text.primary,
  },
  description: {
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
  content: {
    paddingInline: theme.spacing[4],
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    paddingInline: theme.spacing[4],
  },
});
