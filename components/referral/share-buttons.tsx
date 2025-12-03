"use client";

import { Button } from "../ui/button";
import {
  MessageCircle,
  Facebook,
  Mail,
  Twitter,
  Linkedin,
  Link2,
} from "lucide-react";
import { useToastNotification } from "../../lib/hooks/use-toast-notification";

interface ShareButtonsProps {
  referralCode: string;
}

export function ShareButtons({ referralCode }: ShareButtonsProps) {
  const toast = useToastNotification();
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/r/${referralCode}`
      : `https://sparecarry.com/r/${referralCode}`;
  const shareText = `Join SpareCarry and earn 2,000 Karma Points! You both get 2,000 Karma Points when you complete your first paid delivery. Use my code: ${referralCode} → ${shareUrl}`;

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleEmail = () => {
    const subject = "Join SpareCarry and earn 2,000 Karma Points!";
    const body = shareText;
    const url = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = url;
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    toast.showCopiedToClipboard("Link");
  };

  return (
    <div className="space-y-3">
      <p className="mb-2 text-sm font-medium text-slate-700">
        Share your referral code:
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={handleWhatsApp}
          variant="outline"
          className="w-full border-green-200 bg-green-50 hover:bg-green-100"
        >
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          WhatsApp
        </Button>
        <Button
          onClick={handleFacebook}
          variant="outline"
          className="w-full border-blue-200 bg-blue-50 hover:bg-blue-100"
        >
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          Facebook
        </Button>
        <Button
          onClick={handleTwitter}
          variant="outline"
          className="w-full border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          <Twitter className="mr-2 h-4 w-4 text-slate-600" />
          Twitter/X
        </Button>
        <Button
          onClick={handleLinkedIn}
          variant="outline"
          className="w-full border-blue-200 bg-blue-50 hover:bg-blue-100"
        >
          <Linkedin className="mr-2 h-4 w-4 text-blue-600" />
          LinkedIn
        </Button>
        <Button
          onClick={handleEmail}
          variant="outline"
          className="w-full border-slate-200 bg-slate-50 hover:bg-slate-100"
        >
          <Mail className="mr-2 h-4 w-4 text-slate-600" />
          Email
        </Button>
        <Button
          onClick={handleCopyLink}
          variant="outline"
          className="w-full border-teal-200 bg-teal-50 hover:bg-teal-100"
        >
          <Link2 className="mr-2 h-4 w-4 text-teal-600" />
          Copy Link
        </Button>
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs text-slate-600">
          <strong>Your referral code:</strong> {referralCode}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Both you and your friend get 2,000 Karma Points after their first paid
          delivery
        </p>
      </div>
    </div>
  );
}
