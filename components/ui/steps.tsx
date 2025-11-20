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
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isCompleted &&
                      "bg-teal-600 border-teal-600 text-white",
                    isCurrent &&
                      "bg-teal-600 border-teal-600 text-white ring-4 ring-teal-200",
                    isUpcoming &&
                      "bg-white border-slate-300 text-slate-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
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
                    <p className="text-xs text-slate-500 mt-1">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-2 transition-colors",
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

