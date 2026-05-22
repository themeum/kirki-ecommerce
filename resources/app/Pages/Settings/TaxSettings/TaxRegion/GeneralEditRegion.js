import React, { useState, useEffect, useMemo } from "react";
import {
  PageHeading,
  Button,
  Container,
  Card,
  Flex,
  Checkbox,
} from "../../../../molecules";
import { useNavigate, useOutletContext, useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import PageNavbar from "../../../../components/PageNavbar";
import {
  updateSettings,
  getSettingsAPI,
  updateSettingsAPI,
} from "../../../../store/settingsSlice";
import HeaderActionsCard from "../../../../components/HeaderActionsCard";
import AddCitiesPopup from "./AddCitiesPopup";
import TaxRules from "./TaxRules";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../../utils";
import { dispatchToastMessage } from "../../../utils";
import { TaxRateList } from "./TaxRateList";
import { SingleTaxRate } from "./SingleTaxRate";
import { __ } from "@/wpi18n";

const GeneralEditRegion = () => {
  let { code } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();
  const [dataObj, setDataObj] = useState([]);
  const [taxRates, setTaxRates] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [applySingleTax, setApplySingleTax] = useState(false);
  const [centralTaxValue, setCentralTaxValue] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const hasUnsavedData = useSelector((state) => state.unsaved?.hasUnsavedData);
  const { loaded, data: taxSettingsData } = useSelector(
    (state) => state.settings?.tax,
  );

  useEffect(() => {
    if (!loaded) dispatch(getSettingsAPI("tax"));
  }, []);

  const selectedCountry = useMemo(() => {
    return dataObj.find((country) => country.code === code);
  }, [dataObj]);

  useEffect(() => {
    if (Array.isArray(taxSettingsData?.tax_regions)) {
      setDataObj(taxSettingsData.tax_regions);
    }
  }, [taxSettingsData]);

  useEffect(() => {
    if (!dataObj.length) return;
    setInitialData();
  }, [dataObj, code]);

  const setInitialData = () => {
    const country = dataObj.find((country) => country.code === code);
    if (country?.product_tax?.length) {
      setTaxRates(country.product_tax);
    } else {
      setTaxRates([]);
    }
    setCentralTaxValue(country?.central_product_tax || 0);
    setApplySingleTax(country?.is_central_tax_enabled || false);
  };

  const handleAddCities = () => {
    const newTaxRates = selectedCities.map((city) => ({
      state: city.title,
      rate: 0,
    }));

    setUnsavedDataStatus(true);
    setTaxRates((prev = []) => {
      const existingStates = new Set(prev.map((t) => t.state));
      return [
        ...prev,
        ...newTaxRates.filter((t) => !existingStates.has(t.state)),
      ];
    });

    setShowPopup(false);
  };

  const handleApplySingleTax = () => {
    setApplySingleTax(!applySingleTax);
    setUnsavedDataStatus(true);
    setSelectedCities([]);
  };

  const updateTaxRules = async (rulesList) => {
    const updatedData = dataObj?.map((region) =>
      region.code === selectedCountry?.code
        ? { ...region, rules: rulesList }
        : region,
    );
    setDataObj(updatedData);
    saveDataToDB(updatedData, "delete");
  };

  const handleSaveData = async (updatedTaxRates, from = "") => {
    const updatedDataObj = dataObj.map((country) =>
      country.code === code
        ? {
            ...country,
            product_tax: updatedTaxRates ?? taxRates,
            is_central_tax_enabled: applySingleTax,
            central_product_tax: centralTaxValue,
          }
        : country,
    );
    saveDataToDB(updatedDataObj, from);
  };

  const saveDataToDB = async (updatedDataObj, from = "") => {
    const payload = {
      ...taxSettingsData,
      tax_regions: updatedDataObj,
    };
    const result = await updateSettingsAPI("tax", payload);
    if (result?.success) {
      setSelectedCities([]);
      dispatch(updateSettings({ key: "tax", value: result.data }));
      if (from !== "delete")
        dispatchToastMessage("success", {
          title: __("Tax value updated", "kirki-ecommerce"),
        });
      setUnsavedDataStatus(false);
    } else {
      // check and set error messages after updating from BE
      dispatchToastMessage("error", {
        title: result?.message || __("Something went wrong", "kirki-ecommerce"),
      });
    }
  };

  const handleDiscardData = () => {
    setInitialData();
    setUnsavedDataStatus(false);
  };

  const handleBackButton = () => {
    const updatedDataObj = dataObj.map((country) =>
      country.code === code
        ? {
            ...country,
            product_tax: taxRates,
            is_central_tax_enabled: applySingleTax,
            central_product_tax: centralTaxValue,
          }
        : country,
    );
    checkUnsavedDataStatus({
      initialDataObj: taxSettingsData.tax_regions,
      updatedDataObj: updatedDataObj,
      onUnsaved: () =>
        confirmAction({
          action: () => navigate("/settings/tax"),
        }),
      onClean: () => navigate("/settings/tax"),
    });
  };

  return (
    <div>
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
                  size="small"
                  onClick={handleDiscardData}
                  text={__("Cancel", "kirki-ecommerce")}
                />
                <Button
                  type="primary"
                  size="small"
                  text={__("Save", "kirki-ecommerce")}
                  onClick={() => handleSaveData()}
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
                text={selectedCountry?.name}
                textIcon={selectedCountry?.flag}
                handleBack={handleBackButton}
              />

              <Card type="large" style={{ gap: "var(--decom-spacing-4)" }}>
                <HeaderActionsCard
                  header={__("Cities", "kirki-ecommerce")}
                  subHeader={__("Set tax rates for specific cities", "kirki-ecommerce")}
                  buttonText={__("Add", "kirki-ecommerce")}
                  onAdd={() => setShowPopup(true)}
                  hideButton={applySingleTax}
                />
                <Checkbox
                  value={applySingleTax}
                  label={__(
                    "Apply single tax rate for entire country",
                    "kirki-ecommerce",
                  )}
                  onChange={handleApplySingleTax}
                />
                {applySingleTax ? (
                  <SingleTaxRate
                    centralTaxValue={centralTaxValue}
                    setCentralTaxValue={setCentralTaxValue}
                  />
                ) : (
                  <TaxRateList
                    taxRates={taxRates}
                    applySingleTax={applySingleTax}
                    setTaxRates={setTaxRates}
                    handleSaveData={handleSaveData}
                  />
                )}
              </Card>
              <TaxRules
                region={selectedCountry}
                updateTaxRules={updateTaxRules}
              />
            </Flex>
          ) : (
            <div>{__("Loading ...", "kirki-ecommerce")}</div>
          )}
        </Container>
        {showPopup && (
          <AddCitiesPopup
            openPopup={showPopup}
            setOpenPopup={setShowPopup}
            taxRates={taxRates}
            countryName={selectedCountry?.name}
            cityList={selectedCountry?.states}
            selectedCities={selectedCities}
            setSelectedCities={setSelectedCities}
            onAdd={handleAddCities}
          />
        )}
      </>
    </div>
  );
};

export default GeneralEditRegion;
