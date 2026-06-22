import { useEffect, useCallback, RefObject } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * useModal Hook
 * Handles ESC-to-close, scroll lock, and keyboard focus management for modals
 * (saves/restores focus, moves focus into the dialog, and traps Tab when a
 * container ref is provided).
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Callback function to close the modal
 * @param containerRef - Optional ref to the dialog element, enabling focus trap
 */
export function useModal(
  isOpen: boolean,
  onClose: () => void,
  containerRef?: RefObject<HTMLElement | null>
) {
  // Memoize the escape handler to prevent unnecessary re-renders
  const handleEsc = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Trap Tab focus inside the dialog when a container is provided.
  const handleTab = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !containerRef?.current) return;
    const nodes = Array.from(
      containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
    ).filter((el) => el.offsetParent !== null);
    if (nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, [containerRef]);

  useEffect(() => {
    if (!isOpen) return;

    // Remember what was focused so we can restore it on close (WCAG 2.4.3).
    const previouslyFocused = document.activeElement as HTMLElement | null;

    document.addEventListener('keydown', handleEsc);
    document.addEventListener('keydown', handleTab);
    document.body.style.overflow = 'hidden';

    // Move focus into the dialog (first focusable, else the container itself).
    const container = containerRef?.current;
    if (container) {
      const target =
        container.querySelector<HTMLElement>(FOCUSABLE) || container;
      // Defer so the element exists/painted before focusing.
      requestAnimationFrame(() => target.focus?.());
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';
      // Restore focus to the trigger element.
      previouslyFocused?.focus?.();
    };
  }, [isOpen, handleEsc, handleTab, containerRef]);
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
