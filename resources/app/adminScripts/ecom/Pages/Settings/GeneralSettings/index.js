import { HomeIcon } from "icons";
import { Button, Container, Flex, PageHeading } from "molecules";
import React, { useEffect, useState } from "react";
import PageNavbar from "../../../components/PageNavbar";
import { useDispatch, useSelector } from "react-redux";
import {
  getSettingsAPI,
  updateSettingsAPI,
  updateSettings,
} from "../../../store/settingsSlice";
import { getErrorsObject } from "../../../store/utils";
import StoreContactDetails from "./StoreContactDetails";
import StoreAddressDetails from "./StoreAddressDetails";
import SellingLocation from "./SellingLocation";
import OrderId from "./OrderId";
import InvoiceId from "./InvoiceId";
import { __ } from "wpi18n";
import { useOutletContext, useNavigate } from "react-router";
import { checkUnsavedDataStatus, setUnsavedDataStatus } from "../utils";
import { dispatchToastMessage } from "../../utils";

const GeneralSettings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { confirmAction } = useOutletContext();

  const [storeLogo, setStoreLogo] = useState("");
  const [sellingLocation, setSellingLocation] = useState("");
  const [selectedCountries, setSelectedCountries] = useState([]);
  const [dataObj, setDataObj] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [errors, setErrors] = useState({});

  const hasUnsavedData = useSelector((state) => state.unsaved.hasUnsavedData);
  const { loaded, data: generalSettingsData } = useSelector(
    (state) => state.settings?.general,
  );

  useEffect(() => {
    dispatch(getSettingsAPI("general"));
  }, []);

  useEffect(() => {
    if (Object.keys(generalSettingsData || {}).length) {
      setDataObj({
        ...generalSettingsData,
        store_logo: generalSettingsData?.store_logo?.id ?? null,
      });
      setInitialData({
        ...generalSettingsData,
        store_logo: generalSettingsData?.store_logo?.url ?? null,
      });
      setStoreLogo(generalSettingsData?.store_logo?.url || "");
      setSelectedCountries(generalSettingsData?.selling_countries);
      setSellingLocation(generalSettingsData?.selling_location_type);
    }
  }, [generalSettingsData]);

  const handleResetIDField = (key) => {
    if (key === "order") {
      setDataObj((prev) => ({
        ...prev,
        order_id_prefix: "",
        order_id_suffix: "",
      }));
    } else {
      setDataObj((prev) => ({
        ...prev,
        invoice_id_prefix: "",
        invoice_id_sequence: "",
        invoice_id_suffix: "",
      }));
    }
  };

  const handleOnChange = (value, key) => {
    const addressKeys = [
      "address_line_1",
      "address_line_2",
      "city",
      "state_province",
      "zip_code",
      "country",
    ];

    setUnsavedDataStatus(true);

    setDataObj((prev) => {
      if (addressKeys.includes(key)) {
        return {
          ...prev,
          store_address: {
            ...prev.store_address,
            [key]: value,
          },
        };
      }
      if (key === "selling_location_type") {
        setSellingLocation(value);
        if (value === "all-countries") setSelectedCountries([]);
      }
      if (key === "selling_countries") {
        return {
          ...prev,
          selling_countries: value,
        };
      }
      if (key === "store_logo") {
        setStoreLogo(value?.url);
        return {
          ...prev,
          [key]: value?.id,
        };
      }
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

  const handleSaveData = async () => {
    let result = {};
    const updatedData = {
      ...dataObj,
      selling_countries: selectedCountries,
    };

    setDataObj(updatedData);
    result = await updateSettingsAPI("general", updatedData);
    if (result.success) {
      dispatch(updateSettings({ key: "general", value: result.data }));
      setUnsavedDataStatus(false);
      dispatchToastMessage("success", {
        title: __("General settings updated", "kirki-ecommerce"),
      });
    } else {
      setErrors(getErrorsObject(result.errors));
    }
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

  const handleDiscardData = () => {
    setDataObj(initialData);
    setStoreLogo(initialData?.store_logo || "");
    setSelectedCountries(initialData?.selling_countries);
    setSellingLocation(initialData?.selling_location_type);
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
                size="small"
                onClick={() => handleDiscardData()}
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
              textIcon={<HomeIcon />}
              text={__("General", "kirki-ecommerce")}
              handleBack={handleBackButton}
            />

            <StoreContactDetails
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
              storeLogo={storeLogo}
            />

            <StoreAddressDetails
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              errors={errors}
            />

            <SellingLocation
              handleOnChange={handleOnChange}
              errors={errors}
              setErrors={setErrors}
              sellingLocation={sellingLocation}
              setSellingLocation={setSellingLocation}
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
            />

            <OrderId
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              handleResetIDField={handleResetIDField}
              errors={errors}
            />

            <InvoiceId
              dataObj={dataObj}
              handleOnChange={handleOnChange}
              handleResetIDField={handleResetIDField}
              errors={errors}
            />
          </Flex>
        ) : (
          <div>{__("Loading ...", "kirki-ecommerce")}</div>
        )}
      </Container>
    </>
  );
};

export default GeneralSettings;
