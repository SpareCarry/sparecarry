/**
 * Unit Test: Countries List
 *
 * Tests the integrity of the static country list.
 */

import { describe, it, expect } from "vitest";
import {
  COUNTRIES,
  getCountryByIso2,
  getCountryByIso3,
} from "../src/constants/countries";

describe("Countries List", () => {
  it("should have at least one country", () => {
    expect(COUNTRIES.length).toBeGreaterThan(0);
  });

  it("should have all entries with required fields", () => {
    COUNTRIES.forEach((country) => {
      expect(country.name).toBeTruthy();
      expect(country.iso2).toBeTruthy();
      expect(country.iso3).toBeTruthy();
      expect(country.iso2.length).toBe(2);
      expect(country.iso3.length).toBe(3);
    });
  });

  it("should have no duplicate ISO2 codes", () => {
    const iso2Codes = COUNTRIES.map((c) => c.iso2.toUpperCase());
    const uniqueIso2Codes = new Set(iso2Codes);
    expect(uniqueIso2Codes.size).toBe(COUNTRIES.length);
  });

  it("should have no duplicate ISO3 codes", () => {
    const iso3Codes = COUNTRIES.map((c) => c.iso3.toUpperCase());
    const uniqueIso3Codes = new Set(iso3Codes);
    expect(uniqueIso3Codes.size).toBe(COUNTRIES.length);
  });

  it("should have no duplicate names", () => {
    const names = COUNTRIES.map((c) => c.name.toLowerCase());
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(COUNTRIES.length);
  });

  it("should include common countries", () => {
    const commonCountries = ["US", "GB", "CA", "AU", "DE", "FR", "JP", "CN"];
    commonCountries.forEach((iso2) => {
      const country = getCountryByIso2(iso2);
      expect(country).toBeDefined();
      expect(country?.iso2).toBe(iso2);
    });
  });

  it("getCountryByIso2 should return correct country", () => {
    const us = getCountryByIso2("US");
    expect(us).toBeDefined();
    expect(us?.name).toBe("United States");
    expect(us?.iso3).toBe("USA");

    const gb = getCountryByIso2("GB");
    expect(gb).toBeDefined();
    expect(gb?.name).toBe("United Kingdom");
    expect(gb?.iso3).toBe("GBR");
  });

  it("getCountryByIso2 should be case-insensitive", () => {
    const us1 = getCountryByIso2("US");
    const us2 = getCountryByIso2("us");
    const us3 = getCountryByIso2("Us");

    expect(us1).toEqual(us2);
    expect(us2).toEqual(us3);
  });

  it("getCountryByIso2 should return undefined for invalid codes", () => {
    expect(getCountryByIso2("")).toBeUndefined();
    expect(getCountryByIso2("X")).toBeUndefined();
    expect(getCountryByIso2("XXX")).toBeUndefined();
    expect(getCountryByIso2("ZZ")).toBeUndefined();
  });

  it("getCountryByIso3 should return correct country", () => {
    const usa = getCountryByIso3("USA");
    expect(usa).toBeDefined();
    expect(usa?.name).toBe("United States");
    expect(usa?.iso2).toBe("US");

    const gbr = getCountryByIso3("GBR");
    expect(gbr).toBeDefined();
    expect(gbr?.name).toBe("United Kingdom");
    expect(gbr?.iso2).toBe("GB");
  });

  it("getCountryByIso3 should be case-insensitive", () => {
    const usa1 = getCountryByIso3("USA");
    const usa2 = getCountryByIso3("usa");
    const usa3 = getCountryByIso3("Usa");

    expect(usa1).toEqual(usa2);
    expect(usa2).toEqual(usa3);
  });

  it("getCountryByIso3 should return undefined for invalid codes", () => {
    expect(getCountryByIso3("")).toBeUndefined();
    expect(getCountryByIso3("XX")).toBeUndefined();
    expect(getCountryByIso3("XXXX")).toBeUndefined();
    expect(getCountryByIso3("ZZZ")).toBeUndefined();
  });

  it("should have reasonable number of countries (195-250 range)", () => {
    // UN recognizes 195 countries, but we may include territories
    expect(COUNTRIES.length).toBeGreaterThanOrEqual(190);
    expect(COUNTRIES.length).toBeLessThanOrEqual(250);
  });
});
