import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  Controller,
  type FieldPath,
  type FieldValues,
  useFormContext,
} from 'react-hook-form';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Field, FieldError } from '@/components/ui/field';
import Flex from '@/components/ui/flex';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Text from '@/components/ui/text';
import ShippingBoxPreview from '@/features/settings/shipping/components/shipping-box-preview/shipping-box-preview';
import ShippingBoxDialog from '@/features/settings/shipping/pages/shipping-box/shipping-box-dialog';
import { useShippingBoxesQuery } from '@/features/settings/shipping/services/shipping';
import { EyeClosedIcon, EyeIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type ShippingBoxListItem = {
  value: number | string;
  title: string;
  length: number;
  width: number;
  height: number;
  unit: string;
};

type ShippingBoxFieldBaseProps = {
  compact?: boolean;
  onFieldChange?: (value: unknown, fieldName: string) => void;
};

type ShippingBoxFieldControlledProps = ShippingBoxFieldBaseProps & {
  name?: never;
  value?: number | string | null;
  onChange?: (value: unknown, fieldName: string) => void;
};

type ShippingBoxFieldRhfProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ShippingBoxFieldBaseProps & {
  name: TName;
  value?: never;
  onChange?: never;
};

type ShippingBoxFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | ShippingBoxFieldControlledProps
  | ShippingBoxFieldRhfProps<TFieldValues, TName>;

const useShippingBoxList = (): ShippingBoxListItem[] => {
  const { data: shippingBoxes } = useShippingBoxesQuery({ limit: -1 });

  return (shippingBoxes ?? []).map((item) => ({
    value: item.id,
    title: `${item.name} - ${item.length} × ${item.width} × ${item.height} ${item.unit}`,
    length: Number(item.length) || 0,
    width: Number(item.width) || 0,
    height: Number(item.height) || 0,
    unit: String(item.unit || 'in'),
  }));
};

type ShippingBoxFieldViewProps = {
  selectedValue: string;
  shippingBoxList: ShippingBoxListItem[];
  compact: boolean;
  error?: boolean;
  invalid?: boolean;
  errorObject?: { message?: string };
  onValueChange: (next: string) => void;
  onSaveNewBox: (id?: number) => void;
};

const ShippingBoxFieldView = ({
  selectedValue,
  shippingBoxList,
  compact,
  error,
  invalid,
  errorObject,
  onValueChange,
  onSaveNewBox,
}: ShippingBoxFieldViewProps) => {
  const [showPreview, setShowPreview] = useState(true);
  const [selectOpen, setSelectOpen] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);

  const selectedBox = shippingBoxList.find(
    (item) => String(item.value) === selectedValue,
  );
  const hasShippingBoxes = shippingBoxList.length > 0;

  const handleOpenCreate = () => {
    setSelectOpen(false);
    setOpenCreateDialog(true);
  };

  const selectControl = (
    <Select
      value={selectedValue}
      onValueChange={onValueChange}
      open={selectOpen}
      onOpenChange={setSelectOpen}
    >
      <SelectTrigger
        error={error}
        aria-invalid={invalid}
        variant={compact ? 'invisible' : 'default'}
      >
        <SelectValue
          placeholder={__('Select shipping box', 'kirki-ecommerce')}
        />
      </SelectTrigger>
      <SelectContent position={hasShippingBoxes ? 'item-aligned' : 'popper'}>
        {shippingBoxList.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.title}
          </SelectItem>
        ))}
        {hasShippingBoxes && <SelectSeparator />}
        <ActionGroup cssOverride={styles.footer}>
          <Button
            variant="secondary"
            onClick={handleOpenCreate}
          >
            <Plus size={16} />
            {__('Add new shipping box', 'kirki-ecommerce')}
          </Button>
        </ActionGroup>
      </SelectContent>
    </Select>
  );

  const dialog = openCreateDialog ? (
    <ShippingBoxDialog
      isOpen={openCreateDialog}
      onSave={(saveValue) => {
        onSaveNewBox(saveValue);
      }}
      onClose={() => {
        setOpenCreateDialog(false);
      }}
    />
  ) : null;

  if (compact) {
    return (
      <>
        {selectControl}
        {dialog}
      </>
    );
  }

  return (
    <Field data-invalid={invalid || undefined}>
      <Card cssOverride={mergeCss(cardStyles.innerCard, styles.fieldsetCard)}>
        <CardContent cssOverride={styles.fieldsetContent}>
          <Flex cssOverride={styles.legendRow}>
            <span css={scoped(styles.labelBackground)}>
              <Text weight="medium">
                {__('Shipping Box', 'kirki-ecommerce')}
              </Text>
            </span>
            <ActionGroup>
              <span css={scoped(styles.actionBackground)}>
                <Button
                  variant="secondary"
                  type="button"
                  aria-label={
                    showPreview
                      ? __('Hide shipping box preview', 'kirki-ecommerce')
                      : __('Show shipping box preview', 'kirki-ecommerce')
                  }
                  onClick={() => {
                    setShowPreview((prev) => !prev);
                  }}
                >
                  {showPreview ? <EyeIcon /> : <EyeClosedIcon />}
                </Button>
              </span>
            </ActionGroup>
          </Flex>
          <Flex gap={2} direction="column">
            {selectControl}
          </Flex>
          {showPreview && (
            <div css={scoped(styles.previewArea)}>
              <ShippingBoxPreview
                length={selectedBox?.length ?? 0}
                width={selectedBox?.width ?? 0}
                height={selectedBox?.height ?? 0}
                unit={selectedBox?.unit ?? 'in'}
              />
            </div>
          )}
        </CardContent>
      </Card>
      {invalid && errorObject && <FieldError errors={[errorObject]} />}
      {dialog}
    </Field>
  );
};

