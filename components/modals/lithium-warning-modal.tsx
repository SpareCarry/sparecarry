"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Battery, X } from "lucide-react";

interface LithiumWarningModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType?: "lithium" | "drone" | "both";
}

export function LithiumWarningModal({
  open,
  onClose,
  onConfirm,
  itemType = "lithium",
}: LithiumWarningModalProps) {
  const isLithium = itemType === "lithium" || itemType === "both";
  const isDrone = itemType === "drone" || itemType === "both";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-600" />
            <DialogTitle>Important Airline Regulations</DialogTitle>
          </div>
          <DialogDescription>
            Please review these critical airline regulations before proceeding
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {isLithium && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Battery className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-900 mb-2">
                    Lithium Battery Restrictions
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                    <li>
                      <strong>Carry-on only:</strong> Lithium batteries must be in carry-on luggage,
                      NOT checked baggage
                    </li>
                    <li>
                      <strong>Power limits:</strong> Batteries must be under 100Wh (watt-hours) or
                      under 2g lithium content
                    </li>
                    <li>
                      <strong>Protection required:</strong> Batteries must be protected from short
                      circuits (tape terminals, use original packaging, or individual bags)
                    </li>
                    <li>
                      <strong>Quantity limits:</strong> Maximum 2 spare batteries per passenger
                    </li>
                    <li>
                      <strong>Damaged batteries:</strong> Damaged, recalled, or defective batteries
                      are PROHIBITED
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-amber-700 font-medium">
                    ⚠️ Failure to comply may result in confiscation, fines, or denied boarding
                  </p>
                </div>
              </div>
            </div>
          )}

          {isDrone && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Drone Transport Regulations</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-blue-800">
                    <li>
                      <strong>Battery removal:</strong> Drones must have batteries removed and
                      carried separately
                    </li>
                    <li>
                      <strong>Carry-on only:</strong> Drones and batteries must be in carry-on
                      luggage
                    </li>
                    <li>
                      <strong>Size restrictions:</strong> Must fit within airline carry-on size
                      limits
                    </li>
                    <li>
                      <strong>Destination regulations:</strong> Check local drone laws at
                      destination - many countries require registration or prohibit drones
                    </li>
                    <li>
                      <strong>Airport security:</strong> May be subject to additional screening
                    </li>
                  </ul>
                  <p className="mt-3 text-xs text-blue-700 font-medium">
                    ⚠️ Some countries ban drones entirely - verify destination regulations
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-2">Your Responsibility</h4>
            <p className="text-sm text-slate-700">
              By checking the box, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 mt-2">
              <li>You understand and will comply with all airline regulations</li>
              <li>The item meets all size, weight, and power requirements</li>
              <li>You have verified destination country regulations</li>
              <li>You will pack the item according to airline guidelines</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="bg-teal-600 hover:bg-teal-700"
          >
            I Understand & Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

