import { keyframes, type CSSObject } from '@emotion/react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { createContext, forwardRef, useContext, useId, type ComponentPropsWithoutRef, type CSSProperties, type ElementRef, type ReactNode } from 'react';

import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { defineStyles, scoped, scopedMerge } from '@/theme/mixins';

type AccordionContextValue = {
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
};

const AccordionContext = createContext<AccordionContextValue>({});

type AccordionProps = {
  children?: ReactNode;
  style?: CSSProperties;
  cssOverride?: CSSObject;
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
};

const Accordion = ({
  children,
  style = {},
  cssOverride,
  hideSeparator = false,
  rightActions = null,
  hasBottomSpace = true,
  type = 'multiple',
  defaultValue,
  value,
  onValueChange,
}: AccordionProps) => {
  return (
    <AccordionContext.Provider
      value={{ hideSeparator, rightActions, hasBottomSpace }}
    >
      {type === 'single' ? (
        <AccordionPrimitive.Root
          type="single"
          collapsible
          css={scopedMerge(styles.base, cssOverride)}
          style={style}
          defaultValue={
            typeof defaultValue === 'string' ? defaultValue : undefined
          }
          value={typeof value === 'string' ? value : undefined}
          onValueChange={onValueChange as ((value: string) => void) | undefined}
        >
          {children}
        </AccordionPrimitive.Root>
      ) : (
        <AccordionPrimitive.Root
          type="multiple"
          css={scopedMerge(styles.base, cssOverride)}
          style={style}
          defaultValue={
            Array.isArray(defaultValue)
              ? defaultValue
              : typeof defaultValue === 'string'
                ? [defaultValue]
                : undefined
          }
          value={
            Array.isArray(value)
              ? value
              : typeof value === 'string'
                ? [value]
                : undefined
          }
          onValueChange={
            onValueChange as ((value: string[]) => void) | undefined
          }
        >
          {children}
        </AccordionPrimitive.Root>
      )}
    </AccordionContext.Provider>
  );
};

Accordion.displayName = 'Accordion';

type AccordionItemProps = Omit<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
  'value' | 'className' | 'css'
> & {
  children?: ReactNode;
  value?: string;
  cssOverride?: CSSObject;
};

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>((props, ref) => {
  const { children, cssOverride, value, ...rest } = props;
  const { hideSeparator } = useContext(AccordionContext);
  const generatedId = useId();
  const itemValue = value ?? generatedId;

  return (
    <AccordionPrimitive.Item ref={ref} value={itemValue} css={cssOverride} {...rest}>
      {children}
      {!hideSeparator && <Separator />}
    </AccordionPrimitive.Item>
  );
});

AccordionItem.displayName = 'AccordionItem';

type AccordionTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
  gap?: number;
};

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>((props, ref) => {
  const { children, cssOverride, gap = 8, style, ...rest } = props;
  const { rightActions } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Header
      css={scopedMerge(styles.header, cssOverride)}
      style={{ ...style, columnGap: `${gap}px` }}
    >
      <AccordionPrimitive.Trigger
        ref={ref}
        css={scoped(styles.trigger)}
        {...rest}
      >
        <div css={scoped(styles.title)}>{children}</div>
        <span css={scoped(styles.chevron)} data-accordion-chevron="">
          <ChevronDown size={16} aria-hidden="true" />
        </span>
      </AccordionPrimitive.Trigger>
      {rightActions ? (
        <div css={scoped(styles.rightActions)}>{rightActions}</div>
      ) : null}
    </AccordionPrimitive.Header>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = Omit<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>((props, ref) => {
  const { children, cssOverride, ...rest } = props;
  const { hasBottomSpace } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      css={scopedMerge(styles.content, hasBottomSpace && styles.contentSpaced, cssOverride)}
      {...rest}
    >
      <div css={scoped(styles.contentInner)} data-accordion-content-inner="">
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
});

AccordionContent.displayName = 'AccordionContent';

export {
  Accordion, AccordionContent,
  AccordionContext, AccordionItem,
  AccordionTrigger
};

const slideDown = keyframes({
  from: { height: 0 },
  to: { height: 'var(--radix-accordion-content-height)' },
});

const slideUp = keyframes({
  from: { height: 'var(--radix-accordion-content-height)' },
  to: { height: 0 },
});

const styles = defineStyles({
  base: {
    width: '397px',
    boxSizing: 'border-box',
    color: theme.colors.text.primary,
  },
  header: {
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: `${theme.spacing[4]} ${theme.spacing[0]}`,
    '&:hover [data-accordion-chevron], &:focus-within [data-accordion-chevron]':
    {
      visibility: 'visible',
    },
  },
  trigger: {
    all: 'unset',
    boxSizing: 'border-box',
    flex: 1,
    minWidth: 0,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.typography.paragraph('medium'),
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
    '&[data-state="open"] [data-accordion-chevron]': {
      visibility: 'visible',
    },
    '&[data-state="open"] [data-accordion-chevron] svg': {
      transform: 'rotate(180deg)',
    },
  },
  title: {
    flex: 1,
    minWidth: 0,
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  chevron: {
    display: 'inline-flex',
    visibility: 'hidden',
    transition: 'transform 200ms ease',
    svg: {
      transition: 'transform 200ms ease',
    },
  },
  content: {
    overflow: 'hidden',
    '&[data-state="closed"]': {
      animation: `${slideUp} 300ms ease`,
    },
    '&[data-state="open"]': {
      animation: `${slideDown} 300ms ease`,
    },
  },
  contentSpaced: {
    '& [data-accordion-content-inner]': {
      paddingBottom: theme.spacing[4],
    },
  },
  contentInner: {},
});
