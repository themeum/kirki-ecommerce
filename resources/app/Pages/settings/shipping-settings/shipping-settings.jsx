import React, { useState, useEffect, useRef } from "react";
import { LocationIcon, TruckIcon } from "@/icons";
import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import PageHeading from '@/molecules/page-heading';
import TagManager from '@/molecules/tag-manager/tag-manager';
import { __, sprintf } from "@/wpi18n";
import { useNavigate, useLocation, useOutletContext } from "react-router";
import PageNavbar from '@/components/page-navbar';
import OptionAccordion from '@/components/option-accordion';
import HeaderActionsCard from '@/components/header-actions-card';
import ShippingProfile from './shipping-profile/shipping-profile';
import ShippingBox from "./shipping-box/shipping-box";
import ShippingSolution from './shipping-solution';
import { useDispatch, useSelector } from "react-redux";
import {
  getSettingsAPI,
  updateSettingsAPI,
  setActiveZoneId,
  updateSettings,
  setSelectedCountryList,
} from "../../../store/settingsSlice";
import {
  getSearchedCountries,
  getSelectedRegionTags,
  saveShippingZones,
  shippingMethodIconMap,
} from './utils';
import { ShippingMethod } from './shipping-method/shipping-method';
import { ShippingRegionPopup } from "./shipping-zone/shipping-region-popup";
import ShippingZoneActions from './shipping-zone-actions';
import { setUnsavedDataStatus } from "../utils";
import useGetListAPI from "../../../hooks/useGetListAPI";
import { getCountriesAPI } from "../../../store/countriesSlice";
import { getErrorsObject } from "../../../store/utils";
import { normalizeErrors } from "../../utils";

