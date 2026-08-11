import { forwardRef, type ComponentPropsWithoutRef, type ElementRef, type HTMLAttributes } from 'react';
import { type CSSObject } from '@emotion/react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { theme } from '@/theme';
import { itemCenter, scopedMerge, scoped, defineStyles } from '@/theme/mixins';

type CommandProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const Command = forwardRef<ElementRef<typeof CommandPrimitive>, CommandProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <CommandPrimitive ref={ref} css={scopedMerge(styles.root, cssOverride)} {...rest} />
    );
  },
);

Command.displayName = 'Command';

type CommandInputProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Input>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandInput = forwardRef<
  ElementRef<typeof CommandPrimitive.Input>,
  CommandInputProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div css={scoped(styles.inputWrapper)}>
      <Search size={16} css={scoped(styles.searchIcon)} />
      <CommandPrimitive.Input ref={ref} css={scopedMerge(styles.input, cssOverride)} {...rest} />
    </div>
  );
});

CommandInput.displayName = 'CommandInput';

type CommandListProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.List>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandList = forwardRef<
  ElementRef<typeof CommandPrimitive.List>,
  CommandListProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return <CommandPrimitive.List ref={ref} css={scopedMerge(styles.list, cssOverride)} {...rest} />;
});

CommandList.displayName = 'CommandList';

type CommandEmptyProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandEmpty = forwardRef<
  ElementRef<typeof CommandPrimitive.Empty>,
  CommandEmptyProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return <CommandPrimitive.Empty ref={ref} css={scopedMerge(styles.empty, cssOverride)} {...rest} />;
});

CommandEmpty.displayName = 'CommandEmpty';

type CommandGroupProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Group>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandGroup = forwardRef<
  ElementRef<typeof CommandPrimitive.Group>,
  CommandGroupProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return <CommandPrimitive.Group ref={ref} css={scopedMerge(styles.group, cssOverride)} {...rest} />;
});

CommandGroup.displayName = 'CommandGroup';

type CommandItemProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Item>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandItem = forwardRef<
  ElementRef<typeof CommandPrimitive.Item>,
  CommandItemProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return <CommandPrimitive.Item ref={ref} css={scopedMerge(styles.item, cssOverride)} {...rest} />;
});

CommandItem.displayName = 'CommandItem';

type CommandSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandSeparator = forwardRef<
  ElementRef<typeof CommandPrimitive.Separator>,
  CommandSeparatorProps
>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <CommandPrimitive.Separator
      ref={ref}
      css={scopedMerge(styles.separator, cssOverride)}
      {...rest}
    />
  );
});

CommandSeparator.displayName = 'CommandSeparator';

type CommandShortcutProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const CommandShortcut = (props: CommandShortcutProps) => {
  const { cssOverride, ...rest } = props;

  return <span css={scopedMerge(styles.shortcut, cssOverride)} {...rest} />;
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

const styles = defineStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: theme.colors.background.fill,
    borderRadius: theme.radius.md,
  },
  inputWrapper: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[2],
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderBottom: `1px solid ${theme.colors.border.default}`,
  },
  searchIcon: {
    flexShrink: 0,
    color: theme.colors.text.secondary,
  },
  input: {
    flex: 1,
    width: '100%',
    minHeight: '28px',
    margin: 0,
    padding: 0,
    border: 'none',
    background: 'transparent',
    outline: 'none',
    boxShadow: 'none',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    '&::placeholder': {
      color: theme.colors.text.secondary,
      opacity: 0.8,
    },
  },
  list: {
    maxHeight: '240px',
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: theme.spacing[1],
  },
  empty: {
    padding: `${theme.spacing[4]} ${theme.spacing[2]}`,
    textAlign: 'center',
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
  group: {
    overflow: 'hidden',
    padding: `${theme.spacing[1]} 0`,
    '& [cmdk-group-heading]': {
      padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
      ...theme.typography.small('medium'),
      color: theme.colors.text.secondary,
    },
  },
  item: {
    ...itemCenter(),
    justifyContent: 'flex-start',
    gap: theme.spacing[2],
    width: '100%',
    minHeight: '32px',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    outline: 'none',
    '&[data-selected="true"], &[aria-selected="true"]': {
      backgroundColor: theme.colors.background.surfaceAlt,
    },
    '&[data-disabled="true"], &[aria-disabled="true"]': {
      opacity: 0.5,
      pointerEvents: 'none',
    },
  },
  separator: {
    height: '1px',
    margin: `${theme.spacing[1]} 0`,
    backgroundColor: theme.colors.border.default,
  },
  shortcut: {
    marginLeft: 'auto',
    ...theme.typography.small(),
    color: theme.colors.text.secondary,
  },
});
