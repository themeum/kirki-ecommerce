import Select from '@/molecules/select/select';
import React from "react";
import { useSelector } from "react-redux";
import { __ } from "@/wpi18n";
import { getCountriesAPI } from "../store/countriesSlice";
import useGetListAPI from "../hooks/useGetListAPI";

const CountrySelector = ({
  label,
  helpText,
  value,
  onChange,
  error,
  multiple = false,
}) => {
  useGetListAPI({
    reducerName: "countries",
    apiCallBack: getCountriesAPI,
    limit: -1,
  });
  const countries = useSelector((state) => state.countries?.data) || [];
  const optionsArray = countries.map((country) => ({
    value: country.code,
    title: country.name,
    leftIcon: country.flag, // assuming country.flag is a URL or component
  }));
  return (
    <Select
      label={label || __("Country / Region", "kirki-ecommerce")}
      value={value}
      optionsArray={optionsArray}
      defaultValue={value}
      onChange={(value) => onChange(value)}
      error={error}
      helpText={helpText}
      multiple={multiple}
    />
  );
};

export default CountrySelector;
