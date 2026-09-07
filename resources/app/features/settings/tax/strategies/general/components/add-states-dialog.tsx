import { zodResolver } from '@hookform/resolvers/zod';
import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Checkbox from '@/components/ui/checkbox';
import {
  Dialog,
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import Input from '@/components/ui/input';
import Label from '@/components/ui/label';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import { getSearchedValue } from '@/features/settings/lib/utils';
import type { TaxRegionState } from '@/features/settings/tax/shared/lib/utils';
import {
  type AddStatesPopupFormInput,
  AddStatesPopupFormSchema,
} from '@/features/settings/tax/strategies/general/schemas/forms/add-states-popup-form';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type AddStatesPopupProps = {
  openPopup: boolean;
  setOpenPopup: (open: boolean) => void;
  countryName?: string;
  stateList?: TaxRegionState[];
  disabledIds?: Set<string>;
  selectedStates: TaxRegionState[];
  setSelectedStates: Dispatch<SetStateAction<TaxRegionState[]>>;
  onAdd: () => void;
};

const AddStatesPopup = (props: AddStatesPopupProps) => {
  const {
    openPopup,
    setOpenPopup,
    countryName,
    stateList,
    disabledIds,
    selectedStates,
    setSelectedStates,
    onAdd,
  } = props;

  const [searchValue, setSearchValue] = useState('');

  const form = useForm<AddStatesPopupFormInput>({
    resolver: zodResolver(AddStatesPopupFormSchema),
    defaultValues: {
      selectedStates,
    },
  });

  const formSelectedStates = form.watch('selectedStates') as TaxRegionState[];

  useEffect(() => {
    if (!openPopup) {
      return;
    }

    form.reset({ selectedStates });
    setSearchValue('');
  }, [form, openPopup, selectedStates]);

  const syncSelection = (next: TaxRegionState[]) => {
    form.setValue('selectedStates', next, { shouldDirty: true });
    setSelectedStates(next);
  };

  const isDisabled = (state: TaxRegionState) => Boolean(disabledIds?.has(String(state.id)));

  const selectableStates = useMemo(
    () => (stateList ?? []).filter((state) => !disabledIds?.has(String(state.id))),
    [stateList, disabledIds],
  );

  const selectAll =
    formSelectedStates.length > 0 && formSelectedStates.length === selectableStates.length;

  const isPartialChecked =
    formSelectedStates.length > 0 && formSelectedStates.length < selectableStates.length;

  const handleToggleState = (state: TaxRegionState) => {
    if (isDisabled(state)) {
      return;
    }

    const current = form.getValues('selectedStates') as TaxRegionState[];
    const exists = current.some((c) => String(c.id) === String(state.id));
    const next = exists
      ? current.filter((c) => String(c.id) !== String(state.id))
      : [...current, state];
    syncSelection(next);
  };

  const filteredStates = getSearchedValue(searchValue, stateList ?? []);

  const handleSelectAll = () => {
    if (isPartialChecked) {
      syncSelection([]);
      return;
    }

    syncSelection(selectAll ? [] : [...selectableStates]);
  };

  const buttonState = formSelectedStates?.length <= 0;

  const handleSubmit = () => {
    onAdd();
  };

  return (
    <Dialog
      open={openPopup}
      onOpenChange={(next) => {
        if (!next) {
          setOpenPopup(false);
        }
      }}
    >
      <DialogContent>
        <DialogCloseButton />
        <DialogHeader>
          <DialogTitle>{__('Add states', 'kirki-ecommerce')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <DialogBody>
            <Flex direction="column" gap={2}>
              <Label htmlFor="add-states-search">{__('States', 'kirki-ecommerce')}</Label>
              <Input
                id="add-states-search"
                type="search"
                placeholder="Search"
                onChange={(e) => setSearchValue(e.target.value)}
              />
            </Flex>

            <Card cssOverride={cardStyles.tableCardRounded}>
              <CardContent cssOverride={mergeCss(cardStyles.tableContent, styles.cardContent)}>
                <Flex gap={2} align="center">
                  <Checkbox
                    id="add-states-select-all"
                    checked={isPartialChecked ? 'indeterminate' : selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="add-states-select-all">{countryName}</Label>
                </Flex>

                {filteredStates?.length > 0 ? (
                  filteredStates.map((state) => {
                    const disabled = isDisabled(state);
                    const stateRowContent = (
                      <>
                        <Checkbox
                          id={`add-states-state-${state.id}`}
                          disabled={disabled}
                          checked={
                            disabled ||
                            formSelectedStates.some((item) => String(item.id) === String(state.id))
                          }
                          onCheckedChange={() => handleToggleState(state)}
                        />
                        <Label htmlFor={`add-states-state-${state.id}`}>
                          {state.name ?? state.title}
                        </Label>
                      </>
                    );

                    return (
                      <div key={String(state.id)} css={scoped(styles.checkboxItemIndented)}>
                        {disabled ? (
                          <Tooltip
                            tip={__('Already in use', 'kirki-ecommerce')}
                            position="right"
                            cssOverride={styles.disabledRowTrigger}
                          >
                            <Flex gap={2} align="center">
                              {stateRowContent}
                            </Flex>
                          </Tooltip>
                        ) : (
                          <Flex gap={2} align="center">
                            {stateRowContent}
                          </Flex>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <Card cssOverride={styles.emptyStatesCard}>
                    <CardContent>
                      <Flex direction="column" gap={2} align="center">
                        <Text weight="medium">{__('No states available')}</Text>
                      </Flex>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </DialogBody>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedStates(selectedStates);
                setOpenPopup(false);
              }}
            >
              {__('Cancel', 'kirki-ecommerce')}
            </Button>
            <Button
              variant="primary"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={buttonState}
            >
              {__('Done', 'kirki-ecommerce')}
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

AddStatesPopup.displayName = 'AddStatesPopup';

export default AddStatesPopup;

const styles = defineStyles({
  cardContent: {
    height: '350px',
    overflowX: 'hidden',
    overflowY: 'scroll',
    paddingLeft: theme.spacing[3],
    paddingTop: theme.spacing[3],
  },
  checkboxItemIndented: {
    width: 'auto',
    padding: `${theme.spacing[2]} ${theme.spacing[5]}`,
    '&:hover': {
      background: theme.colors.background.surfaceSecondary,
      borderRadius: theme.radius.sm,
    },
  },
  emptyStatesCard: {
    padding: `${theme.spacing[9]} 0`,
  },
  disabledRowTrigger: {
    display: 'flex',
    width: '100%',
    cursor: 'not-allowed',
  },
});
