import React, { useState, useMemo, useEffect } from "react";
import {
  Input,
  Checkbox,
  Button,
  Popover,
  Card,
  PopoverBody,
  PopoverHeader,
  Flex,
  PopoverFooter,
} from "../../../../molecules";
import { SearchIcon, LocationIcon } from "icons";
import { CLASS_PREFIX } from "conf";
import { __, sprintf } from "wpi18n";
import { useSelector } from "react-redux";
import { getSearchedCountries } from "../../utils";
import { groupEUCountries } from "../helper";
import useGetListAPI from "../../../../hooks/useGetListAPI";
import { getCountriesAPI } from "../../../../store/countriesSlice";

const TaxRegionPopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    regions,
    selectedCountries = [],
    setSelectedCountries = () => {},
    setSelectedRegion = () => {},
    selectedRegion = [],
    onAdd = () => {},
    errors,
  } = props;

  const [searchValue, setSearchValue] = useState("");
  const [initialObj, setInitialObj] = useState({ countries: [], regions: [] });
  const countryList = useSelector((state) => state.countries?.data);
  const updatedCountryList = groupEUCountries(countryList);

  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  useEffect(() => {
    if (openPopup) {
      setInitialObj({
        countries: [...selectedCountries],
        regions: [...selectedRegion],
      });
    }
  }, [openPopup]);

  const filteredCountries = useMemo(() => {
    if (!updatedCountryList?.length) return [];

    const searched = searchValue?.trim()
      ? getSearchedCountries(searchValue, updatedCountryList)
      : updatedCountryList;

    return searched.filter(
      (country) => !regions.some((r) => r.code === country.code),
    );
  }, [searchValue, updatedCountryList, regions]);

  const handleSelectCountries = (country) => {
    setSelectedCountries((prev = []) => {
      const isSelected = prev.includes(country.code);
      if (isSelected) {
        return prev.filter((c) => c !== country.code);
      }
      return [...prev, country.code];
    });

    setSelectedRegion((prev = []) => {
      const exists = prev.find((r) => r.country === country.name);

      if (exists) {
        return prev.filter((r) => r.country !== country.name);
      }
      return [
        ...prev,
        {
          id: country.code,
          country: country.name,
          states: country.states.map((s) => ({
            id: s.id,
            title: s.name,
            flag: s.flag || "",
          })),
          hasDeselectedState: false,
          flag: country.flag || "",
        },
      ];
    });
  };

  const handleSelectStates = (stateId, countryCode, allStates = [], flag) => {
    setSelectedRegion((prev = []) => {
      const countryIndex = prev.findIndex((item) => item.id === countryCode);
      if (countryIndex === -1) return prev;
      const countryItem = prev[countryIndex];
      const stateExists = countryItem.states.some((s) => s.id === stateId);

      let updatedStates;
      if (stateExists) {
        updatedStates = countryItem.states.filter((s) => s.id !== stateId);
      } else {
        updatedStates = [
          ...countryItem.states,
          {
            id: stateId,
            title: allStates.find((s) => s.id === stateId)?.name || stateId,
            flag: flag || "",
          },
        ];
      }

      if (updatedStates.length === 0) {
        setSelectedCountries((prevCountries = []) =>
          prevCountries.filter((c) => c !== countryCode),
        );
        return prev.filter((_, i) => i !== countryIndex);
      }
      const hasDeselectedState = updatedStates.length !== allStates.length;
      return prev.map((item, index) =>
        index === countryIndex
          ? { ...item, states: updatedStates, hasDeselectedState }
          : item,
      );
    });
  };
  const handleSearchRegion = (value) => {
    setSearchValue(value);
  };

  const handleClose = () => {
    setSelectedCountries(initialObj?.countries);
    setSelectedRegion(initialObj?.regions);
    setOpenPopup(false);
  };

  const buttonState = selectedCountries?.length >= 1;

  return (
    <>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__("Add tax region", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody
          style={{
            rowGap: "var(--decom-spacing-3)",
          }}
        >
          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__("Select countries", "kirki-ecommerce")}
            placeholder="Cities"
            onChange={(value) => handleSearchRegion(value)}
          />

          <Card
            type={"table"}
            style={{ borderRadius: "var(--decom-radius-rounded-md)" }}
          >
            <div
              style={{
                height: "350px",
                overflowX: "hidden",
                overflowY: "scroll",
              }}
            >
              <Flex className={`${CLASS_PREFIX}-popover-heading-wrapper-dark`}>
                {__("Name", "kirki-ecommerce")}
              </Flex>

              {filteredCountries?.length > 0 &&
                filteredCountries?.map((country, index) => {
                  const regionInfo = selectedRegion.find(
                    (region) => region?.country === country.code,
                  );
                  return (
                    <div
                      key={index}
                      className={`${CLASS_PREFIX}-checkbox-item`}
                    >
                      <Checkbox
                        value={selectedCountries?.includes(country?.code)}
                        isPartialChecked={regionInfo?.hasDeselectedState}
                        label={sprintf(__("%s", "kirki-ecommerce"), country.name)}
                        onChange={() => handleSelectCountries(country)}
                        leftIcon={country?.flag}
                      />
                      {selectedCountries?.includes(country.code) &&
                      country?.states.length > 0 ? (
                        <div
                          style={{ padding: "var(--decom-radius-rounded-xl)" }}
                        >
                          {country?.states.map((state, index) => {
                            return (
                              <div
                                key={index}
                                className={`${CLASS_PREFIX}-checkbox-item`}
                              >
                                <Checkbox
                                  value={selectedRegion
                                    ?.find((r) => r.id === country.code)
                                    ?.states.some((s) => s.id === state?.id)}
                                  label={sprintf(__("%s", "kirki-ecommerce"), state.name)}
                                  onChange={() =>
                                    handleSelectStates(
                                      state.id,
                                      country.code,
                                      country.states,
                                      state?.flag,
                                    )
                                  }
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
            </div>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            size="small"
            onClick={handleClose}
          />
          <Button
            type="primary"
            text={__("Done", "kirki-ecommerce")}
            size="small"
            onClick={onAdd}
            state={buttonState ? "default" : "disabled"}
          />
        </PopoverFooter>
      </Popover>
    </>
  );
};

export default TaxRegionPopup;
