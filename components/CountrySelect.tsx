/**
 * CountrySelect Component
 *
 * A searchable, debounced dropdown for selecting countries.
 * Supports both controlled (value + onChange) and uncontrolled (onSelect) APIs.
 * Optimized for performance with 250+ countries.
 *
 * Features:
 * - Searchable input with debounced filter (default 250ms)
 * - Fast list rendering
 * - Displays country name and ISO2 code
 * - Returns selected Country object { name, iso2, iso3 }
 * - Accessible (keyboard navigation) and touch-friendly
 * - Works with React Hook Form
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Search, ChevronDown, Check } from "lucide-react";
import {
  COUNTRIES,
  Country,
  getCountryByIso2,
} from "../src/constants/countries";
import { cn } from "../lib/utils";

export interface CountrySelectProps {
  /** Label for the select */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Controlled value - ISO2 code */
  value?: string;
  /** Controlled onChange handler - receives ISO2 code */
  onChange?: (iso2: string) => void;
  /** Uncontrolled onSelect handler - receives full Country object */
  onSelect?: (country: Country) => void;
  /** Debounce delay in milliseconds (default: 250ms) */
  debounceMs?: number;
  /** Show ISO2 code in display */
  showIso2?: boolean;
  /** Required field indicator */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional className */
  className?: string;
  /** HTML id attribute */
  id?: string;
}

export function CountrySelect({
  label,
  placeholder = "Search country or ISO",
  value,
  onChange,
  onSelect,
  debounceMs = 250,
  showIso2 = true,
  required = false,
  error,
  disabled = false,
  className = "",
  id,
}: CountrySelectProps) {
  const [query, setQuery] = useState("");
  const [filteredCountries, setFilteredCountries] =
    useState<Country[]>(COUNTRIES);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get selected country from value (ISO2)
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    return getCountryByIso2(value);
  }, [value]);

  // Initialize query with selected country name
  useEffect(() => {
    if (selectedCountry && !isOpen) {
      setQuery(selectedCountry.name);
    } else if (!selectedCountry && !isOpen) {
      setQuery("");
    }
  }, [selectedCountry, isOpen]);

  // Filter countries based on query
  const filterCountries = useCallback((searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setFilteredCountries(COUNTRIES);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase().trim();
    const filtered = COUNTRIES.filter(
      (country) =>
        country.name.toLowerCase().includes(lowerQuery) ||
        country.iso2.toLowerCase().includes(lowerQuery) ||
        country.iso3.toLowerCase().includes(lowerQuery)
    );
    setFilteredCountries(filtered);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(() => {
      filterCountries(query);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs, filterCountries]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setIsOpen(true);
    setSelectedIndex(-1);

    // If query is cleared, clear selection
    if (!newQuery.trim() && value) {
      onChange?.("");
      onSelect?.(undefined as any);
    }
  };

  // Handle country selection
  const handleSelect = useCallback(
    (country: Country) => {
      setQuery(country.name);
      setIsOpen(false);
      setSelectedIndex(-1);

      // Call both handlers if provided
      onChange?.(country.iso2);
      onSelect?.(country);
    },
    [onChange, onSelect]
  );

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setSelectedIndex((prev) =>
          prev < filteredCountries.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && filteredCountries[selectedIndex]) {
          handleSelect(filteredCountries[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        setIsOpen(false);
        break;
    }
  };

  // Handle input focus
  const handleFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      filterCountries(query);
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && dropdownRef.current) {
      const selectedElement = dropdownRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const displayValue = selectedCountry
    ? showIso2
      ? `${selectedCountry.name} (${selectedCountry.iso2})`
      : selectedCountry.name
    : query;

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400" />
          <Input
            ref={inputRef}
            id={id}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              "pl-10 pr-10",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-autocomplete="list"
            role="combobox"
          />
          <ChevronDown
            className={cn(
              "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-slate-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>

        {/* Dropdown */}
        {isOpen && !disabled && (
          <div
            ref={dropdownRef}
            className="absolute z-[60] mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg"
            role="listbox"
          >
            {isSearching ? (
              <div className="px-4 py-2 text-sm text-slate-500">
                Searching...
              </div>
            ) : filteredCountries.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-500">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country, index) => (
                <button
                  key={country.iso2}
                  type="button"
                  role="option"
                  aria-selected={selectedCountry?.iso2 === country.iso2}
                  className={cn(
                    "w-full px-4 py-2 text-left transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none",
                    selectedCountry?.iso2 === country.iso2 &&
                      "bg-teal-50 hover:bg-teal-100",
                    selectedIndex === index && "bg-slate-100"
                  )}
                  onClick={() => handleSelect(country)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="relative flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">
                      {country.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {showIso2 && (
                        <span className="text-xs text-slate-500">
                          {country.iso2}
                        </span>
                      )}
                      {selectedCountry?.iso2 === country.iso2 && (
                        <Check className="h-4 w-4 text-teal-600" />
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
