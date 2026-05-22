import React, { useEffect, useState } from "react";
import { Card, Flex, Text } from "../../../molecules";
import GroupOptionCard from "../../../components/GroupOptionCard";
import { InfoIcon, IncreaseIcon } from "@/Icons";
import { __, sprintf } from "@/wpi18n";
import {
  deleteCurrencyDataByIdAPI,
  getAvailableCurrenciesAPI,
  setAvailableCurrencies,
  updateCurrencyData,
} from "../../../store/currenciesSlice";
import AddCurrencyPopup from "./AddCurrencyPopup";
import { dateFormatter, dispatchToastMessage } from "../../utils";
import EditCurrencyPopup from "./EditCurrencyPopup";
import { useDispatch } from "react-redux";

export const AvailableCurrencyList = ({ dataObj }) => {
  const dispatch = useDispatch();
  const [currencyList, setCurrencyList] = useState([]);
  const [isNewCurrencyAdded, setIsNewCurrencyAdded] = useState(false);
  const [editCurrency, setEditCurrency] = useState(null);

  const showApiProviderStatus =
    dataObj?.is_automatic_update_enabled === true &&
    dataObj?.api_provider &&
    dataObj?.last_sync_at &&
    dataObj?.next_sync_at;

  const fetchCurrencies = async () => {
    try {
      const data = await getAvailableCurrenciesAPI();
      const currencyList = data?.results;

      dispatch(setAvailableCurrencies(currencyList));
      const formattedCurrencies = currencyList?.map((item) => ({
        ...item,
        ...(item?.is_base && {
          badge1: __("Base Currency", "kirki-ecommerce"),
          is_toggle_disabled: true,
          is_action_disabled: true,
        }),
        is_enabled: item?.is_active,
        rightIcon: <IncreaseIcon />,
        rightText: item?.exchange_rate,
        icon: item?.symbol,
        actionsArray: getActionArray(item),
      }));

      setCurrencyList(formattedCurrencies);
    } catch (error) {
      console.error("Failed to load currencies", error);
    }
  };

  useEffect(() => {
    fetchCurrencies();
    setIsNewCurrencyAdded(false);
  }, [isNewCurrencyAdded]);

  const updateCurrencyList = async (item, key) => {
    if (key !== "is_base") {
      const selectedCurrency = currencyList?.find(
        (currency) => currency?.id === item?.id
      );
      if (!selectedCurrency) return;

      const payload = {
        items: [
          {
            ...selectedCurrency,
            [key]: !selectedCurrency[key],
          },
        ],
      };

      await updateData(payload);
      return;
    }

    const payload = {
      items: currencyList?.map((currency) => ({
        ...currency,
        is_base: currency?.id === item?.id,
      })),
    };
    await updateData(payload);
  };

  const updateData = async (payload) => {
    const result = await updateCurrencyData(payload);
    if (!result?.success) return;
    dispatchToastMessage("success", {
      title: __("Currency value updated", "kirki-ecommerce"),
    });

    fetchCurrencies();
  };

  const handleToggleCurrencyItem = async (item) => {
    await updateCurrencyList(item, "is_active");
  };

  const handleDeleteCurrencyItem = async (item) => {
    const initialList = [...currencyList];

    const updatedCurrencyList = currencyList?.filter(
      (currency) => currency?.id !== item?.id
    );
    setCurrencyList(updatedCurrencyList);

    dispatchToastMessage("delete", {
      title: __("Currency deleted", "kirki-ecommerce"),
      duration: 5000,
      undoAction: () => {
        setCurrencyList(initialList);
      },
      onSuccess: async () => {
        await deleteCurrencyDataByIdAPI(item.id);
        fetchCurrencies();
      },
    });
  };

  const handleAction = async (action, item) => {
    if (action === "delete") {
      handleDeleteCurrencyItem(item);
    } else if (action === "edit") {
      setEditCurrency(item);
    } else {
      await updateCurrencyList(item, "is_base");
    }
  };

  const getActionArray = (item) => {
    if (item?.is_base) return [];
    return [
      {
        title: __("Edit", "kirki-ecommerce"),
        value: "edit",
      },
      {
        title: __("Delete", "kirki-ecommerce"),
        value: "delete",
      },
      {
        title: __("Set as base currency", "kirki-ecommerce"),
        value: "set_base",
      },
    ];
  };

  return (
    <>
      <Card
        type="inner"
        style={{
          padding: "var(--decom-spacing-5)",
        }}
      >
        <Flex
          style={{
            justifyContent: "space-between",
            paddingBottom: "var(--decom-spacing-3)",
          }}
        >
          <Text header={__("Available Currencies", "kirki-ecommerce")} type="primary" />
          <AddCurrencyPopup setIsNewCurrencyAdded={setIsNewCurrencyAdded} />
        </Flex>
        <GroupOptionCard
          dataArr={currencyList}
          handleToggleItem={(item) => handleToggleCurrencyItem(item)}
          handleMoreOption={true}
          actionsArray={[]}
          handleAction={handleAction}
        />
        <Flex
          gap={8}
          style={{
            paddingTop: "var(--decom-spacing-2)",
          }}
        >
          <InfoIcon />
          <Text
            type="xsm"
            subHeader={
              showApiProviderStatus
                ? sprintf(
                    __(
                      "API connection is active. Last sync: %s. Next update %s.",
                      "kirki-ecommerce"
                    ),
                    dateFormatter(dataObj?.last_sync_at, "relative"),
                    dateFormatter(dataObj?.next_sync_at, "relative")
                  )
                : __("API connection is inactive", "kirki-ecommerce")
            }
          />
        </Flex>
      </Card>
      {editCurrency && (
        <EditCurrencyPopup
          editCurrency={editCurrency}
          setEditCurrency={setEditCurrency}
          handleUpdateData={updateData}
        />
      )}
    </>
  );
};
