import React, { useState, useMemo } from "react";

import Input from '@/molecules/input';
import Card from '@/molecules/card';
import Flex from '@/molecules/flex';
import Checkbox from '@/molecules/checkbox';
import Button from '@/molecules/button';

import Text from '@/molecules/text';
import { LocationIcon, SearchIcon } from "@/icons";
import { __ } from "@/wpi18n";
import { getSearchedValue } from "../../utils";
import { CLASS_PREFIX } from "@/conf";
import { Popover, PopoverBody, PopoverFooter, PopoverHeader } from '@/molecules/popover';

const AddCitiesPopup = (props) => {
  const {
    openPopup,
    setOpenPopup,
    taxRates,
    countryName,
    cityList,
    selectedCities,
    setSelectedCities,
    onAdd,
  } = props;

  const [searchValue, setSearchValue] = useState("");

  const allCityIds = useMemo(
    () => cityList?.map((city) => city.id) || [],
    [cityList]
  );

  const selectAll =
    selectedCities.length > 0 && selectedCities.length === allCityIds.length;

  const isPartialChecked =
    selectedCities.length > 0 && selectedCities.length < allCityIds.length;

  const handleToggleCity = (city) => {
    setSelectedCities((prev = []) => {
      const exists = prev.some((c) => c.id === city.id);

      if (exists) {
        return prev.filter((c) => c.id !== city.id);
      }

      return [...prev, city];
    });
  };

  const filteredCities = getSearchedValue(
    searchValue,
    cityList.filter((city) => !taxRates.some((tax) => tax.state === city.title))
  );

  const handleSelectAll = () => {
    if (isPartialChecked) {
      setSelectedCities([]);
    } else {
      setSelectedCities(selectAll ? [] : [...cityList]);
    }
  };

  const buttonState = selectedCities?.length <= 0;

  return (
    <div>
      <Popover isOpen={openPopup}>
        <PopoverHeader
          borderBottom
          leftIcon={<LocationIcon />}
          onClose={() => setOpenPopup(false)}
        >
          {__("Add cities", "kirki-ecommerce")}
        </PopoverHeader>
        <PopoverBody>
          <Input
            type="search"
            leftIcon={<SearchIcon />}
            label={__("Cities", "kirki-ecommerce")}
            placeholder="Search"
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
                  value={isPartialChecked || selectAll}
                  isPartialChecked={isPartialChecked}
                  label={countryName}
                  onChange={handleSelectAll}
                />
              </Flex>

              {filteredCities?.length > 0 ? (
                filteredCities.map((city, index) => {
                  return (
                    <div
                      key={index}
                      className={`${CLASS_PREFIX}-checkbox-item`}
                      style={{
                        padding:
                          "var(--decom-spacing-2) var(--decom-spacing-5)",
                        width: "auto",
                      }}
                    >
                      <Checkbox
                        value={selectedCities.some(
                          (item) => item.id === city.id
                        )}
                        label={city.title}
                        onChange={() => handleToggleCity(city)}
                      />
                    </div>
                  );
                })
              ) : (
                <Card style={{ padding: "36px 0" }}>
                  <Flex
                    direction="column"
                    gap={8}
                    style={{ alignItems: "center" }}
                  >
                    <Text header={__("No cities available")} type="secondary" />
                  </Flex>
                </Card>
              )}
            </div>
          </Card>
        </PopoverBody>
        <PopoverFooter>
          <Button
            type="outlined"
            text={__("Cancel", "kirki-ecommerce")}
            size="small"
            onClick={() => {
              setSelectedCities(selectedCities);
              setOpenPopup(false);
            }}
          />
          <Button
            type="primary"
            text={__("Done", "kirki-ecommerce")}
            size="small"
            onClick={onAdd}
            state={buttonState ? "disabled" : "default"}
          />
        </PopoverFooter>
      </Popover>
    </div>
  );
};
export default AddCitiesPopup;
