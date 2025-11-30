/**
 * Thank You Modal - shown after successful lifetime purchase
 */
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Heart } from "lucide-react";

interface LifetimeThankYouModalProps {
  open: boolean;
  onClose: () => void;
}

export function LifetimeThankYouModal({
  open,
  onClose,
}: LifetimeThankYouModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-teal-600">
            <Heart className="h-8 w-8 fill-white text-white" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Thank you for supporting SpareCarry ❤️
          </DialogTitle>
          <DialogDescription className="pt-4 text-center text-base">
            You&apos;ve unlocked Lifetime Access and directly helped keep spare
            luggage space accessible, fair, and community-powered.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button onClick={onClose} className="w-full sm:w-auto">
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
