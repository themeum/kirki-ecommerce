import Button from '@/molecules/button';
import Card from '@/molecules/card';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import PageHeading from '@/molecules/page-heading';

import { __ } from "@/wpi18n";
import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import PageNavbar from '@/components/page-navbar';
import { ShippingRegionPopup } from './shipping-region-popup';
import { getSearchedCountries, setUnsavedDataStatus } from "../../utils";
import { TagManager } from '@/molecules/tag-manager';

import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
  setActiveZoneId,
  setSelectedCountryList,
} from "../../../../store/settingsSlice";
import { ShippingMethod } from "../shipping-method/shipping-method";
import ShippingCareer from "../shipping-career/shipping-career";
import { useParams } from "react-router";
import { getSelectedRegionTags } from "../utils";

import { useOutletContext, useNavigate } from "react-router";
import { checkUnsavedDataStatus } from "../../utils";
import { dispatchToastMessage, normalizeErrors } from "../../../utils";
import { getCountriesAPI } from "../../../../store/countriesSlice";
import useGetListAPI from "../../../../hooks/useGetListAPI";

const ShippingZone = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();

  const { zone_Id } = useParams();
  const [openPopup, setOpenPopup] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const countryList = useSelector((state) => state.countries?.data);
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState([]);
  const [shippingZoneTitle, setShippingZoneTitle] = useState("");
  const [shippingZonesObj, setShippingZonesObj] = useState([]);
  const [initialDataObj, setInitialDataObj] = useState([]);
  const [errors, setErrors] = useState({});

  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  const {
    loaded,
    data: shippingSettingsData,
    activeZoneId,
    selectedCountryList,
  } = useSelector((state) => state.settings?.shipping);

  const zones = shippingSettingsData?.shipping_zones || [];
  const zoneId = zone_Id || activeZoneId;

  const activeZone = zones.find((zone) => zone.id === zoneId);

  const shippingMethodList = useMemo(() => {
    return shippingZonesObj.reduce((acc, zone) => {
      acc[zone.id] = (zone.shipping_methods || []).map((method) => ({
        ...method,
        zoneId: zone.id,
      }));
      return acc;
    }, {});
  }, [shippingZonesObj]);

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("shipping"));
  }, []);

  useEffect(() => {
    if (!zones.length) return;
    setShippingZonesObj(zones);
    setInitialDataObj(activeZone);
  }, [zones]);

  useEffect(() => {
    if (!shippingZonesObj.length) return;
    const activeZone = shippingZonesObj.find((zone) => zone.id === zoneId);
    if (!activeZone) return;

    setShippingZoneTitle(activeZone.title);
    setSelectedRegion(activeZone.regions);

    if (selectedCountryList?.length) {
      setSelectedCountries(selectedCountryList);
    } else {
      const derivedCountries = activeZone.regions.map((r) => r.country);
      setSelectedCountries(derivedCountries);
    }

    dispatch(setActiveZoneId(zoneId));
  }, [zoneId, shippingZonesObj, selectedCountryList]);

  const handleRemoveRegionTag = (removedTag) => {
    if (selectedCountries.length <= 1 || selectedRegion.length <= 1) {
      dispatchToastMessage("warning", {
        title: __("Regions cannot be empty", "kirki-ecommerce"),
      });
      return;
    }
    setSelectedCountries((prev) =>
      prev.filter((country) => country !== removedTag?.id),
    );

    setSelectedRegion((prev) =>
      prev.filter((item) => item.country !== removedTag.id),
    );
    setShippingZonesObj((prevZones) =>
      prevZones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              regions: zone.regions.filter((r) => r.country !== removedTag.id),
            }
          : zone,
      ),
    );
    setUnsavedDataStatus(true);
  };

  const handleShippingZoneTitle = (value) => {
    setShippingZoneTitle(value);
    setUnsavedDataStatus(true);
    setShippingZonesObj((prev) =>
      prev.map((zone) =>
        zone.id === zoneId ? { ...zone, title: value } : zone,
      ),
    );
    setErrors((prev) => {
      return {
        ...prev,
        ["title"]: "",
      };
    });
  };

  const handleAddRegion = () => {
    if (selectedRegion?.length < 1) {
      dispatchToastMessage("warning", {
        title: __("Regions cannot be empty", "kirki-ecommerce"),
      });
      return;
    }
    setErrors({ ...errors, regions: "" });
    setShippingZonesObj((prevZones) =>
      prevZones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              regions: selectedRegion,
            }
          : zone,
      ),
    );
    setOpenPopup(false);
    setUnsavedDataStatus(true);
  };
  const updateShippingZone = async () => {
    const result = await updateSettingsAPI("shipping", {
      shipping_zones: shippingZonesObj,
    });

    if (result?.success) {
      dispatch(updateSettings({ key: "shipping", value: result.data }));
      dispatch(setSelectedCountryList(selectedCountries));
      dispatch(setActiveZoneId(zoneId));
      setUnsavedDataStatus(false);
      dispatchToastMessage("success", {
        title: __("Shipping zone updated", "kirki-ecommerce"),
      });
    } else {
      setErrors(normalizeErrors(result?.errors));
    }
  };

  const handleBackButton = () => {
    const activeZoneData = shippingZonesObj?.find(
      (zone) => zone?.id === zoneId,
    );

    checkUnsavedDataStatus({
      initialDataObj,
      updatedDataObj: activeZoneData,
      keysToCompare: ["title", "regions"],
      onUnsaved: () =>
        confirmAction({ action: () => navigate("/settings/shipping") }),
      onClean: () => {
        navigate("/settings/shipping");
      },
    });
  };

  const handleDiscardData = () => {
    setShippingZonesObj((prev = []) =>
      prev.map((zone) => (zone.id === activeZone?.id ? initialDataObj : zone)),
    );
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
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                onClick={updateShippingZone}
                size="small"
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
              text={__("Set Zone Details", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />
            <Card type="large" style={{ gap: "var(--decom-spacing-4)" }}>
              <Input
                label={__("Title", "kirki-ecommerce")}
                placeholder="Zone 2- South Asia"
                value={shippingZoneTitle}
                onChange={(value) => handleShippingZoneTitle(value)}
                error={errors?.title || ""}
              />
              <TagManager
                label={__("Regions", "kirki-ecommerce")}
                placeholder={__("Click to add destinations..", "kirki-ecommerce")}
                readOnly
                onClick={() => setOpenPopup(true)}
                showSuggestionDropdown={false}
                selectedTags={getSelectedRegionTags(
                  selectedRegion,
                  countryList,
                )}
                onTagRemove={handleRemoveRegionTag}
                error={errors?.regions || ""}
              />

              {openPopup && (
                <ShippingRegionPopup
                  filteredCountries={getSearchedCountries(
                    searchValue,
                    countryList,
                  )}
                  openPopup={openPopup}
                  setOpenPopup={setOpenPopup}
                  setSearchValue={setSearchValue}
                  selectedCountries={selectedCountries}
                  setSelectedCountries={setSelectedCountries}
                  selectedRegion={selectedRegion}
                  setSelectedRegion={setSelectedRegion}
                  setShippingZoneTitle={setShippingZoneTitle}
                  from="edit"
                  onAdd={handleAddRegion}
                />
              )}
            </Card>

            <ShippingMethod
              shippingSettingsData={shippingSettingsData}
              shippingMethodList={shippingMethodList[activeZoneId] || []}
              shippingZonesObj={shippingZonesObj}
              setShippingZonesObj={setShippingZonesObj}
            />
            {/* <ShippingCareer /> */}
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default ShippingZone;
