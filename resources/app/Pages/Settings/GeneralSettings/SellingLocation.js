import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Text,
  Flex,
  Select,
  Tag,
  Dropdown,
  DropdownTrigger,
  DropdownMenuContent,
  Checkbox,
  Input,
  ActionGroup,
  Button,
} from "../../../molecules";
import { CloseIcon, PlusCircleIcon, SearchIcon } from "@/Icons";
import { CLASS_PREFIX } from "@/conf";
import { useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { getSearchedValue, setUnsavedDataStatus } from "../utils";
import { getCountriesAPI } from "../../../store/countriesSlice";
import useGetListAPI from "../../../hooks/useGetListAPI";

const SellingLocation = (props) => {
  const {
    handleOnChange,
    errors,
    setErrors,
    sellingLocation,
    setSellingLocation,
    selectedCountries,
    setSelectedCountries,
  } = props;
  const triggerRef = useRef(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const [isSelectedAllCountries, setIsSelectedAllCountries] = useState(false);

  const countryList = useSelector((state) => state.countries?.data);
  const [searchValue, setSearchValue] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(countryList);

  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });

  useEffect(() => {
    setFilteredCountries(countryList);
    setSearchValue("");
  }, [countryList, showCountrySelector]);

  const handleSelectCountries = (value) => {
    if (!value) return;
    setSelectedCountries((prev = []) => {
      if (!Array.isArray(prev)) return [value];

      return prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value];
    });
  };

  const handleSaveSelectedCountries = () => {
    if (sellingLocation === "excluded-countries") {
      if (isSelectedAllCountries) {
        setErrors((prev) => ({
          ...prev,
          "data.selling_location_type": "You must select a country",
        }));
        setSelectedCountries([]);
      } else {
        setErrors((prev) => ({
          ...prev,
          ["data.selling_location_type"]: null,
        }));
      }
    } else {
      if (isSelectedAllCountries) {
        setSellingLocation("all-countries");
        setSelectedCountries([]);
      }
    }
    setUnsavedDataStatus(true);
    setSearchValue("");
    setShowCountrySelector(false);
  };

  const handleSearchValue = (value) => {
    setSearchValue(value);

    if (!value) {
      setFilteredCountries(countryList);
      return;
    }
    const result = getSearchedValue(value, countryList);
    setFilteredCountries(result);
  };

  return (
    <div>
      <Card type="large">
        <Text
          header={__("Selling Locations", "kirki-ecommerce")}
          subHeader={__(
            "Select the countries where you want to sell your products.",
            "kirki-ecommerce",
          )}
          type="primary"
          style={{ gap: "var(--decom-spacing-f3)" }}
        />

        <Card type="inner" style={{ padding: "var(--decom-spacing-4)" }}>
          <Flex direction="column" gap={16}>
            <Select
              helpText={__(
                "Select the countries where you want to sell your products.",
                "kirki-ecommerce",
              )}
              value={sellingLocation}
              label={__("Selling", "kirki-ecommerce")}
              optionsArray={[
                { title: __("All Countries", "kirki-ecommerce"), value: "all-countries" },
                {
                  title: __("Specific Countries", "kirki-ecommerce"),
                  value: "selected-countries",
                },
                {
                  title: __("All Countries Except", "kirki-ecommerce"),
                  value: "excluded-countries",
                },
              ]}
              onChange={(value) =>
                handleOnChange(value, "selling_location_type")
              }
              error={errors["data.selling_location_type"]}
            />
            {selectedCountries?.length > 0 && (
              <Flex gap={8}>
                {selectedCountries.map((item, index) => (
                  <Tag
                    key={index}
                    closeIcon={<CloseIcon />}
                    text={item}
                    onTagRemove={() => handleSelectCountries(item)}
                  />
                ))}
              </Flex>
            )}
            {(sellingLocation === "selected-countries" ||
              sellingLocation === "excluded-countries") && (
              <>
                <Dropdown>
                  <DropdownTrigger ref={triggerRef}>
                    <Button
                      leftIcon={<PlusCircleIcon />}
                      text={__("Add Countries", "kirki-ecommerce")}
                      type="secondary"
                      size="small"
                      onClick={() =>
                        setShowCountrySelector(!showCountrySelector)
                      }
                    />
                  </DropdownTrigger>
                  <DropdownMenuContent
                    style={{
                      border: "none",
                      boxShadow: "0 1px 1px 0 #000000 0.1",
                      width: "316px",
                    }}
                    triggerRef={triggerRef}
                    isOpen={showCountrySelector}
                    size="default"
                    onClose={() => {
                      setShowCountrySelector(false);
                    }}
                    position={{
                      bottom: true,
                    }}
                  >
                    <div className={`${CLASS_PREFIX}-search-input-field`}>
                      <Input
                        type="search"
                        leftIcon={<SearchIcon />}
                        value={searchValue}
                        placeholder={__("e.g United States", "kirki-ecommerce")}
                        onChange={(value) => handleSearchValue(value)}
                      />
                    </div>

                    <div className={`${CLASS_PREFIX}-country-selector-wrapper`}>
                      {filteredCountries?.length > 0 &&
                        filteredCountries.map((country, index) => (
                          <div
                            key={index}
                            className={`${CLASS_PREFIX}-checkbox-item`}
                          >
                            <Checkbox
                              value={
                                isSelectedAllCountries
                                  ? isSelectedAllCountries
                                  : selectedCountries?.includes(country.name)
                              }
                              label={country.name}
                              onChange={() =>
                                handleSelectCountries(country.name)
                              }
                            />
                          </div>
                        ))}
                    </div>
                    <ActionGroup
                      style={{
                        padding:
                          "var(--decom-spacing-3) var(--decom-spacing-5)",
                        justifyContent: "space-between",
                      }}
                    >
                      <Checkbox
                        value={isSelectedAllCountries}
                        label={__("Select All", "kirki-ecommerce")}
                        onChange={() => {
                          setIsSelectedAllCountries(!isSelectedAllCountries);
                        }}
                        labelStyle={{ fontWeight: "400" }}
                      />
                      <Flex gap={8}>
                        <Button
                          type="ghost"
                          text={__("Cancel", "kirki-ecommerce")}
                          size="small"
                          onClick={() => {
                            setSelectedCountries(selectedCountries);
                            setShowCountrySelector(false);
                          }}
                        />
                        <Button
                          type="primary"
                          text={__("Done", "kirki-ecommerce")}
                          size="small"
                          onClick={handleSaveSelectedCountries}
                        />
                      </Flex>
                    </ActionGroup>
                  </DropdownMenuContent>
                </Dropdown>
              </>
            )}
          </Flex>
        </Card>
      </Card>
    </div>
  );
};

export default SellingLocation;
