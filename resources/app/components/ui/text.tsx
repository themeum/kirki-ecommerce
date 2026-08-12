import type { CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, forwardRef, type ReactNode, type Ref } from 'react';

import { theme, type TypographyWeight } from '@/theme';
import { scopedMerge } from '@/theme/mixins';

type TextVariant =
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'heading4'
  | 'heading5'
  | 'heading6'
  | 'paragraph'
  | 'small'
  | 'tiny'
  | 'lead';

type TextColor = keyof typeof theme.colors.text;

type TextProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  children?: ReactNode;
  variant?: TextVariant;
  color?: TextColor;
  weight?: TypographyWeight;
  cssOverride?: CSSObject;
};

const Text = forwardRef<HTMLElement, TextProps>((props, ref) => {
  const {
    cssOverride,
    children,
    variant = 'paragraph',
    color = 'primary',
    weight,
    ...rest
  } = props;

  const textCss = scopedMerge(
    styles.base,
    styles.variants[variant](weight),
    styles.colors[color],
    cssOverride,
  );

  if (variant === 'heading1') {
    return (
      <h1 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h1>
    );
  }

  if (variant === 'heading2') {
    return (
      <h2 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h2>
    );
  }

  if (variant === 'heading3') {
    return (
      <h3 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h3>
    );
  }

  if (variant === 'heading4') {
    return (
      <h4 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h4>
    );
  }

  if (variant === 'heading5') {
    return (
      <h5 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h5>
    );
  }

  if (variant === 'heading6') {
    return (
      <h6 ref={ref as Ref<HTMLHeadingElement>} css={textCss} {...rest}>
        {children}
      </h6>
    );
  }

  return (
    <div ref={ref as Ref<HTMLDivElement>} css={textCss} {...rest}>
      {children}
    </div>
  );
});

Text.displayName = 'Text';

export default Text;
export type { TextColor, TextProps, TextVariant };

const variantStyle = (
  styles: CSSObject,
): CSSObject => styles;

const styles = {
  base: {
    margin: 0,
  } satisfies CSSObject,
  variants: {
    heading1: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading1(weight)
          : theme.typography.heading1(),
      ),
    heading2: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading2(weight)
          : theme.typography.heading2(),
      ),
    heading3: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading3(weight)
          : theme.typography.heading3(),
      ),
    heading4: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading4(weight)
          : theme.typography.heading4(),
      ),
    heading5: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading5(weight)
          : theme.typography.heading5(),
      ),
    heading6: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.heading6(weight)
          : theme.typography.heading6(),
      ),
    paragraph: (weight?: TypographyWeight) =>
      variantStyle(
        weight
          ? theme.typography.paragraph(weight)
          : theme.typography.paragraph(),
      ),
    small: (weight?: TypographyWeight) =>
      variantStyle(
        weight ? theme.typography.small(weight) : theme.typography.small(),
      ),
    tiny: (weight?: TypographyWeight) =>
      variantStyle(
        weight ? theme.typography.tiny(weight) : theme.typography.tiny(),
      ),
    lead: (weight?: TypographyWeight) =>
      variantStyle(
        weight ? theme.typography.lead(weight) : theme.typography.lead(),
      ),
  },
  colors: Object.fromEntries(
    (Object.keys(theme.colors.text) as TextColor[]).map((key) => [
      key,
      { color: theme.colors.text[key] },
    ]),
  ) as Record<TextColor, CSSObject>,
};
