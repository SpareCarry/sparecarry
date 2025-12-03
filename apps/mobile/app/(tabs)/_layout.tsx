import { Tabs } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // QueryClientProvider is defined in the root layout (_layout.tsx)
  // All tab screens receive React Query context from there
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#14b8a6",
        tabBarInactiveTintColor: "#999",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60 + (Platform.OS === "android" ? insets.bottom : 0),
          paddingBottom:
            Platform.OS === "android" ? Math.max(insets.bottom, 8) : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Browse",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="search" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-request"
        options={{
          title: "Post Request",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="add-circle" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post-trip"
        options={{
          title: "Post Trip",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="flight" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shipping-estimator"
        options={{
          title: "Estimator",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calculate" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-stuff"
        options={{
          title: "My Stuff",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory" size={size || 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" size={size || 24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
