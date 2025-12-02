/**
 * Measurement Overlay Component
 * Displays dimensions on camera view and captured photos
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BoundingBox, Dimensions } from "./types";

interface MeasurementOverlayProps {
  boundingBox: BoundingBox;
  dimensions: Dimensions;
  showDimensions?: boolean;
  style?: any;
}

export function MeasurementOverlay({
  boundingBox,
  dimensions,
  showDimensions = true,
  style,
}: MeasurementOverlayProps) {
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {/* Bounding box border */}
      <View
        style={[
          styles.boundingBox,
          {
            left: boundingBox.x,
            top: boundingBox.y,
            width: boundingBox.width,
            height: boundingBox.height,
          },
        ]}
      >
        {/* Corner markers */}
        <View style={[styles.corner, styles.topLeft]} />
        <View style={[styles.corner, styles.topRight]} />
        <View style={[styles.corner, styles.bottomLeft]} />
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Dimensions label */}
      {showDimensions && (
        <View
          style={[
            styles.dimensionsLabel,
            {
              left: boundingBox.x,
              top: boundingBox.y - 40,
            },
          ]}
        >
          <Text style={styles.dimensionsText}>
            L: {Math.round(dimensions.length)}cm ×{" "}
            W: {Math.round(dimensions.width)}cm ×{" "}
            H: {Math.round(dimensions.height)}cm
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  boundingBox: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#14b8a6",
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  corner: {
    position: "absolute",
    width: 20,
    height: 20,
    backgroundColor: "#14b8a6",
    borderWidth: 2,
    borderColor: "#fff",
    borderRadius: 10,
  },
  topLeft: {
    top: -10,
    left: -10,
  },
  topRight: {
    top: -10,
    right: -10,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
  },
  dimensionsLabel: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 200,
  },
  dimensionsText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});

