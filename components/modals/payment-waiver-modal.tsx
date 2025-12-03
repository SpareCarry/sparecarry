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

interface PaymentWaiverModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function PaymentWaiverModal({
  open,
  onClose,
  onConfirm,
}: PaymentWaiverModalProps) {
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
            <DialogTitle>Confirm Payment & Escrow</DialogTitle>
          </div>
          <DialogDescription>
            Please review and acknowledge this liability waiver before proceeding
            to payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="mb-2 font-semibold text-amber-900">
              Platform Role Acknowledgment
            </h4>
            <p className="text-sm text-amber-800">
              SpareCarry facilitates connections between travelers and requesters
              and handles payments through escrow. We are a matching platform
              only, not a shipping company, courier service, or delivery service.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h4 className="mb-2 font-semibold text-slate-900">
              Your Responsibilities
            </h4>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>
                You are responsible for accurately describing your items
              </li>
              <li>
                You must ensure items comply with all customs and import/export
                regulations
              </li>
              <li>
                You are responsible for accurate value declarations and all
                duties, taxes, and fees
              </li>
              <li>
                You understand that delivery success depends on the traveler, not
                SpareCarry
              </li>
            </ul>
          </div>

          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <h4 className="mb-2 font-semibold text-red-900">
              Limitation of Liability
            </h4>
            <p className="text-sm text-red-800">
              SpareCarry is not liable for delivery issues, damages, losses,
              customs delays or seizures, legal issues, or any other problems
              related to your shipment. You are responsible for all risks
              associated with using this platform. Our maximum liability is
              limited to the amount you paid for the specific delivery, or $100,
              whichever is less.
            </p>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input
              id="payment-waiver-accepted"
              type="checkbox"
              checked={waiverAccepted}
              onChange={(e) => setWaiverAccepted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-600"
            />
            <Label
              htmlFor="payment-waiver-accepted"
              className="flex-1 cursor-pointer text-sm text-slate-700"
            >
              I understand that SpareCarry facilitates connections and payments
              only. I am responsible for item accuracy, customs compliance, and
              all related risks. SpareCarry is not liable for delivery issues,
              damages, or losses. I proceed with payment at my own risk.
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
            Continue to Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

