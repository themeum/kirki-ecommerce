import React, { useState, useEffect } from "react";
import {
  Popover,
  PopoverHeader,
  PopoverBody,
  Select,
  Checkbox,
  Button,
  Input,
  PopoverFooter,
} from "../../../../molecules";
import { __ } from "@/wpi18n";
import { useSelector } from "react-redux";
import { CLASS_PREFIX } from "@/conf";
import useGetListAPI from "../../../../hooks/useGetListAPI";
import { getCountriesAPI } from "../../../../store/countriesSlice";
import { LocationIcon, SearchIcon } from "@/Icons";
export const SelectDestinationPopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    selectedRegion,
    selectedCountry,
    setSelectedCountry,
    setSelectedRegion,
    selectedConditionValue,
    setSelectedConditionValue,
    setRulesObj,
    ruleIndex,
  } = props;
  const countryList = useSelector((state) => state.countries?.data);
  const [stateList, setStateList] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);

  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  const countryOptions = countryList
    ?.filter((country) =>
      selectedRegion?.some((region) => region.country === country.code)
    )
    .map((country) => ({
      title: country.name,
      value: country.code,
      leftIcon: country.flag,
    }));

  useEffect(() => {
    if (!selectedCountry) return;

    const country = countryList?.find(
      (country) => country.code.toLowerCase() === selectedCountry.toLowerCase()
    );

    setStateList(country?.states || []);
    const statesFromCondition =
      selectedConditionValue?.country === selectedCountry
        ? selectedConditionValue.states
        : null;

    const regionForCountry = selectedRegion?.find(
      (r) => r.country.toLowerCase() === selectedCountry.toLowerCase()
    );

    setSelectedStates(statesFromCondition ?? regionForCountry?.states ?? []);
  }, [selectedCountry, countryList]);

  const handleSelectState = (stateId) => {
    setSelectedStates((prev) =>
      prev.includes(stateId)
        ? prev.filter((id) => id !== stateId)
        : [...prev, stateId]
    );
  };

  const updateRegionList = () => {
    setSelectedRegion((prev) =>
      prev.map((r) =>
        r.country === selectedCountry ? { ...r, states: selectedStates } : r
      )
    );
    if (ruleIndex !== -1) {
      setRulesObj((prev) =>
        prev.map((rule, idx) => {
          if (idx !== ruleIndex) return rule;

          const condition = rule.conditions?.[0];
          if (!condition || condition.type !== "destination_region")
            return rule;

          const isSameCountry = condition.value?.country === selectedCountry;

          return {
            ...rule,
            conditions: [
              {
                ...condition,
                value: isSameCountry
                  ? {
                      ...condition.value,
                      states: selectedStates,
                    }
                  : {
                      country: selectedCountry,
                      states: selectedStates,
                    },
              },
            ],
          };
        })
      );
    } else {
      setSelectedConditionValue({
        country: selectedCountry,
        states: selectedStates || [],
      });
    }
    setOpenPopup(false);
  };

  const handleSelectCountry = (value) => {
    setSelectedCountry(value);
  };

  return (
    <>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          onClose={() => setOpenPopup(false)}
          leftIcon={<LocationIcon />}
        >
          {__("Select destination", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            padding: "var(--decom-spacing-4) var(--decom-spacing-5)",
          }}
        >
          <Select
            label={__("Select country", "kirki-ecommerce")}
            optionsArray={countryOptions}
            value={selectedCountry}
            onChange={handleSelectCountry}
          />

          {/* {stateList?.length > 0 && ( */}
          <>
            <Input
              type="search"
              leftIcon={<SearchIcon />}
              label={__("Regions", "kirki-ecommerce")}
              placeholder={__("Search region or state", "kirki-ecommerce")}
              // onChange={(value) => handleSearchRegion(value)} TO-DO: search function
            />

            <div
              style={{
                height: "350px",
                overflowX: "hidden",
                overflowY: "scroll",
              }}
            >
              {stateList?.map((state, index) => (
                <div key={index} className={`${CLASS_PREFIX}-checkbox-item`}>
                  <Checkbox
                    value={selectedStates.includes(state.id)}
                    label={state.name}
                    onChange={() => handleSelectState(state?.id)}
                  />
                </div>
              ))}
            </div>
          </>
          {/* )} */}
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            onClick={() => {
              setOpenPopup(false);
            }}
          />
          <Button
            type="primary"
            text={__("Done", "kirki-ecommerce")}
            onClick={() => updateRegionList()}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};
