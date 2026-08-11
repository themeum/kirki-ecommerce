import { type CSSObject, type Theme } from '@emotion/react';
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  type ReactNode,
} from 'react';
import { HexAlphaColorPicker, HexColorPicker } from 'react-colorful';

import Input from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scoped, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { isValidHex, normalizeHex } from '@/utils/color';
import { __ } from '@/wpi18n';

const FALLBACK_COLOR = '#000000';

type ColorPickerContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  alpha: boolean;
  disabled: boolean;
};

const ColorPickerContext = createContext<ColorPickerContextValue | null>(null);

const useColorPicker = (): ColorPickerContextValue => {
  const context = useContext(ColorPickerContext);

  if (!context) {
    throw new Error('ColorPicker parts must be used within ColorPicker');
  }

  return context;
};

type ColorPickerProps = Omit<
  ComponentPropsWithoutRef<typeof Popover>,
  'children'
> & {
  value?: string;
  onValueChange?: (value: string) => void;
  alpha?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

const ColorPicker = ({
  value = '',
  onValueChange,
  alpha = false,
  disabled = false,
  children,
  ...rest
}: ColorPickerProps) => {
  return (
    <ColorPickerContext.Provider
      value={{
        value,
        onValueChange: onValueChange ?? (() => {}),
        alpha,
        disabled,
      }}
    >
      <Popover {...rest}>{children}</Popover>
    </ColorPickerContext.Provider>
  );
};

ColorPicker.displayName = 'ColorPicker';

type ColorPickerTriggerProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverTrigger>,
  'className' | 'css'
> & {
  error?: boolean;
  cssOverride?: CSSObject;
};

const ColorPickerTrigger = forwardRef<
  ComponentRef<typeof PopoverTrigger>,
  ColorPickerTriggerProps
>((props, ref) => {
  const { error, cssOverride, children, ...rest } = props;
  const { disabled } = useColorPicker();

  return (
    <PopoverTrigger
      ref={ref}
      disabled={disabled}
      data-error={error ? 'true' : undefined}
      css={scopedMerge(styles.trigger, cssOverride)}
      {...rest}
    >
      {children}
    </PopoverTrigger>
  );
});

ColorPickerTrigger.displayName = 'ColorPickerTrigger';

type ColorPickerSwatchProps = {
  cssOverride?: CSSObject;
};

const ColorPickerSwatch = ({ cssOverride }: ColorPickerSwatchProps) => {
  const { value } = useColorPicker();

  return (
    <span
      aria-hidden="true"
      style={{ ['--kirki-picker-swatch' as string]: value || 'transparent' }}
      css={scopedMerge(styles.swatch, !value && styles.swatchEmpty, cssOverride)}
    />
  );
};

ColorPickerSwatch.displayName = 'ColorPickerSwatch';

type ColorPickerValueProps = {
  placeholder?: string;
  cssOverride?: CSSObject;
};

const ColorPickerValue = ({ placeholder, cssOverride }: ColorPickerValueProps) => {
  const { value } = useColorPicker();

  return (
    <span css={scopedMerge(styles.value, !value && styles.valueEmpty, cssOverride)}>
      {value || placeholder || __('Select a color', 'kirki-ecommerce')}
    </span>
  );
};

ColorPickerValue.displayName = 'ColorPickerValue';

type ColorPickerContentProps = ComponentPropsWithoutRef<typeof PopoverContent>;

const ColorPickerContent = forwardRef<
  ComponentRef<typeof PopoverContent>,
  ColorPickerContentProps
>((props, ref) => {
  const { cssOverride, align = 'start', children, ...rest } = props;

  return (
    <PopoverContent
      ref={ref}
      align={align}
      cssOverride={{ ...styles.content, ...cssOverride }}
      {...rest}
    >
      {children}
    </PopoverContent>
  );
});

ColorPickerContent.displayName = 'ColorPickerContent';

const ColorPickerArea = () => {
  const { value, onValueChange, alpha } = useColorPicker();
  const Picker = alpha ? HexAlphaColorPicker : HexColorPicker;

  return (
    <div css={scoped(styles.area)}>
      <Picker color={value || FALLBACK_COLOR} onChange={onValueChange} />
    </div>
  );
};

ColorPickerArea.displayName = 'ColorPickerArea';

type ColorPickerInputProps = Omit<
  ComponentPropsWithoutRef<typeof Input>,
  'value' | 'onChange' | 'type'
>;

const ColorPickerInput = forwardRef<HTMLInputElement, ColorPickerInputProps>(
  (props, ref) => {
    const { value, onValueChange, alpha, disabled } = useColorPicker();
    const [draft, setDraft] = useState(value);

    useEffect(() => {
      setDraft((current) => {
        return normalizeHex(current) === value ? current : value;
      });
    }, [value]);

    const handleChange = (next: string) => {
      setDraft(next);

      if (!next.trim()) {
        onValueChange('');
        return;
      }

      if (isValidHex(next, { alpha })) {
        onValueChange(normalizeHex(next));
      }
    };

    return (
      <Input
        ref={ref}
        value={draft}
        onChange={(event) => handleChange(event.target.value)}
        disabled={disabled}
        spellCheck={false}
        autoComplete="off"
        aria-label={__('Hex color value', 'kirki-ecommerce')}
        {...props}
      />
    );
  },
);

ColorPickerInput.displayName = 'ColorPickerInput';

export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
  ColorPickerValue,
};
export type { ColorPickerProps, ColorPickerTriggerProps };

const styles = defineStyles({
  trigger: {
    ...itemCenter(),
    gap: theme.spacing[2],
    width: '100%',
    minHeight: '36px',
    padding: `${theme.spacing[1]} ${theme.spacing[3]}`,
    backgroundColor: theme.colors.background.fill,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.lg,
    cursor: 'pointer',
    textAlign: 'left',
    '&:focus-visible': {
      borderColor: theme.colors.border.default,
      ...uiFocusRing(theme as Theme),
    },
    '&[data-error="true"]': {
      borderColor: theme.colors.border.critical,
      boxShadow: 'none',
      '&:focus-visible': {
        ...uiFocusRing(theme as Theme, theme.colors.border.critical),
      },
    },
    '&:disabled': {
      backgroundColor: theme.colors.background.surfaceAlt,
      borderColor: 'transparent',
      cursor: 'not-allowed',
      opacity: 0.8,
    },
  },
  swatch: {
    flexShrink: 0,
    width: '16px',
    height: '16px',
    borderRadius: theme.radius.full,
    border: `1px solid ${theme.colors.border.default}`,
    backgroundColor: 'var(--kirki-picker-swatch)',
  },
  swatchEmpty: {
    backgroundColor: theme.colors.background.surfaceAlt,
    backgroundImage: `linear-gradient(to top right, transparent calc(50% - 1px), ${theme.colors.border.hover} calc(50% - 1px), ${theme.colors.border.hover} calc(50% + 1px), transparent calc(50% + 1px))`,
  },
  value: {
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  valueEmpty: {
    color: theme.colors.text.secondary,
  },
  content: {
    rowGap: theme.spacing[3],
  },
  area: {
    '.react-colorful': {
      width: '100%',
      height: '176px',
      gap: theme.spacing[3],
    },
    '.react-colorful__saturation': {
      borderRadius: theme.radius.md,
      borderBottom: 'none',
    },
    '.react-colorful__hue, .react-colorful__alpha': {
      height: '12px',
      borderRadius: theme.radius.full,
    },
    '.react-colorful__pointer': {
      width: '14px',
      height: '14px',
    },
  },
});
