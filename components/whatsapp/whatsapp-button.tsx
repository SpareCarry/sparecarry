"use client";

import { Button } from "../ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone: string;
  title: string;
  origin: string;
  destination: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function WhatsAppButton({
  phone,
  title,
  origin,
  destination,
  className,
  variant = "default",
  size = "default",
}: WhatsAppButtonProps) {
  const cleanPhone = phone.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hi! About your SpareCarry posting – ${title} from ${origin} to ${destination}. Still available?`
  );
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;

  return (
    <Button
      onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
      className={className}
      variant={variant}
      size={size}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      Contact on WhatsApp
    </Button>
  );
}

