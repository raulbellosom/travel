import { City, Country, State } from "country-state-city";

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const compareByLabel = (left, right) => left.label.localeCompare(right.label);

const countries = Country.getAllCountries()
  .map((country) => ({
    value: country.isoCode,
    label: country.name,
    searchText: `${country.name} ${country.isoCode}`,
  }))
  .sort(compareByLabel);

const statesCache = new Map();
const citiesCache = new Map();

const getStates = (countryCode) => {
  if (!countryCode) return [];
  if (statesCache.has(countryCode)) return statesCache.get(countryCode);

  const states = State.getStatesOfCountry(countryCode)
    .map((state) => ({
      value: state.name,
      label: state.name,
      stateCode: state.isoCode,
      countryCode: state.countryCode,
      searchText: `${state.name} ${state.isoCode || ""}`.trim(),
    }))
    .sort(compareByLabel);

  statesCache.set(countryCode, states);
  return states;
};

const getCities = (countryCode, stateCode) => {
  if (!countryCode || !stateCode) return [];
  const cacheKey = `${countryCode}:${stateCode}`;
  if (citiesCache.has(cacheKey)) return citiesCache.get(cacheKey);

  const cities = City.getCitiesOfState(countryCode, stateCode)
    .map((city) => ({
      value: city.name,
      label: city.name,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
      searchText: city.name,
    }))
    .sort(compareByLabel);

  citiesCache.set(cacheKey, cities);
  return cities;
};

const findCountry = (value) => {
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;

  return (
    countries.find((country) => normalizeText(country.value) === normalizedValue) ||
    countries.find((country) => normalizeText(country.label) === normalizedValue) ||
    null
  );
};

const findState = (countryCode, value) => {
  const normalizedValue = normalizeText(value);
  if (!countryCode || !normalizedValue) return null;

  const states = getStates(countryCode);
  return (
    states.find((state) => normalizeText(state.value) === normalizedValue) ||
    states.find((state) => normalizeText(state.stateCode) === normalizedValue) ||
    null
  );
};

const findCity = (countryCode, stateCode, value) => {
  const normalizedValue = normalizeText(value);
  if (!countryCode || !stateCode || !normalizedValue) return null;

  const cities = getCities(countryCode, stateCode);
  return cities.find((city) => normalizeText(city.value) === normalizedValue) || null;
};

export const locationOptionsService = {
  getCountries: () => countries,
  getStates,
  getCities,
  findCountry,
  findState,
  findCity,
  normalizeText,
};
