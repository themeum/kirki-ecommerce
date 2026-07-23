import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type HTMLAttributes,
} from 'react';
import { type SerializedStyles, type Theme } from '@emotion/react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { theme } from '@/theme';
import { fontGeneralSettings, itemCenter, scoped } from '@/theme/mixins';

type CommandProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const Command = forwardRef<ElementRef<typeof CommandPrimitive>, CommandProps>(
  (props, ref) => {
    const { css: cssProp, ...rest } = props;

    return (
      <CommandPrimitive ref={ref} css={[styles.root, cssProp]} {...rest} />
    );
  },
);

Command.displayName = 'Command';

type CommandInputProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <div css={styles.inputWrapper}>
      <Search size={16} css={styles.searchIcon} />
      <CommandPrimitive.Input ref={ref} css={[styles.input, cssProp]} {...rest} />
    </div>
  );
});

CommandInput.displayName = 'CommandInput';

type CommandListProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <CommandPrimitive.List ref={ref} css={[styles.list, cssProp]} {...rest} />;
});

CommandList.displayName = 'CommandList';

type CommandEmptyProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandEmpty = forwardRef<
  ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <CommandPrimitive.Empty ref={ref} css={[styles.empty, cssProp]} {...rest} />;
});

CommandEmpty.displayName = 'CommandEmpty';

type CommandGroupProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Group>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandGroup = forwardRef<
  ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <CommandPrimitive.Group ref={ref} css={[styles.group, cssProp]} {...rest} />;
});

CommandGroup.displayName = 'CommandGroup';

type CommandItemProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return <CommandPrimitive.Item ref={ref} css={[styles.item, cssProp]} {...rest} />;
});

CommandItem.displayName = 'CommandItem';

type CommandSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  CommandSeparatorProps
>((props, ref) => {
  const { css: cssProp, ...rest } = props;

  return (
    <CommandPrimitive.Separator
      ref={ref}
      css={[styles.separator, cssProp]}
      {...rest}
    />
  );
});

CommandSeparator.displayName = 'CommandSeparator';

type CommandShortcutProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'className' | 'css'
> & {
  css?: SerializedStyles;
};

const CommandShortcut = (props: CommandShortcutProps) => {
  const { css: cssProp, ...rest } = props;

  return <span css={[styles.shortcut, cssProp]} {...rest} />;
};

CommandShortcut.displayName = 'CommandShortcut';

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
};

const styles = {
  root: scoped({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.fill,
    borderRadius: theme.radius.md,
    ...fontGeneralSettings(theme as Theme),
  }),
  inputWrapper: scoped({
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing.md,
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    borderBottom: `1px solid ${theme.colors.border.default}`,
    boxSizing: 'border-box',
  }),
  searchIcon: scoped({
    flexShrink: 0,
    color: theme.colors.text.secondary,
  }),
  input: scoped({
    flex: 1,
    width: '100%',
    minHeight: '28px',
    margin: 0,
    padding: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    boxShadow: 'none',
    ...fontGeneralSettings(theme as Theme),
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.primary,
    '&::placeholder': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
    },
  }),
  list: scoped({
    maxHeight: '240px',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing.xs,
  }),
  empty: scoped({
    padding: `${theme.spacing['2xl']} ${theme.spacing.md}`,
    textAlign: 'center',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.secondary,
  }),
  group: scoped({
    overflow: 'hidden',
    padding: `${theme.spacing.xs} 0`,
    '& [cmdk-group-heading]': {
      padding: `${theme.spacing.xs} ${theme.spacing.md}`,
      fontSize: '12px',
      lineHeight: '18px',
      fontWeight: 500,
      color: theme.colors.text.secondary,
    },
  }),
  item: scoped({
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing.md,
    width: '100%',
    minHeight: '32px',
    padding: `${theme.spacing.xs} ${theme.spacing.md}`,
    borderRadius: theme.radius.md,
    boxSizing: 'border-box',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: '20px',
    color: theme.colors.text.primary,
    outline: 'none',
    '&[data-selected="true"], &[aria-selected="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
    },
    '&[data-disabled="true"], &[aria-disabled="true"]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  }),
  separator: scoped({
    height: '1px',
    margin: `${theme.spacing.xs} 0`,
    backgroundColor: theme.colors.border.default,
  }),
  shortcut: scoped({
    marginLeft: 'auto',
    fontSize: '12px',
    lineHeight: '18px',
    color: theme.colors.text.secondary,
  }),
};
