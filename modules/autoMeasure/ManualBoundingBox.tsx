/**
 * ManualBoundingBox - User-controlled bounding box with pinch and drag gestures
 * 
 * Allows users to manually position and scale a bounding box to fit their item
 */

import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, PanResponder, Dimensions } from "react-native";
import { BoundingBox } from "./types";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ManualBoundingBoxProps {
  onBoxChange: (box: BoundingBox) => void;
  initialBox?: BoundingBox;
}

export function ManualBoundingBox({
  onBoxChange,
  initialBox,
}: ManualBoundingBoxProps) {
  // Default box: centered, 40% of screen size
  const defaultBox: BoundingBox = {
    x: SCREEN_WIDTH * 0.3,
    y: SCREEN_HEIGHT * 0.3,
    width: SCREEN_WIDTH * 0.4,
    height: SCREEN_HEIGHT * 0.4,
  };

  const [box, setBox] = useState<BoundingBox>(initialBox || defaultBox);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const initialPinchDistanceRef = useRef<number | null>(null);
  const initialBoxSizeRef = useRef<{ width: number; height: number } | null>(null);
  
  const panResponderRef = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt) => {
        const touchX = evt.nativeEvent.pageX;
        const touchY = evt.nativeEvent.pageY;
        const touches = evt.nativeEvent.touches;

        // Check if two-finger pinch
        if (touches.length === 2) {
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          initialPinchDistanceRef.current = distance;
          initialBoxSizeRef.current = { width: box.width, height: box.height };
        } else {
          // Single finger drag
          dragStartRef.current = { x: touchX - box.x, y: touchY - box.y };
        }
      },

      onPanResponderMove: (evt, gestureState) => {
        const touches = evt.nativeEvent.touches;

        if (touches.length === 2 && initialPinchDistanceRef.current && initialBoxSizeRef.current) {
          // Pinch to scale
          const dx = touches[0].pageX - touches[1].pageX;
          const dy = touches[0].pageY - touches[1].pageY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const scale = distance / initialPinchDistanceRef.current;
          
          // Scale box from center
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          const newWidth = Math.max(50, Math.min(SCREEN_WIDTH * 0.9, initialBoxSizeRef.current.width * scale));
          const newHeight = Math.max(50, Math.min(SCREEN_HEIGHT * 0.9, initialBoxSizeRef.current.height * scale));
          
          const newBox: BoundingBox = {
            x: centerX - newWidth / 2,
            y: centerY - newHeight / 2,
            width: newWidth,
            height: newHeight,
          };
          
          // Keep box within screen bounds
          newBox.x = Math.max(0, Math.min(SCREEN_WIDTH - newBox.width, newBox.x));
          newBox.y = Math.max(0, Math.min(SCREEN_HEIGHT - newBox.height, newBox.y));
          
          setBox(newBox);
          onBoxChange(newBox);
        } else if (dragStartRef.current) {
          // Drag the box
          const touchX = evt.nativeEvent.pageX;
          const touchY = evt.nativeEvent.pageY;
          const newX = Math.max(
            0,
            Math.min(SCREEN_WIDTH - box.width, touchX - dragStartRef.current.x)
          );
          const newY = Math.max(
            0,
            Math.min(SCREEN_HEIGHT - box.height, touchY - dragStartRef.current.y)
          );

          const newBox = { ...box, x: newX, y: newY };
          setBox(newBox);
          onBoxChange(newBox);
        }
      },

      onPanResponderRelease: () => {
        dragStartRef.current = null;
        initialPinchDistanceRef.current = null;
        initialBoxSizeRef.current = null;
      },
    })
  ).current;

  return (
    <View
      style={[
        styles.box,
        {
          left: box.x,
          top: box.y,
          width: box.width,
          height: box.height,
        },
      ]}
      {...panResponderRef.panHandlers}
    >
      {/* Border */}
      <View style={styles.border} />
      
      {/* Corner handles */}
      <View style={[styles.corner, styles.topLeft]} />
      <View style={[styles.corner, styles.topRight]} />
      <View style={[styles.corner, styles.bottomLeft]} />
      <View style={[styles.corner, styles.bottomRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    position: "absolute",
    borderWidth: 3,
    borderColor: "#14b8a6",
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: "#14b8a6",
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
});

