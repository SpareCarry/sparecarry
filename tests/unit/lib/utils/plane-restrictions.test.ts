/**
 * Unit tests for plane restriction logic
 */

import { describe, it, expect } from "vitest";
import {
  checkPlaneRestrictions,
  getPlaneRestrictionDetails,
} from "../../../../lib/utils/plane-restrictions";

describe("Plane Restrictions", () => {
  describe("checkPlaneRestrictions", () => {
    it("should allow carry-on sized items", () => {
      const result = checkPlaneRestrictions({
        weight: 5, // kg
        length: 50, // cm
        width: 35, // cm
        height: 20, // cm
      });

      expect(result.canTransportByPlane).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should allow checked baggage sized items", () => {
      const result = checkPlaneRestrictions({
        weight: 25, // kg
        length: 150, // cm
        width: 50, // cm
        height: 30, // cm
      });

      expect(result.canTransportByPlane).toBe(true);
    });

    it("should allow oversized items (with warning)", () => {
      const result = checkPlaneRestrictions({
        weight: 40, // kg (within oversized limit)
        length: 160, // cm
        width: 80, // cm
        height: 50, // cm
        // Total: 290cm (within 320cm limit)
      });

      expect(result.canTransportByPlane).toBe(true);
      expect(result.restrictionType).toBe("oversized");
      expect(result.reason).toContain("oversized");
    });

    it("should reject items with restricted goods", () => {
      const result = checkPlaneRestrictions({
        weight: 5,
        length: 50,
        width: 35,
        height: 20,
        restrictedItems: true,
      });

      expect(result.canTransportByPlane).toBe(false);
      expect(result.restrictionType).toBe("dangerous_goods");
      expect(result.reason).toContain("Restricted items");
      expect(result.suggestedMethod).toBe("boat");
    });

    it("should reject items that are too heavy", () => {
      const result = checkPlaneRestrictions({
        weight: 50, // kg (exceeds 45kg limit)
        length: 100,
        width: 50,
        height: 30,
      });

      expect(result.canTransportByPlane).toBe(false);
      expect(result.restrictionType).toBe("weight");
      expect(result.reason).toContain("weight");
      expect(result.suggestedMethod).toBe("boat");
    });

    it("should reject items that are too large", () => {
      const result = checkPlaneRestrictions({
        weight: 30,
        length: 200, // cm (exceeds 158cm limit)
        width: 100,
        height: 50,
        // Total: 350cm (exceeds 320cm limit)
      });

      expect(result.canTransportByPlane).toBe(false);
      expect(result.restrictionType).toBe("size");
      expect(result.reason).toContain("dimensions");
      expect(result.suggestedMethod).toBe("boat");
    });

    it("should reject prohibited category items", () => {
      const result = checkPlaneRestrictions({
        weight: 5,
        length: 50,
        width: 35,
        height: 20,
        category: "explosives",
      });

      expect(result.canTransportByPlane).toBe(false);
      expect(result.restrictionType).toBe("category");
      expect(result.reason).toContain("category");
      expect(result.suggestedMethod).toBe("boat");
    });

    it("should handle various category restrictions", () => {
      const prohibitedCategories = [
        "explosives",
        "flammable",
        "toxic",
        "weapons",
      ];

      prohibitedCategories.forEach((category) => {
        const result = checkPlaneRestrictions({
          weight: 5,
          length: 50,
          width: 35,
          height: 20,
          category,
        });

        expect(result.canTransportByPlane).toBe(false);
        expect(result.restrictionType).toBe("category");
      });
    });
  });

  describe("getPlaneRestrictionDetails", () => {
    it("should correctly identify carry-on fit", () => {
      const details = getPlaneRestrictionDetails({
        weight: 5,
        length: 50,
        width: 35,
        height: 20,
      });

      expect(details.fitsCarryOn).toBe(true);
      expect(details.fitsCheckedBaggage).toBe(true);
      expect(details.fitsOversized).toBe(true);
    });

    it("should correctly identify checked baggage fit", () => {
      const details = getPlaneRestrictionDetails({
        weight: 25,
        length: 150,
        width: 50,
        height: 30,
      });

      expect(details.fitsCarryOn).toBe(false);
      expect(details.fitsCheckedBaggage).toBe(true);
      expect(details.fitsOversized).toBe(true);
    });

    it("should correctly identify oversized fit", () => {
      const details = getPlaneRestrictionDetails({
        weight: 40,
        length: 160,
        width: 80,
        height: 50,
      });

      expect(details.fitsCarryOn).toBe(false);
      expect(details.fitsCheckedBaggage).toBe(false);
      expect(details.fitsOversized).toBe(true);
    });

    it("should correctly identify items that exceed all limits", () => {
      const details = getPlaneRestrictionDetails({
        weight: 50,
        length: 200,
        width: 100,
        height: 50,
      });

      expect(details.fitsCarryOn).toBe(false);
      expect(details.fitsCheckedBaggage).toBe(false);
      expect(details.fitsOversized).toBe(false);
      expect(details.restrictionMessage).toBeDefined();
    });
  });
});
