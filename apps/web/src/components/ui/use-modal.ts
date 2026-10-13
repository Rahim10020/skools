import { useState } from "react";
import {
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalRoot,
  ModalTitle,
  ModalTrigger,
} from "./modal";

/**
 * Espace de noms `Modal.*` (composition : Root/Trigger/Content/Header/Title/...).
 * Séparé de modal.tsx pour respecter react-refresh/only-export-components.
 */
export const Modal = {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
  Close: ModalClose,
};

export function useModal(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((v) => !v),
    setIsOpen,
  };
}
