import React, { useState } from "react";

import Input from '@/molecules/input';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Checkbox from '@/molecules/checkbox';
import Button from '@/molecules/button';

import { LocationIcon, SearchIcon } from "@/icons";
import { __, sprintf } from "@/wpi18n";
import { getSearchedValue } from "../../../utils";
import { CLASS_PREFIX } from "@/conf";
import { Popover, PopoverBody, PopoverFooter, PopoverHeader } from '@/molecules/popover';

export const AddStatePopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    countryName = "",
    countryList,
    selectedCountries,
    setSelectedCountries,
    onAdd,
  } = props;

  const [searchValue, setSearchValue] = useState("");
  const allCountryIds = countryList.map((country) => country?.id);
  const selectAll =
    selectedCountries.length > 0 &&
    selectedCountries.length === allCountryIds.length;

  const handleToggleCountry = (countryId) => {
    setSelectedCountries((prev) =>
      prev.includes(countryId)
        ? prev.filter((id) => id !== countryId)
        : [...prev, countryId]
    );
  };

  const filteredCountries = getSearchedValue(searchValue, countryList);

  const handleSelectAll = () => {
    setSelectedCountries(selectAll ? [] : allCountryIds);
  };

  return (
    <div>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__("Select destination", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody>
          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__("Regions", "kirki-ecommerce")}
            placeholder={__("Search", "kirki-ecommerce")}
            onChange={(value) => setSearchValue(value)}
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
                <Checkbox
                  value={selectAll}
                  label={countryName || __("EU", "kirki-ecommerce")}
                  onChange={handleSelectAll}
                />
              </Flex>

              {filteredCountries?.map((country, index) => {
                return (
                  <div
                    key={index}
                    style={{
                      padding: "var(--decom-spacing-2) var(--decom-spacing-5)",
                      width: "auto",
                    }}
                    className={`${CLASS_PREFIX}-checkbox-item`}
                  >
                    <Checkbox
                      value={selectedCountries?.includes(country?.title)}
                      label={sprintf(__("%s", "kirki-ecommerce"), country?.title)}
                      onChange={() => handleToggleCountry(country?.title)}
                      leftIcon={country?.flag}
                    />
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
            onClick={() => {
              setSelectedCountries(selectedCountries);
              setOpenPopup(false);
            }}
          />
          <Button
            type="primary"
            text={__("Done", "kirki-ecommerce")}
            size="small"
            onClick={onAdd}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