const ShippingSettings = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { confirmAction } = useOutletContext();

  const newZoneIdRef = useRef(crypto.randomUUID());
  const [searchValue, setSearchValue] = useState("");
  const [showCreateZonePopup, setShowCreateZonePopup] = useState(false);
  const [shippingZonesObj, setShippingZonesObj] = useState([]);
  const [shippingZoneTitle, setShippingZoneTitle] = useState("");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [errors, setErrors] = useState({});

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const countryList = useSelector((state) => state.countries?.data);
  const { loaded, data: shippingSettingsData } = useSelector(
    (state) => state.settings?.shipping,
  );

  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  useEffect(() => {
    if (location.pathname === "/settings/shipping") {
      dispatch(setActiveZoneId(null));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("shipping"));
  }, []);

  useEffect(() => {
    if (Object.keys(shippingSettingsData || {}).length) {
      setShippingZonesObj(
        Array.isArray(shippingSettingsData?.["shipping_zones"])
          ? shippingSettingsData?.["shipping_zones"]
          : [],
      );
    }
  }, [shippingSettingsData]);

  const handleDeleteItem = async (item) => {
    const updatedZones = shippingZonesObj?.filter(
      (zone) => zone.id !== item.id,
    );
    setShippingZonesObj(updatedZones);

    await saveShippingZones({
      zones: updatedZones,
      from: "delete",
      shippingSettingsData,
    });
  };

  const getShippingMethodData = (zoneId) => {
    const selectedZone = shippingZonesObj?.find((zone) => zone.id === zoneId);
    if (!selectedZone) return [];

    return (selectedZone.shipping_methods || []).map((method) => ({
      ...method,
      icon: shippingMethodIconMap[method.type] || null,
      zoneId: zoneId,
    }));
  };

  const trackHasUnsavedData = (currentZones, originalZones) => {
    return currentZones.some((zone) => {
      const original = originalZones.find((z) => z.id === zone.id);
      return original && zone.is_enabled !== original.is_enabled;
    });
  };

  const handleToggleZoneItem = (item) => {
    setShippingZonesObj((prev) => {
      if (!Array.isArray(prev)) return prev;
      const newValue = !item.is_enabled;
      const updated = prev.map((zone) =>
        zone.id === item.id ? { ...zone, is_enabled: newValue } : zone,
      );
      const isDataUnsaved = trackHasUnsavedData(
        updated,
        shippingSettingsData.shipping_zones,
      );
      setUnsavedDataStatus(isDataUnsaved);
      return updated;
    });
  };

  const handleCreateZone = async () => {
    const updatedZones = [
      ...shippingZonesObj,
      {
        id: newZoneIdRef.current,
        is_enabled: true,
        title: shippingZoneTitle,
        regions: selectedRegion,
        shipping_methods: [],
        shipping_careers: [],
      },
    ];
    const result = await updateSettingsAPI("shipping", {
      shipping_zones: updatedZones,
    });

    if (result?.success) {
      dispatch(updateSettings({ key: "shipping", value: result.data }));
      dispatch(setSelectedCountryList(selectedCountries));

      setShowCreateZonePopup(false);
      navigate(`/settings/shipping/zone/${newZoneIdRef.current}`);
    } else {
      const errorObj = getErrorsObject(result?.errors);
      setErrors(normalizeErrors(errorObj));
    }
  };

  const handleBackButton = () => {
    confirmAction({ action: () => navigate("/settings") });
  };

  const handleDiscardData = () => {
    setShippingZonesObj(shippingSettingsData?.["shipping_zones"]);
    setUnsavedDataStatus(false);
  };

  return (
    <>
      <PageHeading
        text={__("Settings", "kirki-ecommerce")}
        size="sm"
        sticky
        type="primary"
        style={{ height: "32px" }}
        actions={
          hasUnsavedData ? (
            <>
              <Button
                type="ghost"
                text={__("Cancel", "kirki-ecommerce")}
                onClick={handleDiscardData}
                size="small"
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                size="small"
                onClick={async () =>
                  await saveShippingZones({
                    zones: shippingZonesObj,
                    shippingSettingsData,
                    toastMessage: "Shipping zone updated",
                  })
                }
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        {loaded ? (
          <Flex direction="column" gap={16}>
            <PageNavbar
              handleBack={handleBackButton}
              textIcon={<TruckIcon />}
              text={__("Shipping", "kirki-ecommerce")}
            />
            <Card type="large">
              <HeaderActionsCard
                header={__("Shipping Zones", "kirki-ecommerce")}
                subHeader={__(
                  "A shipping zone includes regions you ship to and available methods. Each shopper is matched to one zone based on their address.",
                  "kirki-ecommerce",
                )}
                buttonText={__("Create Zone", "kirki-ecommerce")}
                onAdd={() => setShowCreateZonePopup(true)}
              />

              {!shippingZonesObj.length ? (
                <Card
                  type="innerDark"
                  style={{
                    padding: "var(--decom-spacing-9) var(--decom-spacing-0)",
                  }}
                >
                  <Flex
                    direction="column"
                    gap={8}
                    style={{ alignItems: "center" }}
                  >
                    <LocationIcon />
                    <span style={{ color: "var(--decom-text-text-subdued)" }}>
                      {__("Added shipping zones will appear here", "kirki-ecommerce")}
                    </span>
                  </Flex>
                </Card>
              ) : (
                <Flex direction="column" gap={12}>
                  {shippingZonesObj?.map((item, index) => (
                    <OptionAccordion
                      key={item?.id}
                      header={sprintf(__("%s", "kirki-ecommerce"), item.title)}
                      subHeader={`${item?.regions?.length} regions, ${item?.["shipping_methods"]?.length} shipping methods`}
                      leftIcon={<LocationIcon height={20} width={20} />}
                      rightActions={
                        <ShippingZoneActions
                          item={item}
                          onToggle={handleToggleZoneItem}
                          onDelete={handleDeleteItem}
                        />
                      }
                      variant="shipping"
                      state={item?.is_enabled}
                    >
                      <TagManager
                        showInputField={false}
                        selectedTags={getSelectedRegionTags(
                          item?.regions,
                          countryList,
                        )}
                        showRemoveIcon={false}
                      />
                      {getShippingMethodData(item?.id).length > 0 && (
                        <ShippingMethod
                          from={"edit_zone"}
                          shippingSettingsData={shippingSettingsData}
                          shippingMethodList={getShippingMethodData(item?.id)}
                          shippingZonesObj={shippingZonesObj}
                          setShippingZonesObj={setShippingZonesObj}
                        />
                      )}
                    </OptionAccordion>
                  ))}
                </Flex>
              )}
            </Card>
            <ShippingProfile />
            <ShippingBox />
            {/* <ShippingSolution /> */}
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
      {showCreateZonePopup && (
        <ShippingRegionPopup
          from={"add"}
          openPopup={showCreateZonePopup}
          setOpenPopup={setShowCreateZonePopup}
          setSearchValue={setSearchValue}
          filteredCountries={getSearchedCountries(searchValue, countryList)}
          selectedCountries={selectedCountries}
          setSelectedCountries={setSelectedCountries}
          selectedRegion={selectedRegion}
          setSelectedRegion={setSelectedRegion}
          onAdd={handleCreateZone}
          shippingZoneTitle={shippingZoneTitle}
          setShippingZoneTitle={setShippingZoneTitle}
          errors={errors}
        />
      )}
    </>
  );
};

export default ShippingSettings;
