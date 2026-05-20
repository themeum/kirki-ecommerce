import React, { useState } from "react";
import {
  Button,
  Popover,
  PopoverHeader,
  PopoverBody,
  Flex,
  Text,
  Input,
  Label,
  PopoverFooter,
} from "../../../molecules";
import { __, sprintf } from "wpi18n";
import { ArrowLeftIcon, InfoIcon } from "icons";
import { getErrorsObject } from "../../../store/utils";
import { createNewCurrencyAPI } from "../../../store/currenciesSlice";
import { dispatchToastMessage } from "../../utils";
import { CLASS_PREFIX } from "conf";
import { useSelector } from "react-redux";

const ExchangeRatePopup = (props) => {
  const {
    selectedCurrencyList = [],
    setSelectedCurrencyList,
    isOpen,
    setIsOpen,
    setAddCurrencyPopup,
    setIsNewCurrencyAdded,
    setSearchValue,
  } = props;
  const [currencies, setCurrencies] = useState(selectedCurrencyList || []);
  const [errors, setErrors] = useState({});

  const availableCurrencyList = useSelector(
    (state) => state.currencies?.data?.available
  );

  const handleOnChange = (value, currency, index) => {
    setCurrencies((prev = []) =>
      prev.map((item) =>
        item?.code.toLowerCase() === currency?.code.toLowerCase()
          ? { ...item, exchange_rate: value, is_base: false, is_active: true }
          : item
      )
    );
    setErrors((prev) => ({
      ...prev,
      [`items.${index}.exchange_rate`]: null,
    }));
  };

  const handleSaveCurrencyData = async () => {
    const payload = {
      items: currencies.map((item, idx) => ({
        ...item,
        is_base:
          availableCurrencyList?.length === 0 && idx === 0
            ? true
            : item?.is_base,
      })),
    };

    const result = await createNewCurrencyAPI(payload);

    if (result.success) {
      dispatchToastMessage("success", { title: "New currency added" });
      setIsOpen(false);
      setSelectedCurrencyList([]);
      setSearchValue("");
      setIsNewCurrencyAdded(true);
    } else {
      setErrors(getErrorsObject(result.errors));
    }
  };

  const handleClosePopup = () => {
    setSelectedCurrencyList([]);
    setIsOpen(false);
  };

  return (
    <>
      <Popover isOpen={isOpen} style={{ width: "442px" }}>
        <PopoverHeader
          leftIcon={<ArrowLeftIcon />} // TO-DO: add onClick action in popover header
          onClose={() => handleClosePopup()}
          style={{ gap: "var(--decom-spacing-1)" }}
          borderBottom
        >
          {__("Set Exchange Rates", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: "var(--decom-spacing-5)",
            gap: "var(--decom-spacing-4)",
          }}
        >
          <Label
            className={`${CLASS_PREFIX}-edit-currency-rate-popup-label`}
            text={__("Enter rates per 1 USD", "kirki-ecommerce")} // TO-DO: set the value dynamically
            leftIcon={<InfoIcon />}
          />
          <Flex
            direction="column"
            gap={16}
            style={{
              maxHeight: "200px",
              overflowX: "scroll",
            }}
          >
            {selectedCurrencyList?.length > 0 &&
              selectedCurrencyList?.map((currency, index) => (
                <Flex key={index} style={{ justifyContent: "space-between" }}>
                  <Flex gap={12}>
                    <Text
                      type="primary"
                      header={sprintf(__("%s", "kirki-ecommerce"), currency?.symbol)}
                    />
                    <Text
                      type="secondary"
                      header={sprintf(__("%s", "kirki-ecommerce"), currency?.code)}
                    />
                    <Text
                      type="xsm"
                      style={{ color: "var(--decom-text-text-subdued)" }}
                      header={sprintf(__("%s", "kirki-ecommerce"), currency?.name)}
                    />
                  </Flex>
                  <div
                    style={{
                      width: "auto",
                      margin: "var(--decom-spacing-f1)",
                    }}
                  >
                    <Input
                      placeholder={__("0.730", "kirki-ecommerce")}
                      style={{ width: "auto" }}
                      onChange={(value) =>
                        handleOnChange(value, currency, index)
                      }
                      error={errors[`items.${index}.exchange_rate`]}
                    />
                  </div>
                </Flex>
              ))}
          </Flex>
        </PopoverBody>
        <PopoverFooter>
          <Button
            text={__("Cancel", "kirki-ecommerce")}
            type={"outlined"}
            onClick={() => {
              setIsOpen(false);
              setAddCurrencyPopup(true);
            }}
          />
          <Button
            text={__("Save", "kirki-ecommerce")}
            type={"primary"}
            onClick={handleSaveCurrencyData}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default ExchangeRatePopup;
