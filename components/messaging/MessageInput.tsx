/**
 * MessageInput Component
 *
 * Input field and send button for sending messages
 */

"use client";

import { useState, FormEvent, useEffect, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Send,
  Loader2,
  AlertCircle,
  Image as ImageIcon,
  X,
  Mic,
  Square,
} from "lucide-react";
import { usePostMessages } from "../../lib/hooks/usePostMessages";
import { validateMessageContent } from "../../lib/utils/message-content-filter";
import { Alert, AlertDescription } from "../ui/alert";
import { useTypingIndicator } from "../../lib/hooks/useTypingIndicator";
import { uploadMessageImage } from "../../lib/utils/uploadMessageImage";
import { uploadVoiceMessage } from "../../lib/utils/uploadVoiceMessage";
import { useMessageDraft } from "../../lib/hooks/useMessageDraft";
import { useVoiceRecorder } from "../../lib/hooks/useVoiceRecorder";
import { cn } from "../../lib/utils";
import Image from "next/image";

interface MessageInputProps {
  postId: string;
  postType: "trip" | "request";
  currentUserId: string;
  otherUserId: string;
  disabled?: boolean;
}

export function MessageInput({
  postId,
  postType,
  currentUserId,
  otherUserId,
  disabled = false,
}: MessageInputProps) {
  const [validationError, setValidationError] = useState<string>("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isSending } = usePostMessages({
    postId,
    postType,
    currentUserId,
    otherUserId,
    enabled: true,
  });

  // Auto-save drafts
  const { draft, setDraft, clearDraft } = useMessageDraft({
    conversationId: postId,
    conversationType: "post",
    enabled: true,
  });
  const message = draft;

  const { isOtherUserTyping, broadcastTyping } = useTypingIndicator({
    conversationId: postId,
    conversationType: "post",
    currentUserId,
    otherUserId,
    enabled: !disabled,
  });

  const {
    isRecording,
    recordingDuration,
    formattedDuration,
    error: recordingError,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceRecorder({
    onRecordingComplete: (blob) => {
      setAudioBlob(blob);
      const url = URL.createObjectURL(blob);
      setAudioPreviewUrl(url);
    },
    onError: (error) => {
      setValidationError(error.message);
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setValidationError("Please select image files only");
      return;
    }

    // Limit to 5 images max
    const newImages = [...selectedImages, ...imageFiles].slice(0, 5);
    setSelectedImages(newImages);

    // Create previews
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    // Revoke old preview URL
    URL.revokeObjectURL(imagePreviews[index]);

    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      (!message.trim() && selectedImages.length === 0 && !audioBlob) ||
      isSending ||
      disabled ||
      uploadingImages ||
      uploadingAudio
    )
      return;

    // Validate message content if there's text
    if (message.trim()) {
      const validation = validateMessageContent(message.trim());
      if (!validation.isValid) {
        setValidationError(validation.userMessage);
        return;
      }
    }

    setValidationError("");
    setUploadingImages(true);
    setUploadingAudio(true);

    // Stop typing indicator when sending
    broadcastTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (selectedImages.length > 0) {
        imageUrls = await Promise.all(
          selectedImages.map((file) => uploadMessageImage(file, currentUserId))
        );
      }

      // Upload audio if present
      let audioUrl: string | null = null;
      if (audioBlob) {
        // Convert blob to File for upload
        const audioFile = new File([audioBlob], "voice-message.webm", {
          type: "audio/webm",
        });
        audioUrl = await uploadVoiceMessage(audioFile, currentUserId);
      }

      // Send message with images and/or audio
      await sendMessage(message.trim() || "", imageUrls, audioUrl);

      // Cleanup
      clearDraft();
      setSelectedImages([]);
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setImagePreviews([]);
      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        if (error.message.includes("sensitive information")) {
          setValidationError(error.message);
        } else if (
          error.message.includes("Image") ||
          error.message.includes("Audio")
        ) {
          setValidationError(error.message);
        } else {
          setValidationError("Failed to send message. Please try again.");
        }
      }
    } finally {
      setUploadingImages(false);
      setUploadingAudio(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setDraft(newValue); // Auto-save draft

    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError("");
    }

    // Broadcast typing status
    if (newValue.trim().length > 0) {
      broadcastTyping(true);

      // Stop typing indicator after 2 seconds of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2000);
    } else {
      broadcastTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  // Cleanup typing indicator when component unmounts or message is sent
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      broadcastTyping(false);
    };
  }, [broadcastTyping]);

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-slate-200 bg-white p-4"
    >
      {validationError && (
        <Alert variant="destructive" className="mb-3">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {validationError}
          </AlertDescription>
        </Alert>
      )}
      {isOtherUserTyping && (
        <div className="mb-2 animate-pulse text-xs italic text-slate-500">
          User is typing...
        </div>
      )}

      {/* Image Previews */}
      {imagePreviews.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {imagePreviews.map((preview, index) => (
            <div key={index} className="group relative h-20 w-20">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={80}
                height={80}
                className="rounded-lg border border-slate-200 object-cover"
                unoptimized={
                  preview.startsWith("blob:") || preview.startsWith("data:")
                }
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Audio Preview */}
      {audioPreviewUrl && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
          <audio src={audioPreviewUrl} controls className="h-8 flex-1" />
          <button
            type="button"
            onClick={() => {
              setAudioBlob(null);
              if (audioPreviewUrl) {
                URL.revokeObjectURL(audioPreviewUrl);
                setAudioPreviewUrl(null);
              }
            }}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-2">
          <div className="flex flex-1 items-center gap-2">
            <div className="h-3 w-3 animate-pulse rounded-full bg-red-500" />
            <span className="text-sm font-medium text-red-700">
              Recording: {formattedDuration}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={stopRecording}
            className="border-red-300 text-red-600 hover:bg-red-100"
          >
            <Square className="mr-1 h-4 w-4" />
            Stop
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={cancelRecording}
            className="text-slate-600"
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
          disabled={
            isSending ||
            disabled ||
            uploadingImages ||
            uploadingAudio ||
            isRecording
          }
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={
            isSending ||
            disabled ||
            uploadingImages ||
            uploadingAudio ||
            isRecording ||
            selectedImages.length >= 5
          }
          className="flex-shrink-0"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={
            isSending ||
            disabled ||
            uploadingImages ||
            uploadingAudio ||
            audioBlob !== null
          }
          className={cn(
            "flex-shrink-0",
            isRecording &&
              "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
          )}
        >
          {isRecording ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
        <Input
          value={message}
          onChange={handleChange}
          placeholder="Type a message..."
          className="flex-1"
          disabled={
            isSending ||
            disabled ||
            uploadingImages ||
            uploadingAudio ||
            isRecording
          }
        />
        <Button
          type="submit"
          disabled={
            (!message.trim() && selectedImages.length === 0 && !audioBlob) ||
            isSending ||
            disabled ||
            uploadingImages ||
            uploadingAudio ||
            isRecording
          }
          className="bg-teal-600 hover:bg-teal-700"
        >
          {isSending || uploadingImages || uploadingAudio ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        All communication stays on SpareCarry for safety and protection.
      </p>
    </form>
  );
}
