/**
 * Hook for recording voice messages
 * Uses MediaRecorder API to capture audio from user's microphone
 */

import { useState, useRef, useCallback } from "react";
import { MAX_DURATION_SECONDS } from "../utils/uploadVoiceMessage";

interface UseVoiceRecorderOptions {
  onRecordingComplete?: (audioBlob: Blob) => void;
  onError?: (error: Error) => void;
}

export function useVoiceRecorder({
  onRecordingComplete,
  onError,
}: UseVoiceRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);

      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Create MediaRecorder with WebM format (widely supported)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        onRecordingComplete?.(audioBlob);

        // Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      // Handle errors - stop recording if error occurs
      mediaRecorder.onerror = (event) => {
        const error = new Error("Recording error occurred");
        setError(error.message);
        onError?.(error);
        // Stop recording on error (isRecording check not needed - we're definitely recording if error occurs)
        if (mediaRecorderRef.current) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }
        }
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => {
          const newDuration = prev + 1;
          // Auto-stop at max duration
          if (newDuration >= MAX_DURATION_SECONDS) {
            // Use ref to access stopRecording without dependency
            if (mediaRecorderRef.current) {
              mediaRecorderRef.current.stop();
              setIsRecording(false);
              if (durationIntervalRef.current) {
                clearInterval(durationIntervalRef.current);
                durationIntervalRef.current = null;
              }
            }
          }
          return newDuration;
        });
      }, 1000);
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to start recording");
      setError(error.message);
      onError?.(error);
      setIsRecording(false);
    }
  }, [onRecordingComplete, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setIsRecording(false);
    setRecordingDuration(0);

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // Format duration as MM:SS
  const formattedDuration = `${Math.floor(recordingDuration / 60)}:${String(recordingDuration % 60).padStart(2, "0")}`;

  return {
    isRecording,
    recordingDuration,
    formattedDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
