"use client";

import { Button } from "../ui/button";
import { MessageCircle, Facebook, Mail } from "lucide-react";

interface ShareButtonsProps {
  referralCode: string;
}

export function ShareButtons({ referralCode }: ShareButtonsProps) {
  const shareUrl = `https://sparecarry.com/r/${referralCode}`;
  const shareText = `I just earned $420 on SpareCarry delivering boat parts! You get $35 free credit, I get $35 when you complete your first trip → ${shareUrl}`;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = "Join SpareCarry and get $35 free credit!";
    const body = shareText;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareText);
    alert("Copied to clipboard!");
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-slate-700 mb-2">
        Share your referral code:
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="w-full bg-green-50 hover:bg-green-100 border-green-200"
        >
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          WhatsApp
        </Button>
        <Button
          onClick={handleFacebook}
          variant="outline"
          className="w-full bg-blue-50 hover:bg-blue-100 border-blue-200"
        >
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </Button>
        <Button
          onClick={handleEmail}
          variant="outline"
          className="w-full bg-slate-50 hover:bg-slate-100 border-slate-200"
        >
          <Mail className="mr-2 h-4 w-4 text-slate-600" />
          Email
        </Button>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="w-full bg-teal-50 hover:bg-teal-100 border-teal-200"
        >
          Copy Link
        </Button>
      </div>
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
        <p className="text-xs text-slate-600">
          <strong>Your referral code:</strong> {referralCode}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Both you and your friend get $35 credit after their first delivery
        </p>
      </div>
    </div>
  );
}

