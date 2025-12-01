/**
 * Profile Screen - Mobile
 * Enhanced profile with user management, subscription, and settings
 */

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@sparecarry/lib/supabase";
import { useAuth } from "@sparecarry/hooks/useAuth";
import { usePushNotifications } from "@sparecarry/hooks/usePushNotifications";
import { useUserPreferences } from "@sparecarry/hooks/useUserPreferences";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ReferralCardMobile } from "../../components/referral/ReferralCardMobile";
import { CURRENCIES, type CurrencyInfo } from "@sparecarry/lib/utils/currency";
import { useMutation } from "@tanstack/react-query";

type ProfileRecord = {
  phone?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  boat_photo_url?: string | null;
  boat_name?: string | null;
  boat_type?: string | null;
  boat_length_ft?: number | null;
  is_boater?: boolean | null;
};

type UserRecord = {
  subscription_status?: string | null;
  supporter_status?: string | null;
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const supabase = createClient();
  const {
    expoPushToken,
    registerToken,
    loading: pushLoading,
  } = usePushNotifications();
  const [registering, setRegistering] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState("");
  const [savingBio, setSavingBio] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBoatPhoto, setUploadingBoatPhoto] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [editingBoatName, setEditingBoatName] = useState(false);
  const [boatName, setBoatName] = useState("");
  const [savingBoatName, setSavingBoatName] = useState(false);
  const queryClient = useQueryClient();
  const { preferImperial, preferredCurrency } = useUserPreferences();

  const { data: profile, isLoading: profileLoading } =
    useQuery<ProfileRecord | null>({
      queryKey: ["profile", user?.id],
      queryFn: async () => {
        if (!user) return null;
        // Skip database query for dev mode user
        if (user.id === "dev-user-id") {
          return null;
        }
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") {
            console.warn("Error fetching profile:", error);
            return null;
          }
          return (data as ProfileRecord) || null;
        } catch (error) {
          console.warn("Exception fetching profile:", error);
          return null;
        }
      },
      enabled: !!user,
      retry: false,
    });

  const { data: userData } = useQuery<UserRecord | null>({
    queryKey: ["user-data", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Skip database query for dev mode user
      if (user.id === "dev-user-id") {
        return null;
      }
      try {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.warn("Error fetching user data:", error);
          return null;
        }
        return (data as UserRecord) || null;
      } catch (error) {
        console.warn("Exception fetching user data:", error);
        return null;
      }
    },
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (profile?.bio) {
      setBio(profile.bio);
    }
    if (profile?.boat_name) {
      setBoatName(profile.boat_name);
    }
  }, [profile]);

  useEffect(() => {
    if (user && expoPushToken && !registering) {
      setRegistering(true);
      registerToken(user.id)
        .then(() => {
          console.log("Push token registered");
        })
        .catch((error) => {
          console.error("Failed to register push token:", error);
        })
        .finally(() => {
          setRegistering(false);
        });
    }
  }, [user, expoPushToken, registerToken, registering]);

  const handleSaveBio = async () => {
    if (!user) return;

    // Skip database operation in dev mode
    if (user.id === "dev-user-id") {
      setEditingBio(false);
      Alert.alert("Success", "Bio updated successfully (dev mode)");
      return;
    }

    setSavingBio(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        bio: bio.trim() || null,
      });

      if (error) throw error;

      setEditingBio(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      Alert.alert("Success", "Bio updated successfully");
    } catch (error: any) {
      console.error("Error saving bio:", error);
      Alert.alert("Error", error.message || "Failed to save bio");
    } finally {
      setSavingBio(false);
    }
  };

  const pickImage = async (type: "avatar" | "boat") => {
    if (!user) return;

    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "We need access to your photos to upload images."
      );
      return;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === "avatar" ? [1, 1] : [16, 9],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const imageUri = result.assets[0].uri;
    await uploadImage(imageUri, type);
  };

  const uploadImage = async (imageUri: string, type: "avatar" | "boat") => {
    if (!user) return;

    // Skip database operation in dev mode
    if (user.id === "dev-user-id") {
      Alert.alert(
        "Success",
        `${type === "avatar" ? "Profile picture" : "Boat photo"} updated successfully (dev mode)`
      );
      return;
    }

    const uploading =
      type === "avatar" ? setUploadingAvatar : setUploadingBoatPhoto;
    uploading(true);

    try {
      // Convert URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Generate unique filename
      const fileExt = imageUri.split(".").pop() || "jpg";
      const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
      const bucket = type === "avatar" ? "profile-pictures" : "boat-documents";
      const filePath =
        type === "avatar" ? `avatars/${fileName}` : `photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      // Update profile
      const updateField = type === "avatar" ? "avatar_url" : "boat_photo_url";
      const { error: updateError } = await supabase.from("profiles").upsert({
        user_id: user.id,
        [updateField]: publicUrl,
      });

      if (updateError) throw updateError;

      // Invalidate query to refresh profile
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      Alert.alert(
        "Success",
        `${type === "avatar" ? "Profile picture" : "Boat photo"} updated successfully`
      );
    } catch (error: any) {
      console.error(`Error uploading ${type}:`, error);
      Alert.alert(
        "Error",
        error.message ||
          `Failed to upload ${type === "avatar" ? "profile picture" : "boat photo"}`
      );
    } finally {
      uploading(false);
    }
  };

  const updatePreferenceMutation = useMutation({
    mutationFn: async ({
      preferImperial,
      preferredCurrency,
    }: {
      preferImperial?: boolean;
      preferredCurrency?: string;
    }) => {
      if (!user || user.id === "dev-user-id") return;

      const updates: any = {};
      if (preferImperial !== undefined)
        updates.prefer_imperial_units = preferImperial;
      if (preferredCurrency !== undefined)
        updates.preferred_currency = preferredCurrency;

      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        ...updates,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["user-imperial-preference", user?.id],
      });
      queryClient.invalidateQueries({ queryKey: ["user-currency", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
      Alert.alert("Success", "Preference updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating preference:", error);
      Alert.alert("Error", error.message || "Failed to update preference");
    },
  });

  const handleToggleImperial = () => {
    updatePreferenceMutation.mutate({ preferImperial: !preferImperial });
  };

  const handleSelectCurrency = (currency: string) => {
    updatePreferenceMutation.mutate({ preferredCurrency: currency });
    setShowCurrencyPicker(false);
  };

  const handleSaveBoatName = async () => {
    if (!user) return;

    // Skip database operation in dev mode
    if (user.id === "dev-user-id") {
      setEditingBoatName(false);
      Alert.alert("Success", "Boat name updated successfully (dev mode)");
      return;
    }

    setSavingBoatName(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        boat_name: boatName.trim() || null,
      });

      if (error) throw error;

      setEditingBoatName(false);
      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      Alert.alert("Success", "Boat name updated successfully");
    } catch (error: any) {
      console.error("Error saving boat name:", error);
      Alert.alert("Error", error.message || "Failed to save boat name");
    } finally {
      setSavingBoatName(false);
    }
  };

  const handleToggleBoater = async (isBoater: boolean) => {
    if (!user) return;

    // Skip database operation in dev mode
    if (user.id === "dev-user-id") {
      Alert.alert(
        "Success",
        `Boat travel ${isBoater ? "enabled" : "disabled"} (dev mode)`
      );
      return;
    }

    try {
      const { error } = await supabase.from("profiles").upsert({
        user_id: user.id,
        is_boater: isBoater,
      });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
      Alert.alert("Success", "Preference updated successfully");
    } catch (error: any) {
      console.error("Error updating boat travel preference:", error);
      Alert.alert("Error", error.message || "Failed to update preference");
    }
  };

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  // Show loading only if auth is actually loading
  if (authLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If not logged in, show login prompt immediately (don't wait for profile)
  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="person-off" size={64} color="#999" />
        <Text style={styles.errorText}>Not logged in</Text>
        <Text style={styles.errorSubtext}>
          Please log in to view and edit your profile.
        </Text>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.loginButtonText}>Log In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show profile loading if user is logged in but profile is still loading
  if (profileLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#14b8a6" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const isPremium =
    userData?.subscription_status === "active" ||
    userData?.subscription_status === "trialing";
  const isSupporter = userData?.supporter_status === "active";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => pickImage("avatar")}
            disabled={uploadingAvatar}
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <MaterialIcons name="account-circle" size={80} color="#14b8a6" />
            )}
            {uploadingAvatar ? (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.editIconContainer}>
                <MaterialIcons name="camera-alt" size={20} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.name}>{user.email}</Text>
          {isPremium && (
            <View style={styles.badge}>
              <MaterialIcons name="star" size={16} color="#fff" />
              <Text style={styles.badgeText}>Pro</Text>
            </View>
          )}
          {isSupporter && (
            <View style={[styles.badge, styles.supporterBadge]}>
              <MaterialIcons name="favorite" size={16} color="#fff" />
              <Text style={styles.badgeText}>Supporter</Text>
            </View>
          )}
        </View>

        {/* Boat Information Section - Only show if is_boater is true */}
        {profile?.is_boater && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Boat Information</Text>
              <TouchableOpacity
                onPress={() => pickImage("boat")}
                disabled={uploadingBoatPhoto}
              >
                {uploadingBoatPhoto ? (
                  <ActivityIndicator size="small" color="#14b8a6" />
                ) : (
                  <MaterialIcons name="camera-alt" size={20} color="#14b8a6" />
                )}
              </TouchableOpacity>
            </View>

            {/* Boat Name */}
            <View style={styles.boatNameSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.infoLabel}>Boat Name (Optional)</Text>
                {!editingBoatName ? (
                  <TouchableOpacity onPress={() => setEditingBoatName(true)}>
                    <MaterialIcons name="edit" size={18} color="#14b8a6" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingBoatName(false);
                        setBoatName(profile?.boat_name || "");
                      }}
                    >
                      <MaterialIcons name="close" size={18} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveBoatName}
                      disabled={savingBoatName}
                    >
                      {savingBoatName ? (
                        <ActivityIndicator size="small" color="#14b8a6" />
                      ) : (
                        <MaterialIcons name="check" size={18} color="#14b8a6" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {editingBoatName ? (
                <TextInput
                  style={styles.input}
                  value={boatName}
                  onChangeText={setBoatName}
                  placeholder="e.g., Sea Breeze"
                  placeholderTextColor="#999"
                />
              ) : (
                <Text style={styles.infoValue}>
                  {profile?.boat_name || "No boat name set"}
                </Text>
              )}
            </View>

            {/* Boat Photo */}
            {profile.boat_photo_url ? (
              <View style={styles.boatPhotoContainer}>
                <Image
                  source={{ uri: profile.boat_photo_url }}
                  style={styles.boatPhoto}
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={() => pickImage("boat")}
                disabled={uploadingBoatPhoto}
              >
                <MaterialIcons
                  name="add-photo-alternate"
                  size={32}
                  color="#14b8a6"
                />
                <Text style={styles.addPhotoText}>
                  Add Boat Photo (Optional)
                </Text>
                <Text style={styles.addPhotoSubtext}>
                  Add a photo of your boat for extra trust
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text
              style={styles.infoValue}
              numberOfLines={1}
              ellipsizeMode="middle"
            >
              {user.id}
            </Text>
          </View>
          {profile?.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{profile.phone}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bio</Text>
            {!editingBio ? (
              <TouchableOpacity onPress={() => setEditingBio(true)}>
                <MaterialIcons name="edit" size={20} color="#14b8a6" />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingBio(false);
                    setBio(profile?.bio || "");
                  }}
                >
                  <MaterialIcons name="close" size={20} color="#ef4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveBio} disabled={savingBio}>
                  {savingBio ? (
                    <ActivityIndicator size="small" color="#14b8a6" />
                  ) : (
                    <MaterialIcons name="check" size={20} color="#14b8a6" />
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          {editingBio ? (
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about yourself..."
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          ) : (
            <Text style={styles.bioText}>{profile?.bio || "No bio yet"}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Push Notifications:</Text>
            {expoPushToken ? (
              <View style={styles.statusBadge}>
                <MaterialIcons name="check-circle" size={16} color="#14b8a6" />
                <Text style={styles.statusText}>Enabled</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, styles.statusDisabled]}>
                <MaterialIcons name="cancel" size={16} color="#999" />
                <Text style={[styles.statusText, styles.statusTextDisabled]}>
                  Disabled
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          {/* Boat Travel Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>I Travel by Boat</Text>
              <Text style={styles.settingDescription}>
                Enable to add boat name and photo for extra trust
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, profile?.is_boater && styles.toggleActive]}
              onPress={() => handleToggleBoater(!profile?.is_boater)}
            >
              <View
                style={[
                  styles.toggleThumb,
                  profile?.is_boater && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Imperial/Metric Toggle */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Prefer Imperial Units</Text>
              <Text style={styles.settingDescription}>
                Show lbs and ft/in first, with metric in parentheses
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, preferImperial && styles.toggleActive]}
              onPress={handleToggleImperial}
              disabled={updatePreferenceMutation.isPending}
            >
              <View
                style={[
                  styles.toggleThumb,
                  preferImperial && styles.toggleThumbActive,
                ]}
              />
            </TouchableOpacity>
          </View>

          {/* Currency Selector */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Preferred Currency</Text>
              <Text style={styles.settingDescription}>
                Currency for displaying prices
              </Text>
            </View>
            <TouchableOpacity
              style={styles.currencyButton}
              onPress={() => setShowCurrencyPicker(true)}
            >
              <Text style={styles.currencyButtonText}>
                {CURRENCIES[preferredCurrency]?.symbol || "$"}{" "}
                {preferredCurrency}
              </Text>
              <MaterialIcons name="chevron-right" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Currency Picker Modal */}
        {showCurrencyPicker && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Currency</Text>
                <TouchableOpacity onPress={() => setShowCurrencyPicker(false)}>
                  <MaterialIcons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.modalScroll}>
                {Object.values(CURRENCIES).map((currency: CurrencyInfo) => (
                  <TouchableOpacity
                    key={currency.code}
                    style={[
                      styles.currencyOption,
                      preferredCurrency === currency.code &&
                        styles.currencyOptionActive,
                    ]}
                    onPress={() => handleSelectCurrency(currency.code)}
                  >
                    <Text style={styles.currencyOptionText}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </Text>
                    {preferredCurrency === currency.code && (
                      <MaterialIcons name="check" size={20} color="#14b8a6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          {isPremium ? (
            <View style={styles.subscriptionCard}>
              <MaterialIcons name="star" size={24} color="#f59e0b" />
              <Text style={styles.subscriptionText}>Pro Member</Text>
              <Text style={styles.subscriptionSubtext}>
                Enjoy 0% platform fees and priority in feed
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => router.push("/subscription")}
            >
              <MaterialIcons name="star-outline" size={20} color="#fff" />
              <Text style={styles.subscribeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Referral Program */}
        <View style={styles.section}>
          <ReferralCardMobile />
        </View>

        <TouchableOpacity
          style={styles.supportButton}
          onPress={() => router.push("/support")}
        >
          <MaterialIcons name="help-outline" size={20} color="#14b8a6" />
          <Text style={styles.supportButtonText}>Support & Disputes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <MaterialIcons name="logout" size={20} color="#ef4444" />
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  avatarContainer: {
    marginBottom: 12,
    position: "relative",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#e5e7eb",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#14b8a6",
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  boatPhotoContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  boatPhoto: {
    width: "100%",
    height: 200,
    resizeMode: "cover",
  },
  addPhotoButton: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderStyle: "dashed",
    borderRadius: 8,
    backgroundColor: "#f9fafb",
  },
  addPhotoText: {
    marginTop: 8,
    fontSize: 14,
    color: "#14b8a6",
    fontWeight: "500",
  },
  addPhotoSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: "#999",
  },
  boatNameSection: {
    marginBottom: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f59e0b",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 4,
  },
  supporterBadge: {
    backgroundColor: "#ef4444",
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  editActions: {
    flexDirection: "row",
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    textAlign: "right",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
  },
  bioInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  bioText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDisabled: {
    opacity: 0.6,
  },
  statusText: {
    fontSize: 14,
    color: "#14b8a6",
    fontWeight: "500",
  },
  statusTextDisabled: {
    color: "#999",
  },
  subscriptionCard: {
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fef3c7",
    borderRadius: 8,
  },
  subscriptionText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  subscriptionSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
    textAlign: "center",
  },
  subscribeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#14b8a6",
    borderRadius: 8,
    padding: 16,
  },
  subscribeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  supportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#f0fdfa",
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#14b8a6",
  },
  supportButtonText: {
    color: "#14b8a6",
    fontSize: 16,
    fontWeight: "600",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#ef4444",
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  signOutButtonText: {
    color: "#ef4444",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    marginTop: 12,
    fontSize: 18,
    color: "#ef4444",
    fontWeight: "600",
    textAlign: "center",
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: "#14b8a6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: "#666",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e5e7eb",
    padding: 2,
    justifyContent: "center",
  },
  toggleActive: {
    backgroundColor: "#14b8a6",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    minWidth: 120,
  },
  currencyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "90%",
    maxHeight: "70%",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  modalScroll: {
    maxHeight: 400,
  },
  currencyOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  currencyOptionActive: {
    backgroundColor: "#f0fdfa",
  },
  currencyOptionText: {
    fontSize: 16,
    color: "#333",
  },
});
