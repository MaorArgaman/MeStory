import { useEffect, useCallback } from 'react';

/**
 * useModal Hook
 * Handles ESC key closing and scroll lock for modal components
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function to close the modal
 */
export function useModal(isOpen: boolean, onClose: () => void) {
  // Memoize the escape handler to prevent unnecessary re-renders
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      // Add ESC key listener
      document.addEventListener('keydown', handleEsc);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      // Cleanup: remove listener and restore scroll
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEsc]);
}

/**
 * useTabKeyboardNavigation Hook
 * Handles arrow key navigation between tabs
 *
 * @param tabs - Array of tab keys/ids
 * @param activeTab - Currently active tab key
 * @param setActiveTab - Function to set the active tab
 * @returns onKeyDown handler for tab buttons
 */
export function useTabKeyboardNavigation<T extends string>(
  tabs: T[],
  activeTab: T,
  setActiveTab: (tab: T) => void
) {
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = tabs.indexOf(activeTab);

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();

      let newIndex: number;
      if (e.key === 'ArrowRight') {
        // Move to next tab (wraps around)
        newIndex = (currentIndex + 1) % tabs.length;
      } else {
        // Move to previous tab (wraps around)
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      }

      setActiveTab(tabs[newIndex]);
    }
  }, [tabs, activeTab, setActiveTab]);

  return handleTabKeyDown;
}
