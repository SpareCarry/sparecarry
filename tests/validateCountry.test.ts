/**
 * Unit Test: Country Validation
 * 
 * Tests the country validation utility functions.
 */

import { describe, it, expect } from 'vitest';
import {
  isValidIso2,
  isValidIso3,
  getCountryByIso2,
  normalizeIso2,
} from '../src/utils/validateCountry';

describe('Country Validation', () => {
  describe('isValidIso2', () => {
    it('should return true for valid ISO2 codes', () => {
      expect(isValidIso2('US')).toBe(true);
      expect(isValidIso2('GB')).toBe(true);
      expect(isValidIso2('CA')).toBe(true);
      expect(isValidIso2('AU')).toBe(true);
      expect(isValidIso2('DE')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidIso2('us')).toBe(true);
      expect(isValidIso2('Us')).toBe(true);
      expect(isValidIso2('US')).toBe(true);
    });

    it('should return false for invalid ISO2 codes', () => {
      expect(isValidIso2('')).toBe(false);
      expect(isValidIso2('X')).toBe(false);
      expect(isValidIso2('XXX')).toBe(false);
      expect(isValidIso2('ZZ')).toBe(false);
      expect(isValidIso2('123')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      // TypeScript should catch these, but test runtime behavior
      expect(isValidIso2(null as any)).toBe(false);
      expect(isValidIso2(undefined as any)).toBe(false);
      expect(isValidIso2(123 as any)).toBe(false);
    });
  });

  describe('isValidIso3', () => {
    it('should return true for valid ISO3 codes', () => {
      expect(isValidIso3('USA')).toBe(true);
      expect(isValidIso3('GBR')).toBe(true);
      expect(isValidIso3('CAN')).toBe(true);
      expect(isValidIso3('AUS')).toBe(true);
      expect(isValidIso3('DEU')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isValidIso3('usa')).toBe(true);
      expect(isValidIso3('Usa')).toBe(true);
      expect(isValidIso3('USA')).toBe(true);
    });

    it('should return false for invalid ISO3 codes', () => {
      expect(isValidIso3('')).toBe(false);
      expect(isValidIso3('XX')).toBe(false);
      expect(isValidIso3('XXXX')).toBe(false);
      expect(isValidIso3('ZZZ')).toBe(false);
      expect(isValidIso3('123')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidIso3(null as any)).toBe(false);
      expect(isValidIso3(undefined as any)).toBe(false);
      expect(isValidIso3(123 as any)).toBe(false);
    });
  });

  describe('normalizeIso2', () => {
    it('should normalize valid ISO2 codes to uppercase', () => {
      expect(normalizeIso2('us')).toBe('US');
      expect(normalizeIso2('Us')).toBe('US');
      expect(normalizeIso2('US')).toBe('US');
      expect(normalizeIso2('gb')).toBe('GB');
      expect(normalizeIso2('ca')).toBe('CA');
    });

    it('should return null for invalid ISO2 codes', () => {
      expect(normalizeIso2('')).toBeNull();
      expect(normalizeIso2('X')).toBeNull();
      expect(normalizeIso2('XXX')).toBeNull();
      expect(normalizeIso2('ZZ')).toBeNull();
      expect(normalizeIso2('123')).toBeNull();
    });

    it('should return null for non-string inputs', () => {
      expect(normalizeIso2(null as any)).toBeNull();
      expect(normalizeIso2(undefined as any)).toBeNull();
      expect(normalizeIso2(123 as any)).toBeNull();
    });
  });

  describe('getCountryByIso2', () => {
    it('should return country object for valid ISO2', () => {
      const country = getCountryByIso2('US');
      expect(country).toBeDefined();
      expect(country?.iso2).toBe('US');
      expect(country?.iso3).toBe('USA');
      expect(country?.name).toBe('United States');
    });

    it('should return undefined for invalid ISO2', () => {
      expect(getCountryByIso2('ZZ')).toBeUndefined();
      expect(getCountryByIso2('')).toBeUndefined();
    });
  });
});

