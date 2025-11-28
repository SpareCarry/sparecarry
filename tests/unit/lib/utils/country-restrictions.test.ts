/**
 * Unit tests for country-specific restrictions
 */

import { describe, it, expect } from 'vitest';
import {
  getCountryRestrictions,
  isCategoryProhibitedForCountry,
  requiresDocumentationForCountry,
  checkCountryRestrictions,
} from '../../../../lib/utils/country-restrictions';

describe('Country Restrictions', () => {
  describe('getCountryRestrictions', () => {
    it('should return restrictions for known countries', () => {
      const auRestrictions = getCountryRestrictions('AU');
      expect(auRestrictions).toBeDefined();
      expect(auRestrictions?.countryCode).toBe('AU');
      expect(auRestrictions?.restrictions.prohibitedCategories).toContain('food');
    });

    it('should return undefined for unknown countries', () => {
      const restrictions = getCountryRestrictions('XX');
      expect(restrictions).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const restrictions1 = getCountryRestrictions('au');
      const restrictions2 = getCountryRestrictions('AU');
      expect(restrictions1).toEqual(restrictions2);
    });
  });

  describe('isCategoryProhibitedForCountry', () => {
    it('should identify prohibited categories for Australia', () => {
      expect(isCategoryProhibitedForCountry('food', 'AU')).toBe(true);
      expect(isCategoryProhibitedForCountry('medical', 'AU')).toBe(true);
      expect(isCategoryProhibitedForCountry('electronics', 'AU')).toBe(false);
    });

    it('should identify prohibited categories for Japan', () => {
      expect(isCategoryProhibitedForCountry('food', 'JP')).toBe(true);
      expect(isCategoryProhibitedForCountry('medical', 'JP')).toBe(true);
      expect(isCategoryProhibitedForCountry('electronics', 'JP')).toBe(false);
    });

    it('should return false for countries without restrictions', () => {
      expect(isCategoryProhibitedForCountry('food', 'US')).toBe(false);
    });
  });

  describe('requiresDocumentationForCountry', () => {
    it('should identify categories requiring documentation for Australia', () => {
      expect(requiresDocumentationForCountry('electronics', 'AU')).toBe(true);
      expect(requiresDocumentationForCountry('tools', 'AU')).toBe(true);
      expect(requiresDocumentationForCountry('clothing', 'AU')).toBe(false);
    });

    it('should identify categories requiring documentation for Japan', () => {
      expect(requiresDocumentationForCountry('electronics', 'JP')).toBe(true);
      expect(requiresDocumentationForCountry('clothing', 'JP')).toBe(false);
    });
  });

  describe('checkCountryRestrictions', () => {
    it('should detect prohibited items for destination country', () => {
      const result = checkCountryRestrictions('US', 'AU', 'food');
      expect(result.isRestricted).toBe(true);
      expect(result.restrictionType).toBe('prohibited');
      expect(result.reason).toBeDefined();
    });

    it('should detect items requiring documentation', () => {
      const result = checkCountryRestrictions('US', 'AU', 'electronics');
      expect(result.isRestricted).toBe(false); // Not prohibited, but requires docs
      expect(result.restrictionType).toBe('requires_documentation');
      expect(result.reason).toBeDefined();
    });

    it('should return no restrictions for allowed items', () => {
      const result = checkCountryRestrictions('US', 'CA', 'clothing');
      expect(result.isRestricted).toBe(false);
      expect(result.reason).toBeUndefined();
    });

    it('should check origin country restrictions', () => {
      const result = checkCountryRestrictions('AU', 'US', 'food');
      expect(result.isRestricted).toBe(true);
    });
  });
});

