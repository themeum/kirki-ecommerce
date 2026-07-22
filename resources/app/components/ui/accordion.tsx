import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import classNames from 'classnames';

import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import { CLASS_PREFIX } from '@/conf';
import type { StyleProps } from '@/types';

type AccordionContextValue = {
  hideSeparator?: boolean;
  rightActions?: ReactNode;
  hasBottomSpace?: boolean;
};

const AccordionContext = createContext<AccordionContextValue>({});

type AccordionProps = StyleProps & {
  children?: ReactNode;
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
  className = '',
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
          className={classNames(`${CLASS_PREFIX}-ui-accordion`, className)}
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
          className={classNames(`${CLASS_PREFIX}-ui-accordion`, className)}
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

type AccordionItemProps = StyleProps &
  Omit<
    ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
    'value' | 'className' | 'style'
  > & {
    children?: ReactNode;
    value?: string;
  };

const AccordionItem = forwardRef<
  ElementRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>((props, ref) => {
  const { children, style = {}, className = '', value, ...rest } = props;
  const { hideSeparator } = useContext(AccordionContext);
  const generatedId = useId();
  const itemValue = value ?? generatedId;

  return (
    <AccordionPrimitive.Item
      ref={ref}
      value={itemValue}
      className={classNames(`${CLASS_PREFIX}-ui-accordion-item`, className)}
      style={style}
      {...rest}
    >
      {children}
      {!hideSeparator && <Separator />}
    </AccordionPrimitive.Item>
  );
});

AccordionItem.displayName = 'AccordionItem';

type AccordionTriggerProps = StyleProps &
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    gap?: number;
  };

const AccordionTrigger = forwardRef<
  ElementRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>((props, ref) => {
  const { children, style = {}, className = '', gap = 8, ...rest } = props;
  const { rightActions } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Header className={`${CLASS_PREFIX}-ui-accordion-header`}>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={classNames(
          `${CLASS_PREFIX}-ui-accordion-trigger`,
          className,
        )}
        style={style}
        {...rest}
      >
        <div className={`${CLASS_PREFIX}-ui-accordion-title`}>{children}</div>
        <Flex gap={gap} style={{ alignItems: 'center' }}>
          <span className={`${CLASS_PREFIX}-ui-accordion-chevron`}>
            <ChevronDown size={16} aria-hidden="true" />
          </span>
          {rightActions}
        </Flex>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

AccordionTrigger.displayName = 'AccordionTrigger';

type AccordionContentProps = StyleProps &
  ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

const AccordionContent = forwardRef<
  ElementRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>((props, ref) => {
  const { children, style = {}, className = '', ...rest } = props;
  const { hasBottomSpace } = useContext(AccordionContext);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={classNames(
        `${CLASS_PREFIX}-ui-accordion-content`,
        hasBottomSpace && `${CLASS_PREFIX}-ui-accordion-content--spaced`,
        className,
      )}
      style={style}
      {...rest}
    >
      <div className={`${CLASS_PREFIX}-ui-accordion-content-inner`}>
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
