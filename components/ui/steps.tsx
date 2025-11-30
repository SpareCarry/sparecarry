import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface StepsProps {
  currentStep: number;
  steps: { title: string; description?: string }[];
  className?: string;
}

export function Steps({ currentStep, steps, className }: StepsProps) {
  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <React.Fragment key={index}>
              <div className="flex flex-1 flex-col items-center">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                    isCompleted && "border-teal-600 bg-teal-600 text-white",
                    isCurrent &&
                      "border-teal-600 bg-teal-600 text-white ring-4 ring-teal-200",
                    isUpcoming && "border-slate-300 bg-white text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="font-semibold">{stepNumber}</span>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-teal-600",
                      isCompleted && "text-teal-600",
                      isUpcoming && "text-slate-400"
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="mt-1 text-xs text-slate-500">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors",
                    isCompleted ? "bg-teal-600" : "bg-slate-300"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
