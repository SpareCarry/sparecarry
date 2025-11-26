/**
 * Cancellation Reason Modal
 * 
 * Modal for selecting cancellation reason when canceling a trip, request, or match
 */

"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Loader2 } from 'lucide-react';
import { createClient } from '../../lib/supabase/client';

export interface CancellationReason {
  id: string;
  label: string;
  category: 'requester' | 'traveler' | 'external' | 'other';
  requires_notes: boolean;
}

export interface CancellationReasonModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reasonId: string, notes?: string) => Promise<void>;
  entityType: 'trip' | 'request' | 'match';
  userId: string;
}

export function CancellationReasonModal({
  open,
  onClose,
  onConfirm,
  entityType,
  userId,
}: CancellationReasonModalProps) {
  const [reasons, setReasons] = useState<CancellationReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingReasons, setIsLoadingReasons] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadReasons() {
      setIsLoadingReasons(true);
      try {
        // Filter reasons by category based on entity type
        let categoryFilter: string[] = [];
        if (entityType === 'trip') {
          categoryFilter = ['traveler', 'external', 'other'];
        } else if (entityType === 'request') {
          categoryFilter = ['requester', 'external', 'other'];
        } else {
          categoryFilter = ['requester', 'traveler', 'external', 'other'];
        }

        const { data, error } = await supabase
          .from('cancellation_reasons')
          .select('*')
          .in('category', categoryFilter)
          .order('display_order');

        if (error) throw error;
        setReasons(data || []);
      } catch (error) {
        console.error('Error loading cancellation reasons:', error);
      } finally {
        setIsLoadingReasons(false);
      }
    }

    if (open) {
      loadReasons();
    }
  }, [open, entityType, supabase]);

  const selectedReason = reasons.find(r => r.id === selectedReasonId);
  const requiresNotes = selectedReason?.requires_notes || false;

  const handleConfirm = async () => {
    if (!selectedReasonId) return;
    if (requiresNotes && !notes.trim()) return;

    setIsLoading(true);
    try {
      await onConfirm(selectedReasonId, notes.trim() || undefined);
      // Reset form
      setSelectedReasonId('');
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error confirming cancellation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Cancel {entityType}</DialogTitle>
          <DialogDescription>
            Please select a reason for cancellation. This helps us improve the platform.
          </DialogDescription>
        </DialogHeader>

        {isLoadingReasons ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <RadioGroup value={selectedReasonId} onValueChange={setSelectedReasonId}>
                {reasons.map((reason) => (
                  <div key={reason.id} className="flex items-start space-x-2">
                    <RadioGroupItem value={reason.id} id={reason.id} className="mt-1" />
                    <Label
                      htmlFor={reason.id}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {requiresNotes && (
                <div className="space-y-2">
                  <Label htmlFor="notes">Additional notes (required)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Please provide more details..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}

              {!requiresNotes && selectedReasonId && (
                <div className="space-y-2">
                  <Label htmlFor="notes-optional">Additional notes (optional)</Label>
                  <Textarea
                    id="notes-optional"
                    placeholder="Any additional information..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isLoading || !selectedReasonId || (requiresNotes && !notes.trim())}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Confirm Cancellation'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

