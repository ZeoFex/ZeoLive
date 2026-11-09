import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStepItem {
  id: string;
  label: string;
}

interface WizardStepperProps {
  steps: WizardStepItem[];
  currentStepId: string;
  /** Furthest step the user is allowed to open (inclusive). */
  unlockedStepId?: string;
  allComplete?: boolean;
  onStepSelect?: (stepId: string) => void;
  className?: string;
}

export function WizardStepper({
  steps,
  currentStepId,
  unlockedStepId,
  allComplete = false,
  onStepSelect,
  className,
}: WizardStepperProps) {
  const currentIndex = allComplete
    ? steps.length
    : Math.max(
        0,
        steps.findIndex((step) => step.id === currentStepId)
      );
  const unlockedIndex = allComplete
    ? steps.length - 1
    : Math.max(
        currentIndex,
        unlockedStepId
          ? steps.findIndex((step) => step.id === unlockedStepId)
          : currentIndex
      );

  return (
    <nav aria-label="Application progress" className={cn("w-full", className)}>
      <ol className="flex items-start">
        {steps.map((step, index) => {
          const isComplete = allComplete || index < currentIndex;
          const isCurrent = !allComplete && index === currentIndex;
          const isUpcoming = !allComplete && index > currentIndex;
          const isUnlocked = allComplete || index <= unlockedIndex;
          const canSelect =
            Boolean(onStepSelect) && isUnlocked && !allComplete && !isCurrent;

          return (
            <li
              key={step.id}
              className={cn(
                "relative flex flex-1 flex-col items-center",
                index < steps.length - 1 && "pr-1 sm:pr-2"
              )}
            >
              {index < steps.length - 1 ? (
                <span
                  className={cn(
                    "absolute left-[calc(50%+1.1rem)] right-[calc(-50%+1.1rem)] top-4 h-0.5 rounded-full sm:top-[1.125rem]",
                    index < unlockedIndex ? "bg-[#0066CC]" : "bg-slate-200"
                  )}
                  aria-hidden
                />
              ) : null}

              <button
                type="button"
                disabled={!canSelect}
                onClick={() => onStepSelect?.(step.id)}
                className={cn(
                  "relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors sm:h-9 sm:w-9 sm:text-sm",
                  isComplete &&
                    "border-[#0066CC] bg-[#0066CC] text-white shadow-[0_8px_16px_-10px_rgba(0,102,204,0.9)]",
                  isCurrent &&
                    "border-[#0066CC] bg-white text-[#0066CC] shadow-[0_0_0_4px_rgba(0,102,204,0.12)]",
                  isUpcoming &&
                    (isUnlocked
                      ? "border-[#0066CC]/50 bg-white text-[#0066CC]"
                      : "border-slate-200 bg-white text-slate-400"),
                  canSelect && "cursor-pointer hover:scale-105",
                  !canSelect && "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`${step.label}${isComplete ? " (completed)" : isCurrent ? " (current)" : isUnlocked ? "" : " (locked)"}`}
              >
                {isComplete ? <Check className="h-4 w-4" strokeWidth={3} /> : index + 1}
              </button>

              <span
                className={cn(
                  "mt-2 max-w-[6.5rem] text-center text-[11px] font-medium leading-tight sm:max-w-none sm:text-xs",
                  isComplete || isCurrent || isUnlocked
                    ? "text-slate-800"
                    : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
