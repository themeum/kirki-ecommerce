import React, { useEffect, useState } from "react";
import PageHeading from '@/molecules/page-heading';
import Button from '@/molecules/button';
import Container from '@/molecules/container';
import Flex from '@/molecules/flex';
import Text from '@/molecules/text';
import Card from '@/molecules/card';
import { __ } from "@/wpi18n";
import ApiConfig from "./api-config/api-config";
import { CurrencyIcon } from "@/icons";
import { useDispatch, useSelector } from "react-redux";
import PageNavbar from '@/components/page-navbar';
import { AvailableCurrencyList } from './available-currency-list';
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";
import { useNavigate, useOutletContext } from "react-router";
import { getErrorsObject } from "../../../store/utils";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../utils";
import { dispatchToastMessage } from "../../utils";
import CurrencyFormatSettings from './currency-format-settings';

const MultiCurrencySettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();

  const { loaded, data: currencySettingsData } = useSelector(
    (state) => state.settings?.currency
  );

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const [dataObj, setDataObj] = useState({});
  const [initialData, setInitialData] = useState({});
  const [errors, setErrors] = useState({});

  const handleOnChange = (value, key) => {
    setUnsavedDataStatus(true);
    setDataObj((prev) => {
      return {
        ...prev,
        [key]: value,
      };
    });
    setErrors((prev) => ({
      ...prev,
      ["data." + key]: null,
    }));
  };

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("currency"));
  }, []);

  useEffect(() => {
    if (!currencySettingsData) return;

    setDataObj(currencySettingsData);
    setInitialData(currencySettingsData);
  }, [currencySettingsData]);

  const handleSaveData = async () => {
    let result = {};

    const updatedObj = {
      ...dataObj,
      is_automatic_update_enabled:
        dataObj?.is_automatic_update_enabled || false,
    };
    result = await updateSettingsAPI("currency", updatedObj);
    if (result.success) {
      setUnsavedDataStatus(false);
      dispatch(updateSettings({ key: "currency", value: result.data }));
      dispatchToastMessage("success", {
        title: __("Currency settings updated", "kirki-ecommerce"),
      });
    } else {
      setErrors(getErrorsObject(result.errors));
      dispatchToastMessage("error", { title: result?.message });
    }
  };

  const handleDiscardData = () => {
    setDataObj(initialData);
    setErrors({});
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    checkUnsavedDataStatus({
      initialDataObj: initialData,
      updatedDataObj: dataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate(`/settings`),
        }),
      onClean: () => {
        navigate(`/settings`);
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
              <Button
                type="ghost"
                text={__("Cancel", "kirki-ecommerce")}
                size="small"
                onClick={handleDiscardData}
              />
              <Button
                type="primary"
                text={__("Save", "kirki-ecommerce")}
                size="small"
                onClick={handleSaveData}
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
              textIcon={<CurrencyIcon />}
              text={__("Currency", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />

            <Card type={"large"}>
              <Text
                header={__("Currency Management", "kirki-ecommerce")}
                subHeader={__(
                  "Manage product pricing across multiple currencies with manual or automatic conversion rates.",
                  "kirki-ecommerce"
                )}
                type="primary"
                style={{ gap: "var(--decom-spacing-f3)" }}
              />
              <AvailableCurrencyList dataObj={dataObj} />
              <ApiConfig
                dataObj={dataObj}
                handleOnChange={handleOnChange}
                errors={errors}
              />
            </Card>
            <Card type={"large"}>
              <Text
                header={__("Currency Preferences", "kirki-ecommerce")}
                subHeader={__(
                  "Set your preferences for how currency is displayed.",
                  "kirki-ecommerce"
                )}
                type="primary"
                style={{ gap: "12px" }}
              />
              <CurrencyFormatSettings
                dataObj={dataObj}
                handleOnChange={handleOnChange}
                errors={errors}
              />
            </Card>
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default MultiCurrencySettings;
