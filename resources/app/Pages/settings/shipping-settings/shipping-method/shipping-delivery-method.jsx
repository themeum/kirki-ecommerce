import React, { useState, useEffect, useMemo } from "react";
import { TruckIcon, WeightIcon, StoreIcon } from "@/icons";
import PageHeading from '@/molecules/page-heading';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Input from '@/molecules/input';
import Card from '@/molecules/card';

import { __ } from "@/wpi18n";
import PageNavbar from '@/components/page-navbar';
import FlatRateSettings from './flat-rate-settings';
import LocalPickupSettings from './local-pickup-settings';
import RateByWeightSettings from './rate-by-weight-settings';
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, useNavigate, useOutletContext } from "react-router";
import { Select } from '@/molecules/select';

import {
  getSettingsAPI,
  updateSettings,
  updateSettingsAPI,
} from "../../../../store/settingsSlice";
import { ShippingRules } from "./shipping-rules/shipping-rules";
import { METHOD_SCHEMAS } from "../utils";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../../utils";
import { dispatchToastMessage } from "../../../utils";

const ShippingDeliveryMethod = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();
  const [searchParams] = useSearchParams();

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const { data: shippingSettingsData, activeZoneId } = useSelector(
    (state) => state.settings?.shipping,
  );
  const method_Id = searchParams.get("methodId");
  const zoneIdFromURL = searchParams.get("zoneId");

  const final_zoneId = zoneIdFromURL || activeZoneId;
  const [methodId] = useState(method_Id || crypto.randomUUID());

  const [methodType, setMethodType] = useState("flat_rate");
  const [dataObj, setDataObj] = useState([]);
  const [initialDataObj, setInitialDataObj] = useState([]);

  // has editing method
  const editingMethod = shippingSettingsData?.shipping_zones
    ?.flatMap((zone) => zone?.shipping_methods || [])
    .find((method) => method?.id === method_Id);

  const methodExist = useMemo(() => {
    return shippingSettingsData?.shipping_zones?.some((zone) =>
      zone.shipping_methods?.some((m) => m.id === methodId),
    );
  }, [shippingSettingsData, methodId]);

  useEffect(() => {
    dispatch(getSettingsAPI("shipping"));
  }, []);

  useEffect(() => {
    if (!editingMethod) return;
    setMethodType(editingMethod.type);
    setDataObj({
      name: editingMethod.name || "",

      is_enabled: editingMethod.is_enabled ?? true,
      ...sanitizeByMethodType(editingMethod.type, editingMethod),
    });
    setInitialDataObj({
      name: editingMethod.name || "",
      type: editingMethod.type,
      is_enabled: editingMethod.is_enabled ?? true,
      ...sanitizeByMethodType(editingMethod.type, editingMethod),
    });
  }, [editingMethod]);

  const buildMethodData = (type, prev = {}) => {
    return {
      name: prev.name || "",
      is_enabled: prev.is_enabled ?? true,
      ...sanitizeByMethodType(type, prev),
    };
  };

  const sanitizeByMethodType = (type, data = {}) => {
    const schema = METHOD_SCHEMAS[type] || {};

    return Object.keys(schema).reduce((acc, key) => {
      acc[key] = data[key] ?? schema[key];
      return acc;
    }, {});
  };

  useEffect(() => {
    setDataObj((prev) => buildMethodData(methodType, prev));
    setInitialDataObj((prev) => buildMethodData(methodType, prev));
  }, [methodType]);

  const handleOnChange = (value, key) => {
    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
  };

  const methodSettingsMap = {
    flat_rate: {
      title: __("Flat Rate", "kirki-ecommerce"),
      comp: (
        <FlatRateSettings handleOnChange={handleOnChange} dataObj={dataObj} />
      ),
    },
    local_pickup: {
      title: __("Local Pickup", "kirki-ecommerce"),
      comp: (
        <LocalPickupSettings
          handleOnChange={handleOnChange}
          dataObj={dataObj}
        />
      ),
    },
    weight: {
      title: __("Rate by Weight", "kirki-ecommerce"),
      comp: (
        <RateByWeightSettings
          handleOnChange={handleOnChange}
          dataObj={dataObj}
        />
      ),
    },
  };

  const handleCreateOrUpdateData = async () => {
    const shippingMethod = {
      id: methodId,
      type: methodType,
      name: dataObj.name,
      is_enabled: dataObj.is_enabled,
      ...sanitizeByMethodType(methodType, dataObj),
      shipping_rules: editingMethod?.shipping_rules ?? [],
    };

    const updatedShippingZones = shippingSettingsData.shipping_zones.map(
      (zone) => {
        if (methodExist) {
          return {
            ...zone,
            shipping_methods: zone.shipping_methods.map((m) =>
              m.id === shippingMethod.id ? shippingMethod : m,
            ),
          };
        }

        if (!editingMethod && zone.id === final_zoneId) {
          return {
            ...zone,
            shipping_methods: [
              ...(zone.shipping_methods || []),
              shippingMethod,
            ],
          };
        }

        return zone;
      },
    );

    const updatedData = {
      ...shippingSettingsData,
      shipping_zones: updatedShippingZones,
    };

    const result = await updateSettingsAPI("shipping", updatedData);
    if (result.success) {
      dispatch(updateSettings({ key: "shipping", value: updatedData }));
      setUnsavedDataStatus(false);
      dispatchToastMessage("success", {
        title: methodExist
          ? __("Shipping method updated", "kirki-ecommerce")
          : __("New shipping method created", "kirki-ecommerce"),
      });
      navigate(
        `/settings/shipping/delivery-method?methodId=${methodId}&zoneId=${final_zoneId}`,
      );
    } else {
      dispatchToastMessage("error", { title: result?.message });
    }
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings/shipping/zone/${final_zoneId}`),
        }),
      onClean: () => {
        navigate(`/settings/shipping/zone/${final_zoneId}`);
      },
    });
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
              <Button type="ghost" text={__("Cancel", "kirki-ecommerce")} size="small" />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                onClick={handleCreateOrUpdateData}
                size="small"
              />
            </>
          ) : (
            <></>
          )
        }
      />
      <Container size="sm">
        <Flex direction="column" gap={16}>
          <PageNavbar
            text={methodSettingsMap[methodType].title ?? ""}
            handleBack={handleBackButton}
          />
          <Card
            type="large"
            style={{
              gap: "var(--decom-spacing-4)",
            }}
          >
            <Input
              value={dataObj?.name || ""}
              placeholder={__("Standard Delivery", "kirki-ecommerce")}
              onChange={(value) => handleOnChange(value, "name")}
              label={__("Method Name", "kirki-ecommerce")}
            />
            <Select
              label={__("Method Type", "kirki-ecommerce")}
              placeholder={__("Flat Rate", "kirki-ecommerce")}
              optionsArray={[
                {
                  title: __("Flat Rate", "kirki-ecommerce"),
                  value: "flat_rate",
                  leftIcon: <TruckIcon />,
                },
                {
                  title: __("Local Pickup", "kirki-ecommerce"),
                  value: "local_pickup",
                  leftIcon: <WeightIcon />,
                },
                {
                  title: __("Rate by Weight", "kirki-ecommerce"),
                  value: "weight",
                  leftIcon: <StoreIcon />,
                },
              ]}
              value={methodType}
              onChange={(value) => setMethodType(value)}
            />

            {methodSettingsMap[methodType].comp}
          </Card>
          {methodExist && <ShippingRules methodId={methodId} />}
        </Flex>
      </Container>
    </>
  );
};

export default ShippingDeliveryMethod;
