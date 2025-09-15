import React, { createContext, useContext } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const StepperContext = createContext(null);

const useStepper = () => {
  const context = useContext(StepperContext);
  if (!context) {
    throw new Error('useStepper must be used within a Stepper component');
  }
  return context;
};

const Stepper = React.forwardRef(({ className, children, activeStep = 0, ...props }, ref) => {
  const contextValue = { activeStep };
  return (
    <StepperContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn('flex w-full items-start justify-between', className)}
        {...props}
      >
        {React.Children.map(children, (child, index) =>
          React.cloneElement(child, { index })
        )}
      </div>
    </StepperContext.Provider>
  );
});
Stepper.displayName = 'Stepper';

const Step = React.forwardRef(({ className, children, index, ...props }, ref) => {
  const { activeStep } = useStepper();
  const isActive = activeStep === index;
  const isCompleted = activeStep > index;

  const contextValue = { index, isActive, isCompleted };
  
  return (
     <StepperContext.Provider value={contextValue}>
      <div
        ref={ref}
        className={cn('flex flex-1 items-center gap-x-4', { 'flex-none': index === React.Children.count(children) - 1 }, className)}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
});
Step.displayName = 'Step';

const StepIndicator = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isActive, isCompleted } = useStepper();

  return (
    <div
      ref={ref}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full border-2',
        {
          'border-blue-600 bg-blue-600 text-white': isActive,
          'border-emerald-600 bg-emerald-600 text-white': isCompleted,
          'border-slate-300 bg-white text-slate-500': !isActive && !isCompleted,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});
StepIndicator.displayName = 'StepIndicator';


const StepStatus = ({ complete, active, incomplete }) => {
  const { isActive, isCompleted } = useStepper();
  if (isActive) return <>{active}</>;
  if (isCompleted) return <>{complete}</>;
  return <>{incomplete}</>;
};

const StepNumber = () => {
    const { index } = useStepper();
    return <span className="text-sm font-semibold">{index + 1}</span>;
}

const StepSeparator = React.forwardRef(({ className, ...props }, ref) => {
  const { isCompleted } = useStepper();
  return (
    <div
      ref={ref}
      className={cn('h-0.5 flex-1 transition-colors', {
        'bg-emerald-600': isCompleted,
        'bg-slate-200': !isCompleted
      }, className)}
      {...props}
    />
  );
});
StepSeparator.displayName = 'StepSeparator';

const stepTitleVariants = cva('text-sm font-medium', {
  variants: {
    state: {
      active: 'text-blue-600',
      completed: 'text-slate-800',
      inactive: 'text-slate-500',
    },
  },
  defaultVariants: {
    state: 'inactive',
  },
});

const StepTitle = React.forwardRef(({ className, children, ...props }, ref) => {
  const { isActive, isCompleted } = useStepper();
  const state = isActive ? 'active' : isCompleted ? 'completed' : 'inactive';
  return (
    <p
      ref={ref}
      className={cn(stepTitleVariants({ state }), className)}
      {...props}
    >
      {children}
    </p>
  );
});
StepTitle.displayName = 'StepTitle';

const StepDescription = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-xs text-slate-500', className)}
      {...props}
    >
      {children}
    </p>
  );
});
StepDescription.displayName = 'StepDescription';


export {
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepNumber,
  StepSeparator,
  StepTitle,
  StepDescription,
};