import { useState, useCallback } from 'react';
import type { ModalState } from '@/lib/types';

export function useModal() {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
  });

  const openModal = useCallback((type: ModalState['type'], data?: any) => {
    setModalState({
      isOpen: true,
      type,
      data,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      isOpen: false,
    });
  }, []);

  return {
    modalState,
    openModal,
    closeModal,
  };
}
