import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/helpers';

interface AccordionContextValue {
  value: string[];
  onValueChange: (value: string[]) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);
const ItemContext = createContext<{ value: string } | undefined>(undefined);

interface AccordionProps {
  type?: 'single' | 'multiple';
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  children: React.ReactNode;
  className?: string;
}

export function Accordion({
  type = 'multiple',
  defaultValue = [],
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(defaultValue);
  const controlled = value !== undefined;
  const currentValue = controlled ? value : internalValue;
  const handleValueChange = (newValue: string[]) => {
    if (!controlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <AccordionContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        type,
      }}
    >
      <div className={cn('w-full', className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function AccordionItem({ value, children, className }: AccordionItemProps) {
  return (
    <ItemContext.Provider value={{ value }}>
      <div className={cn('border-b', className)} data-value={value}>
        {children}
      </div>
    </ItemContext.Provider>
  );
}

interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionTrigger({ children, className }: AccordionTriggerProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionTrigger must be used within Accordion');

  const item = useContext(ItemContext);
  if (!item) throw new Error('AccordionTrigger must be used within AccordionItem');

  const isOpen = context.value.includes(item.value);

  return (
    <button
      type="button"
      onClick={() => {
        if (context.type === 'single') {
          context.onValueChange(isOpen ? [] : [item.value]);
        } else {
          context.onValueChange(
            isOpen
              ? context.value.filter((v) => v !== item.value)
              : [...context.value, item.value]
          );
        }
      }}
      className={cn(
        'flex w-full items-center justify-between py-4 text-left font-medium transition-all hover:underline',
        className
      )}
    >
      {children}
      <svg
        className={cn('h-4 w-4 shrink-0 transition-transform duration-200', {
          'rotate-180': isOpen,
        })}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function AccordionContent({ children, className }: AccordionContentProps) {
  const context = useContext(AccordionContext);
  if (!context) throw new Error('AccordionContent must be used within Accordion');

  const item = useContext(ItemContext);
  if (!item) throw new Error('AccordionContent must be used within AccordionItem');

  const isOpen = context.value.includes(item.value);

  return (
    <div
      className={cn(
        'overflow-hidden text-sm transition-all',
        {
          'max-h-0': !isOpen,
          'max-h-[5000px]': isOpen,
        }
      )}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </div>
  );
}

