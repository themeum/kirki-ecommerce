import HeaderActionsCard from '@/components/header-actions-card';
import OptionAccordion from '@/components/option-accordion';
import { RegionsDialog } from '@/components/regions-dialog';
import ActionGroup from '@/components/ui/action-group';
import Badge from '@/components/ui/badge';
import Button from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
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
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { useShippingSettings } from '@/features/settings/shipping/hooks/use-shipping-settings';
import {
  getShippingMethodRightText,
  getShippingMethodSubText,
  getShippingZoneSummary,
  shippingMethodIconMap,
} from '@/features/settings/shipping/lib/utils';
import ShippingBox from '@/features/settings/shipping/pages/shipping-box/shipping-box';
import ShippingProfile from '@/features/settings/shipping/pages/shipping-profile/shipping-profile';
import ShippingZoneActions from '@/features/settings/shipping/pages/shipping-zone-actions';
import ShippingSettingsSkeleton from '@/features/settings/shipping/skeletons/shipping-settings-skeleton';
import { EditPenIcon, LocationIcon, TrashIcon, TruckIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { getSelectedRegionTags } from '@/utils/region';
import { __, sprintf } from '@/wpi18n';

const MAX_VISIBLE_REGION_FLAGS = 3;

const ShippingSettings = () => {
  const {
    form,
    loaded,
    shippingZonesObj,
    countryList,
    usedRegions,
    showCreateZonePopup,
    setShowCreateZonePopup,
    popupErrors,
    isSaving,
    getShippingMethodData,
    handleToggleMethod,
    handleEditMethod,
    handleDeleteMethod,
    handleToggleZoneItem,
    handleDeleteItem,
    handleCreateZone,
  } = useShippingSettings();

  return (
    <>
      {loaded ? (
        <Container size="sm">
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader icon={<TruckIcon />} title={__('Shipping', 'kirki-ecommerce')} />
              <Card
                data-search-id="shipping.zones"
                data-search-keywords="destination, country, delivery area, coverage"
                cssOverride={cardStyles.formCard}
              >
                <CardContent
                  cssOverride={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}
                >
                  <HeaderActionsCard
                    header={__('Shipping Zones', 'kirki-ecommerce')}
                    subHeader={__(
                      'Destination regions you deliver to and the delivery methods offered in each.',
                      'kirki-ecommerce',
                    )}
                    buttonText={__('Add', 'kirki-ecommerce')}
                    onAdd={() => setShowCreateZonePopup(true)}
                  />

                  {!shippingZonesObj.length ? (
                    <Card cssOverride={cardStyles.innerDarkCard}>
                      <CardContent
                        cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}
                      >
                        <Flex direction="column" gap={2} align="center">
                          <LocationIcon />
                          <span css={scoped(styles.emptyStateText)}>
                            {__('Added shipping zones will appear here', 'kirki-ecommerce')}
                          </span>
                        </Flex>
                      </CardContent>
                    </Card>
                  ) : (
                    <Flex direction="column" gap={3}>
                      {shippingZonesObj?.map((item) => {
                        const zoneMethods = getShippingMethodData(item?.id).map((method) => ({
                          ...method,
                          icon: shippingMethodIconMap[method.type] || null,
                          subText: getShippingMethodSubText(method),
                          rightText: getShippingMethodRightText(method),
                        }));
                        const regionTags = getSelectedRegionTags(item?.regions, countryList);
                        const overflowCount = regionTags.length - MAX_VISIBLE_REGION_FLAGS;

                        return (
                          <OptionAccordion
                            key={item?.id}
                            header={item.title}
                            subHeader={getShippingZoneSummary(item)}
                            cssOverride={mergeCss(
                              !item.is_enabled && {
                                backgroundColor: theme.colors.background.surfaceAlt,
                              },
                            )}
                            titleAdornment={
                              regionTags.length > 0 && (
                                <Flex gap={1} align="center">
                                  {regionTags.slice(0, MAX_VISIBLE_REGION_FLAGS).map((tag) => (
                                    <span key={tag.id} css={scoped(styles.regionFlag)}>
                                      {tag.tagIcon}
                                    </span>
                                  ))}
                                  {overflowCount > 0 && (
                                    <Text variant="small" color="subdued">
                                      {sprintf(__('+%d', 'kirki-ecommerce'), overflowCount)}
                                    </Text>
                                  )}
                                </Flex>
                              )
                            }
                            rightActions={
                              <ShippingZoneActions
                                item={item}
                                isSaving={isSaving}
                                onToggle={handleToggleZoneItem}
                                onDelete={handleDeleteItem}
                              />
                            }
                            variant="shipping"
                            enabled={item?.is_enabled}
                            open
                          >
                            {zoneMethods.length > 0 && (
                              <StackedItems cssOverride={styles.methodStack}>
                                {zoneMethods.map((method) => (
                                  <StackedItem
                                    key={method.id}
                                    id={String(method.id)}
                                    cssOverride={styles.methodRow}
                                  >
                                    {method.icon && (
                                      <StackedItemMedia>{method.icon}</StackedItemMedia>
                                    )}
                                    <StackedItemContent>
                                      <StackedItemTitle>
                                        <Text variant="small" weight="medium">
                                          {method.name ?? ''}
                                        </Text>
                                        {method.subText && (
                                          <Text variant="tiny" color="subdued">
                                            {method.subText}
                                          </Text>
                                        )}
                                        {method.is_enabled === false && (
                                          <Badge variant="destructive">
                                            {__('Inactive', 'kirki-ecommerce')}
                                          </Badge>
                                        )}
                                      </StackedItemTitle>
                                    </StackedItemContent>
                                    <StackedItemActions>
                                      {method.rightText && (
                                        <Text
                                          variant="tiny"
                                          color="secondary"
                                          weight="medium"
                                          data-right-text="true"
                                        >
                                          {method.rightText}
                                        </Text>
                                      )}
                                      <ActionGroup>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          aria-label={__('Delete', 'kirki-ecommerce')}
                                          cssOverride={styles.deleteButton}
                                          onClick={() => handleDeleteMethod(method)}
                                        >
                                          <TrashIcon />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="icon-sm"
                                          aria-label={__('Edit', 'kirki-ecommerce')}
                                          cssOverride={styles.actionButton}
                                          onClick={() => handleEditMethod(method)}
                                        >
                                          <EditPenIcon />
                                        </Button>
                                        <Switch
                                          checked={method.is_enabled ?? true}
                                          disabled={isSaving}
                                          onCheckedChange={() => void handleToggleMethod(method)}
                                          aria-label={__(
                                            'Enable shipping method',
                                            'kirki-ecommerce',
                                          )}
                                        />
                                      </ActionGroup>
                                    </StackedItemActions>
                                  </StackedItem>
                                ))}
                              </StackedItems>
                            )}
                          </OptionAccordion>
                        );
                      })}
                    </Flex>
                  )}
                </CardContent>
              </Card>
              <ShippingProfile />
              <ShippingBox />
            </Flex>
          </Form>
        </Container>
      ) : (
        <ShippingSettingsSkeleton />
      )}
      {showCreateZonePopup && (
        <RegionsDialog
          from="add"
          dialogTitle={__('Add shipping region', 'kirki-ecommerce')}
          open={showCreateZonePopup}
          onOpenChange={setShowCreateZonePopup}
          countries={countryList}
          disabledRegions={usedRegions}
          onDone={handleCreateZone}
          errors={popupErrors}
        />
      )}
    </>
  );
};

ShippingSettings.displayName = 'ShippingSettings';

export default ShippingSettings;

const styles = defineStyles({
  emptyState: {
    padding: `${theme.spacing[9]} ${theme.spacing[0]}`,
  },
  emptyStateText: {
    color: theme.colors.text.subdued,
  },
  regionFlag: {
    fontSize: 20,
    lineHeight: 1,
  },
  methodStack: {
    border: 'none',
    borderRadius: theme.radius.none,
  },
  methodRow: {
    paddingInline: `12px`,
    '& button[role="switch"]': {
      width: '36px',
      height: '20px',
    },
  },
  actionButton: {
    padding: theme.spacing[1],
  },
  deleteButton: {
    padding: theme.spacing[1],
    '& svg': {
      color: theme.colors.icon.critical,
    },
  },
});
