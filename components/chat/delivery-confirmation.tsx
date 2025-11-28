"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { MapPin, Camera, Loader2, Search } from "lucide-react";
import { createClient } from "../../lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { useLoadScript, GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { searchMeetupLocations, meetupLocations, type MeetupLocation } from "../../lib/data/meetup-locations";

interface DeliveryConfirmationProps {
  matchId: string;
  onComplete: () => void;
}

interface Match {
  request_id: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "300px",
};

const defaultCenter = {
  lat: 12.0564, // Port Louis Marina, Grenada
  lng: -61.7486,
};

export function DeliveryConfirmation({
  matchId,
  onComplete,
}: DeliveryConfirmationProps) {
  const supabase = createClient() as SupabaseClient;
  const [photos, setPhotos] = useState<File[]>([]);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<MeetupLocation | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MeetupLocation[]>([]);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(10);
  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState<Match | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  // Get match details
  useQuery({
    queryKey: ["match-for-delivery", matchId],
    queryFn: async () => {
      const { data } = await supabase
        .from("matches")
        .select("request_id")
        .eq("id", matchId)
        .single();
      if (data) setMatch(data);
      return data;
    },
  });

  // Search locations
  useEffect(() => {
    if (searchQuery.length > 2) {
      const results = searchMeetupLocations(searchQuery);
      setSearchResults(results.slice(0, 5)); // Show top 5 results
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const handleLocationSelect = (location: MeetupLocation) => {
    setSelectedLocation(location);
    setMapCenter({ lat: location.latitude, lng: location.longitude });
    setMarkerPosition({ lat: location.latitude, lng: location.longitude });
    setGpsLat(location.latitude.toString());
    setGpsLng(location.longitude.toString());
    setMapZoom(15);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      setGpsLat(lat.toString());
      setGpsLng(lng.toString());
      setSelectedLocation(null); // Clear selected location if manually picking
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length <= 6) {
      setPhotos([...photos, ...files]);
    } else {
      alert("Maximum 6 photos allowed");
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setGpsLat(lat.toString());
          setGpsLng(lng.toString());
          setMarkerPosition({ lat, lng });
          setMapCenter({ lat, lng });
          setMapZoom(15);
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to get your location. Please select manually.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const uploadPhotos = async (): Promise<string[]> => {
    if (photos.length === 0) return [];

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const uploadedUrls: string[] = [];

    for (const photo of photos) {
      const fileExt = photo.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `deliveries/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("delivery-photos")
        .upload(filePath, photo);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("delivery-photos").getPublicUrl(filePath);

      uploadedUrls.push(publicUrl);
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (photos.length === 0) {
      alert("Please upload at least one photo of the item handover");
      return;
    }

    if (!gpsLat || !gpsLng) {
      alert("Please select a location on the map or use GPS");
      return;
    }

    setLoading(true);

    try {
      const photoUrls = await uploadPhotos();

      const gpsLocation = JSON.stringify({
        lat: parseFloat(gpsLat),
        lng: parseFloat(gpsLng),
      });

      // Find meetup location ID if selected
      let meetupLocationId: string | null = null;
      if (selectedLocation) {
        const index = meetupLocations.findIndex(
          (loc) =>
            loc.name === selectedLocation.name &&
            loc.latitude === selectedLocation.latitude &&
            loc.longitude === selectedLocation.longitude
        );
        if (index !== -1) {
          // In production, use actual database ID
          // For now, we'll store the location name in a custom field
          meetupLocationId = selectedLocation.name;
        }
      }

      // Create delivery record
      const { error: deliveryError } = await supabase.from("deliveries").insert({
        match_id: matchId,
        proof_photos: photoUrls,
        gps_lat_long: gpsLocation,
        meetup_location_id: meetupLocationId as any, // Store location name temporarily
        delivered_at: new Date().toISOString(),
      });

      if (deliveryError) throw deliveryError;

      // Update match status to 'completed' to trigger delivery stats increment
      const { error: matchError } = await supabase
        .from("matches")
        .update({ status: "completed", delivered_at: new Date().toISOString() })
        .eq("id", matchId);

      if (matchError) throw matchError;

      // Automatically apply karma points to the traveler
      try {
        const karmaResponse = await fetch("/api/karma/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        });
        
        if (karmaResponse.ok) {
          const karmaData = await karmaResponse.json();
          console.log("Karma points applied:", karmaData.karmaPoints);
        } else {
          // Log but don't fail the delivery if karma application fails
          console.warn("Failed to apply karma points:", await karmaResponse.text());
        }
      } catch (karmaError) {
        // Log but don't fail the delivery if karma application fails
        console.warn("Error applying karma points:", karmaError);
      }

      // Update request status
      if (match) {
        await supabase
          .from("requests")
          .update({ status: "matched" })
          .eq("id", match.request_id);
      }

      onComplete();
    } catch (error) {
      console.error("Error confirming delivery:", error);
      const message =
        error instanceof Error ? error.message : "Failed to confirm delivery";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <Card className="m-4">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="m-4">
      <CardContent className="pt-6">
        <h3 className="font-semibold mb-4 text-lg">Check In - Item Handover</h3>
        <p className="text-sm text-slate-600 mb-4">
          Upload photos and confirm your location to complete the delivery.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Search */}
          <div className="space-y-2">
            <Label>Search Meetup Location</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search marinas, airports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleLocationSelect(location)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                    >
                      <div className="font-medium text-sm">{location.name}</div>
                      <div className="text-xs text-slate-500">
                        {location.city}, {location.country} • {location.type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedLocation && (
              <div className="flex items-center gap-2 text-sm text-teal-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {selectedLocation.name}, {selectedLocation.city}
                </span>
              </div>
            )}
          </div>

          {/* Map Picker */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Location on Map</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getCurrentLocation}
              >
                <MapPin className="h-4 w-4 mr-1" />
                Use My Location
              </Button>
            </div>
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onClick={handleMapClick}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
              >
                {markerPosition && (
                  <Marker
                    position={markerPosition}
                    onClick={() => setShowInfoWindow(true)}
                  >
                    {showInfoWindow && (
                      <InfoWindow
                        position={markerPosition}
                        onCloseClick={() => setShowInfoWindow(false)}
                      >
                        <div className="text-sm">
                          <div className="font-medium">Selected Location</div>
                          <div className="text-slate-600">
                            {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
                          </div>
                        </div>
                      </InfoWindow>
                    )}
                  </Marker>
                )}
              </GoogleMap>
            </div>
            {markerPosition && (
              <div className="text-xs text-slate-500">
                GPS: {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
              </div>
            )}
          </div>

          {/* GPS Coordinates (Manual Entry) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Latitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Latitude"
                value={gpsLat}
                onChange={(e) => {
                  setGpsLat(e.target.value);
                  if (e.target.value && gpsLng) {
                    setMarkerPosition({
                      lat: parseFloat(e.target.value),
                      lng: parseFloat(gpsLng),
                    });
                    setMapCenter({
                      lat: parseFloat(e.target.value),
                      lng: parseFloat(gpsLng),
                    });
                  }
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Longitude</Label>
              <Input
                type="number"
                step="any"
                placeholder="Longitude"
                value={gpsLng}
                onChange={(e) => {
                  setGpsLng(e.target.value);
                  if (gpsLat && e.target.value) {
                    setMarkerPosition({
                      lat: parseFloat(gpsLat),
                      lng: parseFloat(e.target.value),
                    });
                    setMapCenter({
                      lat: parseFloat(gpsLat),
                      lng: parseFloat(e.target.value),
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Proof Photos (Item Handover) *</Label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, index) => (
                <div key={index} className="relative aspect-square group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={URL.createObjectURL(photo)}
                    alt={`Proof ${index + 1}`}
                    className="w-full h-full object-cover rounded-md border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              {photos.length < 6 && (
                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-md flex items-center justify-center cursor-pointer hover:border-teal-600 transition-colors">
                  <Camera className="h-6 w-6 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Upload photos showing the item handover. Maximum 6 photos.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || photos.length === 0 || !gpsLat || !gpsLng}
            className="w-full bg-teal-600 hover:bg-teal-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Confirm Delivery & Check In"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
