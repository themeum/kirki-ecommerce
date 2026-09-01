import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FormProvider, type Resolver, useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Flex from '@/components/ui/flex';
import FullPageContainer from '@/components/ui/full-page-container';
import PageHeading from '@/components/ui/page-heading';
import Text from '@/components/ui/text';
import type { FillCommitPayload } from '@/features/bulk-edit/contexts/cell-selection-context';
import { useBulkEditNavigationGuard } from '@/features/bulk-edit/hooks/use-bulk-edit-navigation-guard';
import { useColumnVisibility } from '@/features/bulk-edit/hooks/use-column-visibility';
import { bulkEditColumnGroups, bulkEditColumns } from '@/features/bulk-edit/lib/columns';
import { editableKindOf } from '@/features/bulk-edit/lib/editable-kind';
import { buildBulkEditPayload } from '@/features/bulk-edit/lib/payload';
import BulkEditTable, {
  type BulkEditTableHandle,
} from '@/features/bulk-edit/pages/bulk-edit-table/bulk-edit-table';
import ColumnVisibilityMenu from '@/features/bulk-edit/pages/column-visibility-menu';
import { BulkEditFormSchema } from '@/features/bulk-edit/schemas/forms/bulk-edit-form';
import {
  useBulkVariantsQuery,
  useUpdateBulkVariantsMutation,
} from '@/features/bulk-edit/services/bulk-edit';
import BulkEditTableSkeleton from '@/features/bulk-edit/skeletons/bulk-edit-table-skeleton';
import type { BulkEditFormValues } from '@/features/bulk-edit/types';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

const parseIds = (raw: string | null): number[] => {
  if (!raw) {
    return [];
  }
  const ids = raw
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isFinite(id) && id > 0);
  return Array.from(new Set(ids));
};

const columnPickerOptions = bulkEditColumns
  .filter((column) => column.id !== 'variant')
  .map((column) => ({ value: column.id!, title: String(column.header) }));

const columnLabelById = new Map(columnPickerOptions.map((option) => [option.value, option.title]));

const columnVisibilityGroups = bulkEditColumnGroups.map((group) => ({
  ...group,
  columns: group.columnIds.map((id) => ({ id, label: columnLabelById.get(id) ?? id })),
}));

const UNIT_PRICE_FIELDS = [
  'total_unit_amount',
  'total_unit',
  'base_unit_amount',
  'base_unit',
] as const;

const cellKindByField = new Map(
  bulkEditColumns.map((column) => [column.id, column.meta?.cellKind]),
);

const coerceTypedValue = (field: string, char: string): string | number | null => {
  const kind = editableKindOf(cellKindByField.get(field));
  if (kind === 'text') {
    return char;
  }
  if (kind === 'number' || kind === 'money') {
    return /^[0-9]$/.test(char) ? Number(char) : null;
  }
  return null;
};

const BulkEditPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ids = useMemo(() => parseIds(searchParams.get('ids')), [searchParams]);

  const { data: bulkData, isLoading } = useBulkVariantsQuery(ids);
  const { mutate: updateBulkVariants, isPending } = useUpdateBulkVariantsMutation();
  const [columnVisibility, setColumnVisibility] = useColumnVisibility();
  const tableRef = useRef<BulkEditTableHandle>(null);
  const hasLoadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  /**
   * The schema only validates a subset of variant fields (notably the sale
   * <= regular-price rule) and is never used to reshape the payload — that
   * happens separately in buildBulkEditPayload — so its inferred output type
   * legitimately diverges from BulkEditFormValues. The resolver's job here is
   * producing formState.errors, not typing the form.
   */
  const form = useForm<BulkEditFormValues>({
    resolver: zodResolver(BulkEditFormSchema) as unknown as Resolver<BulkEditFormValues>,
    defaultValues: { variants: [] },
  });
  const { formState, trigger, getValues, setValue, reset } = form;

  useEffect(() => {
    if (bulkData && !hasLoadedRef.current) {
      reset({ variants: bulkData });
      hasLoadedRef.current = true;
      setLoaded(true);
    }
  }, [bulkData, reset]);

  const isDirty = formState.isDirty;
  const { isBlocked, discardChanges, dismissToast } = useBulkEditNavigationGuard(isDirty);

  const handleFillCommit = (payload: FillCommitPayload) => {
    const sourceVariant = getValues(`variants.${payload.sourceRow}`);
    const targetRows = payload.rows.filter((row) => row !== payload.sourceRow);

    if (payload.field === 'base_price_per_unit') {
      targetRows.forEach((row) => {
        UNIT_PRICE_FIELDS.forEach((key) => {
          setValue(`variants.${row}.${key}` as never, sourceVariant[key] as never, {
            shouldDirty: true,
          });
        });
      });
      return;
    }

    if (payload.field === 'weight') {
      targetRows.forEach((row) => {
        setValue(`variants.${row}.weight` as never, sourceVariant.weight as never, {
          shouldDirty: true,
        });
        setValue(`variants.${row}.weight_unit` as never, sourceVariant.weight_unit as never, {
          shouldDirty: true,
        });
      });
      return;
    }

    const sourceValue = (sourceVariant as unknown as Record<string, unknown>)[payload.field];
    targetRows.forEach((row) => {
      setValue(`variants.${row}.${payload.field}` as never, sourceValue as never, {
        shouldDirty: true,
      });
    });
  };

  const handleTypeToEdit = (field: string, rows: number[], char: string) => {
    const value = coerceTypedValue(field, char);
    if (value === null) {
      return;
    }
    rows.forEach((row) => {
      setValue(`variants.${row}.${field}` as never, value as never, { shouldDirty: true });
    });
  };

  const handleSpaceToggle = (field: string, rows: number[]) => {
    const [primaryRow] = rows;
    const next = !getValues(`variants.${primaryRow}.${field}` as never);
    rows.forEach((row) => {
      setValue(`variants.${row}.${field}` as never, next as never, { shouldDirty: true });
    });
  };

  const handleSave = async () => {
    const valid = await trigger();

    if (!valid) {
      const variantErrors = formState.errors.variants;
      const errorList = Array.isArray(variantErrors) ? variantErrors : [];
      const firstInvalidIndex = errorList.findIndex((error) => Boolean(error));
      const invalidCount = errorList.filter(Boolean).length;

      toast.error(
        sprintf(
          _n(
            '%d row has an invalid value.',
            '%d rows have invalid values.',
            invalidCount,
            'kirki-ecommerce',
          ),
          invalidCount,
        ),
      );

      if (firstInvalidIndex >= 0) {
        tableRef.current?.scrollToRow(firstInvalidIndex);
      }
      return;
    }

    const payload = buildBulkEditPayload(getValues('variants'));
    updateBulkVariants(payload, {
      onSuccess: (response) => {
        reset({ variants: response.data });
      },
    });
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
      return;
    }
    void navigate(-1);
  };

  const handleConfirmDiscard = () => {
    setShowCancelConfirm(false);
    reset();
    void navigate(-1);
  };

  const visibleColumnIds = columnPickerOptions
    .map((option) => option.value)
    .filter((id) => columnVisibility[id] !== false);

  const handleColumnToggle = (columnId: string) => {
    const isVisible = columnVisibility[columnId] !== false;
    setColumnVisibility({ ...columnVisibility, [columnId]: !isVisible });
  };

  const isEmptySelection = ids.length === 0;
  const variants = getValues('variants');

  return (
    <>
      <PageHeading
        text={sprintf(
          _n('Editing %d variant', 'Editing %d variants', variants.length, 'kirki-ecommerce'),
          variants.length,
        )}
        cssOverride={styles.heading}
        size="fullWidth"
        hasBack
        noMargin
        buttonProps={{ variant: 'outline', size: 'icon' }}
        backIcon={<ChevronLeft size={16} aria-hidden="true" />}
        onBack={(event) => {
          event.preventDefault();
          handleCancel();
        }}
        actions={
          !isEmptySelection && (
            <>
              <ColumnVisibilityMenu
                groups={columnVisibilityGroups}
                visibleColumnIds={visibleColumnIds}
                onToggle={handleColumnToggle}
              />
              <Button
                variant="primary"
                onClick={handleSave}
                loading={isPending}
                disabled={!isDirty}
              >
                {__('Save', 'kirki-ecommerce')}
              </Button>
            </>
          )
        }
      >
        {isDirty && <Badge variant="secondary">{__('Unsaved Changes', 'kirki-ecommerce')}</Badge>}
      </PageHeading>

      <FullPageContainer cssOverride={styles.pageBackground}>
        {isEmptySelection ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap={3}
            cssOverride={styles.emptyState}
          >
            <Text weight="medium">{__('No variants selected', 'kirki-ecommerce')}</Text>
            <Text color="secondary">
              {__(
                'Select one or more variants first, then open Bulk Edit again.',
                'kirki-ecommerce',
              )}
            </Text>
            <Button variant="secondary" onClick={() => navigate(-1)}>
              {__('Go back', 'kirki-ecommerce')}
            </Button>
          </Flex>
        ) : loaded && !isLoading ? (
          <Card
            cssOverride={mergeCss(styles.tableCard, {
              borderRadius: 0,
            })}
          >
            <FormProvider {...form}>
              <BulkEditTable
                ref={tableRef}
                variants={variants}
                columnVisibility={columnVisibility}
                onColumnVisibilityChange={(updater) =>
                  setColumnVisibility(
                    typeof updater === 'function' ? updater(columnVisibility) : updater,
                  )
                }
                onFillCommit={handleFillCommit}
                onTypeToEdit={handleTypeToEdit}
                onSpaceToggle={handleSpaceToggle}
              />
            </FormProvider>
          </Card>
        ) : (
          <Card cssOverride={styles.tableCard}>
            <BulkEditTableSkeleton rowCount={ids.length || undefined} />
          </Card>
        )}
      </FullPageContainer>

      {isBlocked && (
        <ConfirmationDialog
          variant="warning"
          title={__('Discard unsaved changes?', 'kirki-ecommerce')}
          subtitle={__(
            'You have unsaved changes on this page. Leaving now will discard them.',
            'kirki-ecommerce',
          )}
          onConfirm={discardChanges}
          onCancel={dismissToast}
        />
      )}

      {showCancelConfirm && (
        <ConfirmationDialog
          variant="warning"
          title={__('Discard unsaved changes?', 'kirki-ecommerce')}
          subtitle={__(
            'You have unsaved changes on this page. Leaving now will discard them.',
            'kirki-ecommerce',
          )}
          onConfirm={handleConfirmDiscard}
          onCancel={() => setShowCancelConfirm(false)}
        />
      )}
    </>
  );
};

BulkEditPage.displayName = 'BulkEditPage';

export default BulkEditPage;

const styles = defineStyles({
  heading: {
    padding: `${theme.spacing[4]} ${theme.spacing[3]}`,
    backgroundColor: theme.colors.background.surface,
    borderBottom: `1px solid ${theme.colors.background.surfaceTertiary}`,
    columnGap: theme.spacing[2],
  },
  // Other pages never paint their own page background — they inherit the
  // WP admin content area's own background. FullPageContainer's default
  // fills the whole page white; this restores the inherited background so
  // only the table card below reads as a distinct white surface.
  pageBackground: {
    backgroundColor: 'transparent',
  },
  tableCard: mergeCss(cardStyles.tableCard, cardStyles.shadowCard),
  emptyState: {
    padding: theme.spacing[12],
    minHeight: '50vh',
  },
});