ShippingBoxFieldView.displayName = 'ShippingBoxFieldView';

const ShippingBoxFieldRhf = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  compact = false,
  onFieldChange,
}: ShippingBoxFieldRhfProps<TFieldValues, TName>) => {
  const { control } = useFormContext<TFieldValues>();
  const shippingBoxList = useShippingBoxList();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selectedValue =
          field.value !== null && field.value !== undefined
            ? String(field.value)
            : '';

        const handleChange = (nextValue: unknown) => {
          field.onChange(nextValue === '' ? null : nextValue);
          onFieldChange?.(nextValue, String(name));
        };

        return (
          <ShippingBoxFieldView
            selectedValue={selectedValue}
            shippingBoxList={shippingBoxList}
            compact={compact}
            error={Boolean(fieldState.error)}
            invalid={fieldState.invalid}
            errorObject={fieldState.error}
            onValueChange={(next) => {
              handleChange(next);
            }}
            onSaveNewBox={(saveValue) => {
              handleChange(saveValue);
            }}
          />
        );
      }}
    />
  );
};

ShippingBoxFieldRhf.displayName = 'ShippingBoxFieldRhf';

const ShippingBoxFieldControlled = ({
  value,
  onChange,
  compact = false,
  onFieldChange,
}: ShippingBoxFieldControlledProps) => {
  const shippingBoxList = useShippingBoxList();
  const selectedValue =
    value !== null && value !== undefined ? String(value) : '';

  const handleChange = (nextValue: unknown) => {
    onChange?.(nextValue, 'shipping_box_id');
    onFieldChange?.(nextValue, 'shipping_box_id');
  };

  return (
    <ShippingBoxFieldView
      selectedValue={selectedValue}
      shippingBoxList={shippingBoxList}
      compact={compact}
      onValueChange={(next) => {
        handleChange(next);
      }}
      onSaveNewBox={(saveValue) => {
        handleChange(saveValue);
      }}
    />
  );
};

ShippingBoxFieldControlled.displayName = 'ShippingBoxFieldControlled';

const ShippingBoxField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(
  props: ShippingBoxFieldProps<TFieldValues, TName>,
) => {
  if ('name' in props && props.name) {
    return (
      <ShippingBoxFieldRhf
        name={props.name}
        compact={props.compact}
        onFieldChange={props.onFieldChange}
      />
    );
  }

  return (
    <ShippingBoxFieldControlled
      value={props.value}
      onChange={props.onChange}
      compact={props.compact}
      onFieldChange={props.onFieldChange}
    />
  );
};

ShippingBoxField.displayName = 'ShippingBoxField';

export default ShippingBoxField;

const styles = defineStyles({
  fieldsetCard: {
    position: 'relative',
    overflow: 'visible',
    marginTop: theme.spacing[4],
    paddingTop: theme.spacing[5],
  },
  fieldsetContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing[3],
    padding: theme.spacing[3],
  },
  legendRow: {
    top: '-18px',
    left: '8px',
    right: '8px',
    position: 'absolute',
  },
  labelBackground: {
    backgroundColor: theme.colors.background.surface,
    paddingLeft: theme.spacing[2],
    marginTop: theme.spacing[1],
  },
  actionBackground: {
    backgroundColor: theme.colors.background.surface,
    paddingRight: theme.spacing[2],
  },
  previewArea: {
    backgroundColor: theme.colors.background.surfaceSecondary,
    borderRadius: theme.radius.md,
    height: '230px',
    padding: theme.spacing[1],
  },
  footer: {
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
  },
});
