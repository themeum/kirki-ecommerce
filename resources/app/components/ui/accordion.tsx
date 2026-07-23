import { keyframes, type SerializedStyles, type Theme } from '@emotion/react';
import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';

type AccordionContextValue = {
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
};

const AccordionContext = createContext<AccordionContextValue>({});

type AccordionProps = {
  children?: ReactNode;
  style?: CSSProperties;
  css?: SerializedStyles;
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
  css: cssProp,
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
          css={[styles.base, cssProp]}
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
          css={[styles.base, cssProp]}
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
  css?: SerializedStyles;
};

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>((props, ref) => {
  const { children, css: cssProp, value, ...rest } = props;
  const { hideSeparator } = useContext(AccordionContext);
  const generatedId = useId();
  const itemValue = value ?? generatedId;

  return (
    <AccordionPrimitive.Item ref={ref} value={itemValue} css={cssProp} {...rest}>
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
  css?: SerializedStyles;
  gap?: number;
};

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>((props, ref) => {
  const { children, css: cssProp, gap = 8, ...rest } = props;
  const { rightActions } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Header css={styles.header}>
      <AccordionPrimitive.Trigger
        ref={ref}
        css={[styles.trigger, cssProp]}
        {...rest}
      >
        <div css={styles.title}>{children}</div>
        <Flex gap={gap} style={{ alignItems: 'center' }}>
          <span css={styles.chevron} data-accordion-chevron="">
            <ChevronDown size={16} aria-hidden="true" />
          </span>
          {rightActions}
        </Flex>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = Omit<
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>((props, ref) => {
  const { children, css: cssProp, ...rest } = props;
  const { hasBottomSpace } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      css={[styles.content, hasBottomSpace && styles.contentSpaced, cssProp]}
      {...rest}
    >
      <div css={styles.contentInner} data-accordion-content-inner="">
      {children}
    </div>
    </AccordionPrimitive.Content>
  );
});

AccordionContent.displayName = 'AccordionContent';

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionContext,
};

const slideDown = keyframes({
  from: { height: 0 },
  to: { height: 'var(--radix-accordion-content-height)' },
});

const slideUp = keyframes({
  from: { height: 'var(--radix-accordion-content-height)' },
  to: { height: 0 },
});

const styles = {
  base: scoped({
    width: '397px',
    boxSizing: 'border-box',
    ...fontGeneralSettings(theme as Theme),
    color: '#09090b',
  }),
  header: scoped({
    margin: 0,
    display: 'flex',
  }),
  trigger: scoped({
    all: 'unset',
    boxSizing: 'border-box',
    width: '100%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontWeight: 500,
    padding: `${theme.spacing['2xl']} ${theme.spacing.none}`,
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
    '&[data-state="open"] [data-accordion-chevron], &:hover [data-accordion-chevron], &:focus-visible [data-accordion-chevron]':
      {
        visibility: 'visible',
      },
    '&[data-state="open"] [data-accordion-chevron] svg': {
      transform: 'rotate(180deg)',
    },
  }),
  title: scoped({
    flex: 1,
    minWidth: 0,
  }),
  chevron: scoped({
    display: 'inline-flex',
    visibility: 'hidden',
    transition: 'transform 200ms ease',
    svg: {
      transition: 'transform 200ms ease',
    },
  }),
  content: scoped({
    overflow: 'hidden',
    '&[data-state="closed"]': {
      animation: `${slideUp} 300ms ease`,
    },
    '&[data-state="open"]': {
      animation: `${slideDown} 300ms ease`,
    },
  }),
  contentSpaced: scoped({
    '& [data-accordion-content-inner]': {
      paddingBottom: theme.spacing['2xl'],
    },
  }),
  contentInner: scoped({}),
};
