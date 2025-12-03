"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface MatchAcceptanceWaiverModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function MatchAcceptanceWaiverModal({
  open,
  onClose,
  onConfirm,
}: MatchAcceptanceWaiverModalProps) {
  const [waiverAccepted, setWaiverAccepted] = useState(false);

  const handleConfirm = () => {
    if (waiverAccepted) {
      onConfirm();
      setWaiverAccepted(false);
    }
  };

  const handleClose = () => {
    setWaiverAccepted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <DialogTitle>Confirm Match Acceptance</DialogTitle>
          </div>
          <DialogDescription>
            Please review and acknowledge this liability waiver before accepting
            this delivery match
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 font-semibold text-amber-900">
              Platform Role Acknowledgment
            </h4>
            <p className="text-sm text-amber-800">
              SpareCarry is a matching platform that connects travelers with
              requesters. We facilitate connections and handle payments through
              escrow, but we are not a shipping company, courier service, or
              delivery service.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">
              Your Responsibilities
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>
                You are responsible for verifying that items are legal to
                transport
              </li>
              <li>
                You must ensure items are properly declared and comply with all
                customs regulations
              </li>
              <li>
                You are responsible for safely handling items during transport
              </li>
              <li>
                You must only accept items you can legally and safely transport
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="mb-2 font-semibold text-red-900">
              Limitation of Liability
            </h4>
            <p className="text-sm text-red-800">
              SpareCarry is not liable for any issues during delivery, including
              but not limited to: lost or damaged items, customs delays or
              seizures, legal issues related to transported items, injuries, or
              accidents. You accept this delivery match at your own risk.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              id="waiver-accepted"
              type="checkbox"
              checked={waiverAccepted}
              onChange={(e) => setWaiverAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <Label
              htmlFor="waiver-accepted"
              className="flex-1 cursor-pointer text-sm text-slate-700"
            >
              I understand that SpareCarry is a matching platform only. I am
              responsible for verifying items are legal, properly declared, and
              safe to transport. SpareCarry is not liable for any issues during
              delivery. I accept this match at my own risk.
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!waiverAccepted}
            className="bg-teal-600 hover:bg-teal-700"
          >
            Accept Match
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

