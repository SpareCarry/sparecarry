/**
 * TraceInterface - Drag-to-trace component for measuring dimensions on photos
 * Allows users to trace lines on a photo to measure dimensions using a reference object
 */

import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  PanResponder,
  Dimensions,
} from "react-native";
import { TraceMeasurement, ReferenceObject } from "../../lib/types/measurement";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface TraceInterfaceProps {
  imageUri: string;
  referenceObject: ReferenceObject;
  onMeasurementComplete: (measurements: {
    length: number; // cm
    width: number; // cm
    height: number; // cm
  }) => void;
}

type TraceType = "reference" | "length" | "width" | "height" | null;

export function TraceInterface({
  imageUri,
  referenceObject,
  onMeasurementComplete,
}: TraceInterfaceProps) {
  const [currentTrace, setCurrentTrace] = useState<TraceType>(null);
  const [traces, setTraces] = useState<{
    reference?: TraceMeasurement;
    length?: TraceMeasurement;
    width?: TraceMeasurement;
  }>({});
  const [isTracing, setIsTracing] = useState(false);
  const [traceStart, setTraceStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const [traceCurrent, setTraceCurrent] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => currentTrace !== null,
      onMoveShouldSetPanResponder: () => currentTrace !== null,

      onPanResponderGrant: (evt) => {
        if (currentTrace) {
          const { pageX, pageY } = evt.nativeEvent;
          setTraceStart({ x: pageX, y: pageY });
          setTraceCurrent({ x: pageX, y: pageY });
          setIsTracing(true);
        }
      },

      onPanResponderMove: (evt) => {
        if (isTracing && traceStart) {
          const { pageX, pageY } = evt.nativeEvent;
          setTraceCurrent({ x: pageX, y: pageY });
        }
      },

      onPanResponderRelease: (evt) => {
        if (traceStart && traceCurrent) {
          const pixelLength = Math.sqrt(
            Math.pow(traceCurrent.x - traceStart.x, 2) +
              Math.pow(traceCurrent.y - traceStart.y, 2)
          );

          const trace: TraceMeasurement = {
            start: traceStart,
            end: traceCurrent,
            pixelLength,
            realLengthCm: 0, // Will be calculated after reference is set
          };

          if (currentTrace === "reference") {
            // Calculate pixel-to-cm ratio from reference
            const refDimension = referenceObject.widthCm; // Use width as reference
            const pixelToCm = refDimension / pixelLength;
            trace.realLengthCm = refDimension;
            
            setTraces((prev) => ({
              ...prev,
              reference: { ...trace, realLengthCm: refDimension },
            }));
          } else if (currentTrace === "length" || currentTrace === "width") {
            // Calculate real length if reference exists
            if (traces.reference) {
              const pixelToCm = traces.reference.realLengthCm / traces.reference.pixelLength;
              trace.realLengthCm = pixelLength * pixelToCm;
              
              setTraces((prev) => ({
                ...prev,
                [currentTrace]: trace,
              }));
            }
          }

          setIsTracing(false);
          setTraceStart(null);
          setTraceCurrent(null);
          setCurrentTrace(null);
        }
      },
    })
  ).current;

  // Calculate measurements when length and width are complete
  React.useEffect(() => {
    if (traces.reference && traces.length && traces.width) {
      // Height will be estimated or user-provided
      const measurements = {
        length: traces.length.realLengthCm,
        width: traces.width.realLengthCm,
        height: 0, // Will be set by user input
      };
      // Call callback with length and width (height will be added separately)
      onMeasurementComplete(measurements);
    }
  }, [traces, onMeasurementComplete]);

  const startTrace = useCallback((type: TraceType) => {
    setCurrentTrace(type);
  }, []);

  const getTraceLine = (trace?: TraceMeasurement) => {
    if (!trace) return null;
    return {
      x1: trace.start.x,
      y1: trace.start.y,
      x2: trace.end.x,
      y2: trace.end.y,
      length: trace.realLengthCm.toFixed(1),
    };
  };

  const getPixelToCmRatio = () => {
    if (!traces.reference) return null;
    return traces.reference.realLengthCm / traces.reference.pixelLength;
  };

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <Image source={{ uri: imageUri }} style={styles.image} resizeMode="contain" />
      
      {/* SVG-like overlay for traces */}
      <View style={styles.overlay} pointerEvents="none">
        {/* Reference trace */}
        {traces.reference && (
          <View
            style={[
              styles.traceLine,
              {
                left: Math.min(traces.reference.start.x, traces.reference.end.x),
                top: Math.min(traces.reference.start.y, traces.reference.end.y),
                width: Math.abs(traces.reference.end.x - traces.reference.start.x),
                height: Math.abs(traces.reference.end.y - traces.reference.start.y),
              },
            ]}
          >
            <View style={styles.traceLineInner} />
            <Text style={styles.traceLabel}>
              Reference: {traces.reference.realLengthCm.toFixed(1)}cm
            </Text>
          </View>
        )}

        {/* Length trace */}
        {traces.length && (
          <View
            style={[
              styles.traceLine,
              {
                left: Math.min(traces.length.start.x, traces.length.end.x),
                top: Math.min(traces.length.start.y, traces.length.end.y),
                width: Math.abs(traces.length.end.x - traces.length.start.x),
                height: Math.abs(traces.length.end.y - traces.length.start.y),
              },
            ]}
          >
            <View style={[styles.traceLineInner, { backgroundColor: "#14b8a6" }]} />
            <Text style={styles.traceLabel}>
              Length: {traces.length.realLengthCm.toFixed(1)}cm
            </Text>
          </View>
        )}

        {/* Width trace */}
        {traces.width && (
          <View
            style={[
              styles.traceLine,
              {
                left: Math.min(traces.width.start.x, traces.width.end.x),
                top: Math.min(traces.width.start.y, traces.width.end.y),
                width: Math.abs(traces.width.end.x - traces.width.start.x),
                height: Math.abs(traces.width.end.y - traces.width.start.y),
              },
            ]}
          >
            <View style={[styles.traceLineInner, { backgroundColor: "#f59e0b" }]} />
            <Text style={styles.traceLabel}>
              Width: {traces.width.realLengthCm.toFixed(1)}cm
            </Text>
          </View>
        )}

        {/* Active trace being drawn */}
        {isTracing && traceStart && traceCurrent && (
          <View
            style={[
              styles.traceLine,
              {
                left: Math.min(traceStart.x, traceCurrent.x),
                top: Math.min(traceStart.y, traceCurrent.y),
                width: Math.abs(traceCurrent.x - traceStart.x),
                height: Math.abs(traceCurrent.y - traceStart.y),
              },
            ]}
          >
            <View style={styles.traceLineInner} />
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {!traces.reference
            ? "1. Trace the reference paper (width)"
            : !traces.length
              ? "2. Trace the object's length"
              : !traces.width
                ? "3. Trace the object's width"
                : "✓ Dimensions measured"}
        </Text>
      </View>

      {/* Control buttons */}
      <View style={styles.controls}>
        {!traces.reference && (
          <View
            style={[
              styles.traceButton,
              currentTrace === "reference" && styles.traceButtonActive,
            ]}
          >
            <Text
              style={styles.traceButtonText}
              onPress={() => startTrace("reference")}
            >
              Trace Reference
            </Text>
          </View>
        )}
        {traces.reference && !traces.length && (
          <View
            style={[
              styles.traceButton,
              currentTrace === "length" && styles.traceButtonActive,
            ]}
          >
            <Text
              style={styles.traceButtonText}
              onPress={() => startTrace("length")}
            >
              Trace Length
            </Text>
          </View>
        )}
        {traces.reference && traces.length && !traces.width && (
          <View
            style={[
              styles.traceButton,
              currentTrace === "width" && styles.traceButtonActive,
            ]}
          >
            <Text
              style={styles.traceButtonText}
              onPress={() => startTrace("width")}
            >
              Trace Width
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  traceLine: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#14b8a6",
  },
  traceLineInner: {
    flex: 1,
    backgroundColor: "rgba(20, 184, 166, 0.3)",
  },
  traceLabel: {
    position: "absolute",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    color: "#fff",
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
    top: -20,
  },
  instructions: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  instructionText: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: "600",
  },
  controls: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    zIndex: 20,
  },
  traceButton: {
    backgroundColor: "#14b8a6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  traceButtonActive: {
    backgroundColor: "#0d9488",
  },
  traceButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

