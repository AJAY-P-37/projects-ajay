"use client";

import { useEffect, useState } from "react";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "shadcn-lib/dist/components/ui/card";
import { cn } from "shadcn-lib/dist/lib/utils";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

type StepConfig = {
  id: string;
  label: string;
  component: React.ReactNode;
  canProceed?: boolean;
};

interface MultiStepFormProps {
  title?: string;
  steps: StepConfig[];
  showNavButtons?: boolean;
  allowSkip?: boolean;
  currentActiveStepId?: string;
  setParentStep?: (stepId: string) => void;
  onSubmit?: () => void;
}

export function MultiStepForm({
  title = "Multi-Step Form",
  steps,
  showNavButtons = true,
  allowSkip = true,
  currentActiveStepId = null,
  setParentStep,
  onSubmit,
}: MultiStepFormProps) {
  const [activeStep, setActiveStep] = useState(steps[0].id);

  useEffect(() => {
    setActiveStep(currentActiveStepId);
    // setParentStep && setParentStep(currentActiveStepId);
  }, [currentActiveStepId]);

  const currentIndex = steps.findIndex((s) => s.id === activeStep);
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  const nextStep = () => {
    if (isLast) return;
    if (allowSkip || steps[currentIndex].canProceed) {
      setActiveStep(steps[currentIndex + 1].id);
      setParentStep && setParentStep(steps[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (!isFirst) setActiveStep(steps[currentIndex - 1].id);
    setParentStep && setParentStep(steps[currentIndex - 1].id);
  };

  const handleSubmit = () => {
    if (onSubmit) onSubmit();
  };

  return (
    <Card className='border-none py-2'>
      {title && (
        <CardHeader>
          <CardTitle className='text-xl font-semibold text-center'>{title}</CardTitle>
        </CardHeader>
      )}

      <CardContent>
        {/* Progress Breadcrumbs */}
        <div className='flex items-center justify-center mb-2 overflow-x-auto no-scrollbar'>
          {steps.map((s, index) => {
            const isCompleted = index < currentIndex;
            const isActive = s.id === activeStep;

            return (
              <div
                key={s.id}
                className='flex-1 flex items-center justify-center min-w-[100px] max-w-[150px]' // ✅ dynamic width
              >
                {/* Left connector */}
                {index > 0 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-all",
                      index <= currentIndex ? "bg-green-600" : "bg-muted-foreground/30",
                    )}
                  />
                )}

                {/* Step circle */}
                <div
                  className={cn(
                    "flex flex-col items-center text-sm font-medium transition-all",
                    isCompleted
                      ? "text-green-600"
                      : isActive
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  <div
                    onClick={() => {
                      setActiveStep(s.id);
                      setParentStep && setParentStep(s.id);
                    }}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full border cursor-pointer transition-colors",
                      isCompleted
                        ? "bg-green-600 text-white border-green-600"
                        : isActive
                          ? "border-primary text-primary"
                          : "border-muted-foreground",
                    )}
                  >
                    {isCompleted ? <Check className='w-4 h-4' /> : index + 1}
                  </div>
                  <span className='mt-2 whitespace-nowrap'>{s.label}</span>
                </div>

                {/* Right connector */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-all",
                      index < currentIndex ? "bg-green-600" : "bg-muted-foreground/30",
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className='mt-2'>{steps[currentIndex].component}</div>

        {/* Navigation Buttons */}
        {showNavButtons && (
          <div className='flex justify-between mt-4'>
            <Button variant='default' size='sm' onClick={prevStep} disabled={isFirst}>
              <ArrowLeft />
              Back
            </Button>

            {!isLast ? (
              <Button
                variant='default'
                size='sm'
                onClick={nextStep}
                disabled={!allowSkip && !steps[currentIndex].canProceed}
              >
                Next <ArrowRight />
              </Button>
            ) : (
              <Button variant='default' size='sm' onClick={handleSubmit}>
                Submit
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
