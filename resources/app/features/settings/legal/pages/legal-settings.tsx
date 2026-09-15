import { ScaleIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import ActionGroup from '@/components/ui/action-group';
import Alert from '@/components/ui/alert';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import EmptyState from '@/components/ui/empty-state';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import {
  consentLocationLabels,
  hasEnabledSignupConsent,
  removeConsent,
  sortLocations,
  toggleConsent,
  upsertConsent,
} from '@/features/settings/legal/lib/utils';
import ConsentDialog from '@/features/settings/legal/pages/consent-dialog';
import type { Consent } from '@/features/settings/legal/schemas/catalog/legal';
import type { ConsentFormPayload } from '@/features/settings/legal/schemas/forms/consent-form';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import StackedListSkeleton from '@/features/settings/skeletons/stacked-list-skeleton';
import { useConfirmDelete } from '@/hooks';
import { EditPenIcon, TrashIcon } from '@/icons';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss } from '@/theme/mixins';
import { uuid } from '@/utils';
import { dispatchToastMessage } from '@/utils/common';
import { __ } from '@/wpi18n';

const LegalSettings = () => {
  const { data: legalSettings, isLoading } = useSettingsQuery('legal');
  const { mutateAsync: updateSettings, isPending: isSaving } = useUpdateSettingsMutation<'legal'>();
  const { confirmDelete, deleteConfirmation } = useConfirmDelete();

  const [consents, setConsents] = useState<Consent[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConsent, setEditingConsent] = useState<Consent | null>(null);

  /**
   * The delete flow's `onSuccess` fires after the undo window closes, well
   * after the render that scheduled it. Reading previous state from a ref
   * rather than a closed-over value is what stops that late write from
   * resurrecting a consent the merchant toggled in the meantime.
   */
  const consentsRef = useRef<Consent[]>([]);

  useEffect(() => {
    const next = legalSettings?.consents ?? [];

    setConsents(next);
    consentsRef.current = next;
  }, [legalSettings]);

  const commit = useCallback(
    async (updater: (previous: Consent[]) => Consent[]) => {
      const previous = consentsRef.current;
      const next = updater(previous);

      setConsents(next);
      consentsRef.current = next;

      try {
        await updateSettings({ key: 'legal', data: { consents: next } });
      } catch {
        // useUpdateSettingsMutation already surfaces the error.
        setConsents(previous);
        consentsRef.current = previous;
      }
    },
    [updateSettings],
  );

  const visibleConsents = useMemo(
    () => consents.filter((consent) => !removedIds.includes(consent.id)),
    [consents, removedIds],
  );

  const locationLabels = consentLocationLabels();

  const showRegistrationWarning =
    legalSettings?.is_registration_enabled === false && hasEnabledSignupConsent(visibleConsents);

  const handleAdd = () => {
    setEditingConsent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (consent: Consent) => {
    setEditingConsent(consent);
    setIsDialogOpen(true);
  };

  const handleSave = (payload: ConsentFormPayload) => {
    const consent: Consent = {
      ...(editingConsent ?? {}),
      id: editingConsent?.id ?? uuid(),
      title: payload.title,
      message: payload.message,
      method: payload.method,
      locations: payload.locations,
      is_enabled: editingConsent?.is_enabled ?? true,
    };

    void commit((previous) => upsertConsent(previous, consent));
    setIsDialogOpen(false);
    setEditingConsent(null);
  };

  const handleToggle = (consent: Consent) => {
    void commit((previous) => toggleConsent(previous, consent.id));
  };

  const handleDelete = (consent: Consent) => {
    confirmDelete(
      {
        title: __('Delete this consent?', 'kirki-ecommerce'),
        description: __(
          'This consent will stop being shown to customers everywhere it appears. This cannot be undone.',
          'kirki-ecommerce',
        ),
      },
      () => {
        setRemovedIds((previous) => [...previous, consent.id]);

        dispatchToastMessage('delete', {
          title: __('Consent deleted', 'kirki-ecommerce'),
          duration: 5000,
          undoAction: () => {
            setRemovedIds((previous) => previous.filter((id) => id !== consent.id));
          },
          onSuccess: () => {
            void commit((previous) => removeConsent(previous, consent.id));
            setRemovedIds((previous) => previous.filter((id) => id !== consent.id));
          },
        });
      },
    );
  };

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader icon={<ScaleIcon />} title={__('Legal', 'kirki-ecommerce')} />

        <Card
          data-search-id="legal.consents"
          data-search-keywords="gdpr, consent, terms and conditions, privacy policy, agreement, opt-in, compliance, checkbox, marketing emails"
          cssOverride={cardStyles.formCard}
        >
          <CardContent>
            <Flex direction="column" gap={4}>
              <HeaderActionsCard
                header={__('Legal Consents', 'kirki-ecommerce')}
                subHeader={__('Add consent messages customers must accept', 'kirki-ecommerce')}
                buttonText={__('Add', 'kirki-ecommerce')}
                onAdd={handleAdd}
              />

              {showRegistrationWarning && (
                <Alert
                  type="warning"
                  text={__(
                    'A consent is set to show on the signup page, but customer registration is turned off in WordPress. It will not be displayed until registration is enabled.',
                    'kirki-ecommerce',
                  )}
                />
              )}

              {isLoading && <StackedListSkeleton rowCount={2} actionCount={3} />}

              {!isLoading && visibleConsents.length === 0 && (
                <EmptyState
                  icon={<ScaleIcon size={20} />}
                  text={__('Consents will be shown here', 'kirki-ecommerce')}
                />
              )}

              {!isLoading && visibleConsents.length > 0 && (
                <StackedItems>
                  {visibleConsents.map((consent) => {
                    const isEnabled = consent.is_enabled ?? true;
                    const locations = sortLocations(consent.locations ?? []);

                    return (
                      <StackedItem
                        key={consent.id}
                        id={consent.id}
                        cssOverride={mergeCss(!isEnabled && styles.mutedRow)}
                      >
                        <StackedItemMedia>
                          <ScaleIcon size={16} />
                        </StackedItemMedia>

                        <StackedItemContent>
                          <StackedItemTitle>
                            <Text variant="small" weight="medium">
                              {consent.title}
                            </Text>
                            {!isEnabled && (
                              <Badge variant="secondary">
                                {__('Disabled', 'kirki-ecommerce')}
                              </Badge>
                            )}
                          </StackedItemTitle>
                        </StackedItemContent>

                        <StackedItemActions>
                          {locations.length > 0 && (
                            <Flex gap={1} align="center" data-right-text="true">
                              {locations.map((location) => (
                                <Badge key={location} variant="secondary">
                                  {locationLabels[location]}
                                </Badge>
                              ))}
                            </Flex>
                          )}

                          <ActionGroup>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={__('Delete', 'kirki-ecommerce')}
                              cssOverride={mergeCss(styles.actionButton, {
                                '& svg': { color: theme.colors.icon.critical },
                              })}
                              onClick={() => handleDelete(consent)}
                            >
                              <TrashIcon />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={__('Edit', 'kirki-ecommerce')}
                              cssOverride={styles.actionButton}
                              onClick={() => handleEdit(consent)}
                            >
                              <EditPenIcon />
                            </Button>
                            <Switch
                              checked={isEnabled}
                              disabled={isSaving}
                              onCheckedChange={() => handleToggle(consent)}
                              aria-label={__('Enable consent', 'kirki-ecommerce')}
                            />
                          </ActionGroup>
                        </StackedItemActions>
                      </StackedItem>
                    );
                  })}
                </StackedItems>
              )}
            </Flex>
          </CardContent>
        </Card>
      </Flex>

      {isDialogOpen && (
        <ConsentDialog
          isOpen={isDialogOpen}
          selectedItem={editingConsent}
          isSaving={isSaving}
          onClose={() => {
            setIsDialogOpen(false);
            setEditingConsent(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteConfirmation}
    </Container>
  );
};

LegalSettings.displayName = 'LegalSettings';

export default LegalSettings;

const styles = defineStyles({
  mutedRow: {
    '& [data-slot="item-title"], & [data-slot="item-media"]': {
      opacity: 0.55,
    },
  },
  actionButton: {
    padding: theme.spacing[1],
  },
});
