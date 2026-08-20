import { Fragment } from 'react';

import HeaderActionsCard from '@/components/header-actions-card';
import OptionAccordion from '@/components/option-accordion';
import { RegionsDialog } from '@/components/regions-dialog';
import Badge from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Form } from '@/components/ui/form';
import { ItemGroup, ItemSeparator } from '@/components/ui/item';
import Text from '@/components/ui/text';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { useShippingSettings } from '@/features/settings/shipping/hooks/use-shipping-settings';
import { getShippingZoneSummary } from '@/features/settings/shipping/lib/utils';
import ShippingBox from '@/features/settings/shipping/pages/shipping-box/shipping-box';
import ShippingMethodRow from '@/features/settings/shipping/pages/shipping-method-row';
import ShippingProfile from '@/features/settings/shipping/pages/shipping-profile/shipping-profile';
import ShippingZoneActions from '@/features/settings/shipping/pages/shipping-zone-actions';
import ShippingSettingsSkeleton from '@/features/settings/shipping/skeletons/shipping-settings-skeleton';
import type { CountryWithStates } from '@/features/settings/shipping/types';
import { LocationIcon, TruckIcon } from '@/icons';
import { theme } from '@/theme';
import { cardStyles } from '@/theme/card-styles';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { getSearchedCountries, getSelectedRegionTags } from '@/utils/region';
import { __ } from '@/wpi18n';

const ShippingSettings = () => {
  const {
    form,
    loaded,
    shippingZonesObj,
    countryList,
    searchValue,
    setSearchValue,
    showCreateZonePopup,
    setShowCreateZonePopup,
    popupErrors,
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
      <Container size="sm">
        {loaded ? (
          <Form {...form}>
            <Flex direction="column" gap={4}>
              <SettingsPageHeader
                icon={<TruckIcon />}
                title={__('Shipping', 'kirki-ecommerce')}
              />
              <Card cssOverride={cardStyles.formCard}>
                <CardContent cssOverride={{ display: 'flex', flexDirection: 'column', gap: theme.spacing[5] }}>
                  <HeaderActionsCard
                    header={__('Shipping Zones', 'kirki-ecommerce')}
                    subHeader={__(
                      'A shipping zone includes regions you ship to and available methods. Each shopper is matched to one zone based on their address.',
                      'kirki-ecommerce',
                    )}
                    buttonText={__('Create Zone', 'kirki-ecommerce')}
                    onAdd={() => setShowCreateZonePopup(true)}
                  />

                  {!shippingZonesObj.length ? (
                    <Card cssOverride={cardStyles.innerDarkCard}>
                      <CardContent cssOverride={mergeCss(cardStyles.innerDarkContent, styles.emptyState)}>
                        <Flex
                          direction="column"
                          gap={2}
                          align="center">
                          <LocationIcon />
                          <span css={scoped(styles.emptyStateText)}>
                            {__(
                              'Added shipping zones will appear here',
                              'kirki-ecommerce',
                            )}
                          </span>
                        </Flex>
                      </CardContent>
                    </Card>
                  ) : (
                    <Flex direction="column" gap={3}>
                      {shippingZonesObj?.map((item) => {
                        const zoneMethods = getShippingMethodData(item?.id);

                        return (
                          <OptionAccordion
                            key={item?.id}
                            header={item.title}
                            subHeader={getShippingZoneSummary(item)}
                            leftIcon={<LocationIcon height={20} width={20} />}
                            rightActions={
                              <ShippingZoneActions
                                item={item}
                                onToggle={handleToggleZoneItem}
                                onDelete={handleDeleteItem}
                              />
                            }
                            variant="shipping"
                            enabled={item?.is_enabled}
                          >
                            <Card cssOverride={cardStyles.innerCard}>
                              <CardContent cssOverride={cardStyles.innerContent}>
                                <Flex gap={2} wrap="wrap">
                                  {getSelectedRegionTags(
                                    item?.regions,
                                    countryList as CountryWithStates[] | null,
                                  ).map((tag) => (
                                    <Badge variant="default" key={tag.id}>
                                      <Flex align="center" gap={1}>
                                        <span css={scoped({ fontSize: 20 })}>
                                          {tag.tagIcon}
                                        </span>
                                        <Text variant="small" color="primary" weight="medium">
                                          {tag.title}
                                        </Text>
                                        {tag.subText && (
                                          <Text variant="small" color="subdued">
                                            {tag.subText}
                                          </Text>
                                        )}
                                      </Flex>
                                    </Badge>

                                  ))}
                                </Flex>
                              </CardContent>
                            </Card>
                            {zoneMethods.length > 0 && (
                              <Card cssOverride={cardStyles.innerCard}>
                                <CardContent cssOverride={cardStyles.tableContent}>
                                  <ItemGroup>
                                    {zoneMethods.map((method, index) => (
                                      <Fragment key={method.id}>
                                        {index > 0 && <ItemSeparator />}
                                        <ShippingMethodRow
                                          method={method}
                                          onToggle={handleToggleMethod}
                                          onEdit={handleEditMethod}
                                          onDelete={handleDeleteMethod}
                                        />
                                      </Fragment>
                                    ))}
                                  </ItemGroup>
                                </CardContent>
                              </Card>
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
        ) : (
          <ShippingSettingsSkeleton />
        )}
      </Container>
      {showCreateZonePopup && (
        <RegionsDialog
          from="add"
          dialogTitle={__('Add shipping region', 'kirki-ecommerce')}
          open={showCreateZonePopup}
          onOpenChange={setShowCreateZonePopup}
          onSearchChange={setSearchValue}
          filteredCountries={getSearchedCountries(
            searchValue,
            countryList,
          )}
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
});
