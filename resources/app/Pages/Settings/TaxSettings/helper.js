export const groupEUCountries = (countryList = []) => {
  if (!Array.isArray(countryList)) return [];

  const euCountries = [];
  const nonEuCountries = [];

  countryList.forEach((country) => {
    if (country.group === "eu") {
      euCountries.push(country);
    } else {
      nonEuCountries.push(country);
    }
  });

  if (!euCountries.length) return nonEuCountries;

  const euCountry = {
    name: "EU",
    code: "EU",
    group: "eu",
    flag: "🇪🇺",
    states: euCountries.map((country) => ({
      id: country.name,
      name: country.name,
      code: country.code,
      flag: country.flag,
    })),
  };

  return [euCountry, ...nonEuCountries];
};
