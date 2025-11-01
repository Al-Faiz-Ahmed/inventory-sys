import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface SupplierActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function SupplierActionsMenu({ onEdit, onDelete }: SupplierActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 w-8"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 z-[100] mt-2 w-32 rounded-md border border-border bg-background shadow-lg">
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

