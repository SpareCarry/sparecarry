/**
 * Location Input Component with Autocomplete
 *
 * Provides autocomplete functionality with optional marina/port filtering.
 * Supports debouncing, fallback options, and keyboard navigation.
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Loader2, MapPin, Anchor } from "lucide-react";
import { autocomplete, Place } from "../../lib/services/location";
import { LOCATION_CONFIG } from "../../config/location.config";

interface LocationInputProps {
  inputId?: string;
  name?: string;
  placeholder?: string;
  onSelect: (place: Place) => void;
  initialValue?: string;
  showOnlyMarinas?: boolean;
  allowFallbackToAny?: boolean;
  bbox?: [minLon: number, minLat: number, maxLon: number, maxLat: number];
  debounceMs?: number;
  className?: string;
  disabled?: boolean;
}

export function LocationInput({
  inputId,
  name,
  placeholder = "Search location...",
  onSelect,
  initialValue = "",
  showOnlyMarinas = false,
  allowFallbackToAny = true,
  bbox,
  debounceMs = LOCATION_CONFIG.DEFAULT_DEBOUNCE_MS,
  className = "",
  disabled = false,
}: LocationInputProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterMode, setFilterMode] = useState<"marina" | "any">(
    showOnlyMarinas ? "marina" : "any"
  );
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [noMarinasFound, setNoMarinasFound] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery || searchQuery.trim().length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        setNoMarinasFound(false);
        return;
      }

      console.log("[LocationInput] Starting search:", {
        query: searchQuery,
        filterMode,
        hasBbox: !!bbox,
        allowFallback: allowFallbackToAny,
      });

      setIsLoading(true);
      setNoMarinasFound(false);

      try {
        const results = await autocomplete(searchQuery, {
          limit: LOCATION_CONFIG.DEFAULT_AUTOCOMPLETE_LIMIT,
          filter: filterMode === "marina" ? "marina" : "any",
          bbox,
          allowFallback: allowFallbackToAny,
        });

        console.log("[LocationInput] Search results:", {
          query: searchQuery,
          resultCount: results.length,
          results: results.map((r) => r.name),
        });

        // Check if we filtered for marinas but got none
        if (
          filterMode === "marina" &&
          results.length === 0 &&
          allowFallbackToAny
        ) {
          setNoMarinasFound(true);
        }

        setSuggestions(results);
        setShowSuggestions(results.length > 0 || noMarinasFound);
      } catch (error) {
        console.error("[LocationInput] Autocomplete error:", {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          query: searchQuery,
        });
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    },
    [filterMode, bbox, allowFallbackToAny, noMarinasFound]
  );

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, performSearch, debounceMs]);

  // Handle selection
  const handleSelect = useCallback(
    (place: Place) => {
      setQuery(place.name);
      setShowSuggestions(false);
      setSuggestions([]);
      onSelect(place);
    },
    [onSelect]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showSuggestions || suggestions.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && suggestions[selectedIndex]) {
            handleSelect(suggestions[selectedIndex]);
          } else if (suggestions.length > 0) {
            handleSelect(suggestions[0]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSelect]
  );

  // Toggle filter mode
  const toggleFilterMode = useCallback(() => {
    const newMode = filterMode === "marina" ? "any" : "marina";
    setFilterMode(newMode);
    setNoMarinasFound(false);
    if (query.trim().length >= 2) {
      performSearch(query);
    }
  }, [filterMode, query, performSearch]);

  // Expand search when no marinas found
  const expandToAllResults = useCallback(async () => {
    setFilterMode("any");
    setNoMarinasFound(false);
    if (query.trim().length >= 2) {
      await performSearch(query);
    }
  }, [query, performSearch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          id={inputId}
          name={name || inputId}
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={disabled}
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          )}
          {!showOnlyMarinas && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleFilterMode}
              className="h-7 px-2 text-xs"
              title={
                filterMode === "marina"
                  ? "Show all places"
                  : "Show marinas only"
              }
            >
              <Anchor
                className={`h-3 w-3 ${filterMode === "marina" ? "text-teal-600" : "text-slate-400"}`}
              />
            </Button>
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {noMarinasFound && (
            <div className="border-b border-amber-200 bg-amber-50 p-3">
              <p className="mb-2 text-sm text-amber-800">
                No marinas found nearby
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={expandToAllResults}
                className="w-full text-xs"
              >
                Show all results
              </Button>
            </div>
          )}

          {suggestions.map((place, index) => (
            <button
              key={place.id || index}
              type="button"
              onClick={() => handleSelect(place)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-3 text-left transition-colors hover:bg-teal-50 focus:bg-teal-50 focus:outline-none ${
                index === selectedIndex ? "bg-teal-50" : ""
              } ${index < suggestions.length - 1 ? "border-b border-slate-100" : ""}`}
            >
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-600" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-slate-900">
                    {place.name}
                  </div>
                  {place.category && (
                    <div className="mt-0.5 text-xs text-slate-500">
                      {place.category}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
