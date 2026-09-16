import type { CSSObject } from '@emotion/react';
import { Plus } from 'lucide-react';
import { type ReactNode, useRef, useState } from 'react';
import { Controller, type FieldPath, type FieldValues, useFormContext } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import Text from '@/components/ui/text';
import Textarea from '@/components/ui/textarea';
import { usePagesQuery } from '@/features/settings/advanced/services/page-settings';
import {
  insertTokenAtCursor,
  type Selection,
  slugToToken,
} from '@/features/settings/legal/lib/token-insert';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ConsentMessageFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label?: ReactNode;
  description?: ReactNode;
  infoText?: ReactNode;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const ConsentMessageField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  description,
  infoText,
  placeholder,
  rows = 5,
  disabled,
  cssOverride,
}: ConsentMessageFieldProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const fieldId = String(name);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  /**
   * `pageKeys.lists()` does not include params, so every caller must pass the
   * same ones or they share a cache entry built under different filters.
   * `{ status: 'publish' }` matches the advanced settings page table, and
   * matches what the backend resolves tokens against.
   */
  const { data: pages = [], isLoading } = usePagesQuery({ status: 'publish' });

  const rememberSelection = () => {
    const node = textareaRef.current;

    if (!node) {
      return;
    }

    selectionRef.current = { start: node.selectionStart, end: node.selectionEnd };
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const insertPageToken = (slug: string) => {
          const { text, caret } = insertTokenAtCursor(
            String(field.value ?? ''),
            slugToToken(slug),
            selectionRef.current,
          );

          field.onChange(text);
          selectionRef.current = { start: caret, end: caret };
          setIsPickerOpen(false);

          // The DOM value has to be React's before the caret can be moved.
          requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(caret, caret);
          });
        };

        return (
          <Field data-invalid={fieldState.invalid || undefined} cssOverride={cssOverride}>
            {label && (
              <FieldLabel htmlFor={fieldId} infoText={infoText}>
                {label}
              </FieldLabel>
            )}

            <Popover open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <div css={scoped(styles.wrapper)}>
                <Textarea
                  {...field}
                  ref={(node) => {
                    textareaRef.current = node;
                    field.ref(node);
                  }}
                  id={fieldId}
                  value={field.value ?? ''}
                  placeholder={placeholder}
                  rows={rows}
                  disabled={disabled}
                  error={Boolean(fieldState.error)}
                  aria-invalid={fieldState.invalid}
                  cssOverride={styles.textarea}
                  onSelect={rememberSelection}
                  onKeyUp={rememberSelection}
                  onClick={rememberSelection}
                  onBlur={() => {
                    rememberSelection();
                    field.onBlur();
                  }}
                />

                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={disabled}
                    aria-label={__('Insert a page link', 'kirki-ecommerce')}
                    cssOverride={styles.trigger}
                  >
                    <Plus />
                  </Button>
                </PopoverTrigger>
              </div>

              <PopoverContent
                align="end"
                onCloseAutoFocus={(event) => {
                  // Radix would otherwise return focus to the trigger and
                  // undo the caret restoration above.
                  event.preventDefault();
                }}
              >
                <Flex direction="column" gap={1} cssOverride={styles.pageList}>
                  {isLoading && (
                    <Text variant="small" color="subdued">
                      {__('Loading pages…', 'kirki-ecommerce')}
                    </Text>
                  )}

                  {!isLoading && pages.length === 0 && (
                    <Text variant="small" color="subdued">
                      {__('No published pages found', 'kirki-ecommerce')}
                    </Text>
                  )}

                  {pages.map((page) => (
                    <button
                      key={page.id}
                      type="button"
                      css={scoped(styles.pageOption)}
                      onClick={() => insertPageToken(page.slug)}
                    >
                      {page.title}
                    </button>
                  ))}
                </Flex>
              </PopoverContent>
            </Popover>

            {description && <FieldDescription>{description}</FieldDescription>}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
};

ConsentMessageField.displayName = 'ConsentMessageField';

export default ConsentMessageField;

const styles = defineStyles({
  wrapper: {
    position: 'relative',
  },
  textarea: {
    paddingBottom: theme.spacing[10],
  },
  trigger: {
    position: 'absolute',
    right: theme.spacing[2],
    bottom: theme.spacing[2],
  },
  pageList: {
    maxHeight: '240px',
    overflowY: 'auto',
  },
  pageOption: {
    all: 'unset',
    boxSizing: 'border-box',
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    borderRadius: theme.radius.md,
    cursor: 'pointer',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    '&:hover, &:focus-visible': {
      backgroundColor: theme.colors.background.surfaceAlt,
    },
  },
});
