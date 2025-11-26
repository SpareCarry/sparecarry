/**
 * "Is this Allowed to Carry?" Rules Engine
 * 
 * Validates items against shipping/carry rules and returns warnings
 */

export interface AllowedResult {
  allowed: boolean;
  warnings: string[];
  restrictions: string[];
}

export interface ItemDetails {
  category?: string;
  title?: string;
  description?: string;
  hasBatteries?: boolean;
  hasLiquids?: boolean;
  liquidVolume?: number; // in ml
  weight?: number; // in kg
  value?: number;
  isFood?: boolean;
  isMedicine?: boolean;
  containsAlcohol?: boolean;
}

/**
 * Check if item is allowed to carry based on rules
 */
export function isAllowedToCarry(details: ItemDetails): AllowedResult {
  const warnings: string[] = [];
  const restrictions: string[] = [];
  let allowed = true;

  // Rule 1: Batteries
  if (details.hasBatteries) {
    allowed = true; // Allowed but with warnings
    warnings.push('⚠️ Contains batteries - ensure proper packaging to prevent short circuits');
    warnings.push('Lithium batteries may have airline restrictions - check with carrier');
  }

  // Rule 2: Liquids
  if (details.hasLiquids) {
    if (details.liquidVolume && details.liquidVolume > 100) {
      restrictions.push('Liquid volume exceeds 100ml - may not be allowed in carry-on');
      warnings.push('Large liquids may need to be in checked luggage');
    } else {
      warnings.push('Contains liquids - ensure sealed and leak-proof packaging');
    }
  }

  // Rule 3: Food items
  if (details.isFood || details.category?.toLowerCase().includes('food')) {
    allowed = true;
    warnings.push('🌍 Food items may be restricted by customs - check destination country regulations');
    warnings.push('Perishable items may not survive long journeys');
  }

  // Rule 4: Medicines
  if (details.isMedicine || details.category?.toLowerCase().includes('medicine')) {
    allowed = true;
    restrictions.push('💊 Prescription medicines require original packaging and documentation');
    warnings.push('Some medicines may be restricted or require permits in certain countries');
    warnings.push('Keep medicines in carry-on luggage for safety');
  }

  // Rule 5: Alcohol
  if (details.containsAlcohol) {
    allowed = true;
    restrictions.push('🍷 Alcohol has quantity limits and age restrictions');
    warnings.push('Check destination country alcohol import limits');
  }

  // Rule 6: High value items
  if (details.value && details.value > 5000) {
    warnings.push('💰 High value item - consider additional insurance');
    warnings.push('May require proof of ownership for customs');
  }

  // Rule 7: Heavy items
  if (details.weight && details.weight > 25) {
    warnings.push('⚠️ Heavy item - verify traveler can handle weight');
    warnings.push('Additional fees may apply for excess weight');
  }

  // Rule 8: Dangerous goods
  const dangerousKeywords = ['explosive', 'flammable', 'toxic', 'radioactive', 'corrosive'];
  const text = `${details.title} ${details.description}`.toLowerCase();
  for (const keyword of dangerousKeywords) {
    if (text.includes(keyword)) {
      allowed = false;
      restrictions.push(`❌ Item contains dangerous goods (${keyword}) - NOT ALLOWED`);
      break;
    }
  }

  // Rule 9: Weapons
  const weaponKeywords = ['weapon', 'gun', 'knife', 'sword', 'ammunition', 'firearm'];
  for (const keyword of weaponKeywords) {
    if (text.includes(keyword)) {
      allowed = false;
      restrictions.push(`🚫 Weapons are strictly prohibited`);
      break;
    }
  }

  return {
    allowed,
    warnings,
    restrictions,
  };
}

