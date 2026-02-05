/**
 * usePageLayout Hook
 * State management for page layout customization
 */

import { useState, useCallback, useMemo } from 'react';
import {
  PageLayoutTemplate,
  PageSplitType,
  ColumnLayoutType,
  BackgroundConfig,
  HeaderFooterConfig,
  Margins,
  TypographySettings,
  PageSection,
} from '../types/templates';

// Default layout configuration
const defaultLayout: PageLayoutTemplate = {
  name: 'Default Layout',
  description: 'Standard page layout',
  splitType: 'none',
  splitRatio: undefined,
  sections: [],
  columns: 1,
  columnGap: 10,
  header: {
    enabled: true,
    height: 15,
    content: {
      left: '',
      center: '',
      right: '',
    },
    style: {
      fontSize: 10,
      fontFamily: 'David Libre',
      textColor: '#666666',
      backgroundColor: undefined,
      borderBottom: true,
      borderTop: false,
      showOnFirstPage: false,
      showOnOddPages: true,
      showOnEvenPages: true,
    },
  },
  footer: {
    enabled: true,
    height: 15,
    content: {
      left: '',
      center: '— {pageNumber} —',
      right: '',
    },
    style: {
      fontSize: 10,
      fontFamily: 'David Libre',
      textColor: '#666666',
      backgroundColor: undefined,
      borderBottom: false,
      borderTop: true,
      showOnFirstPage: true,
      showOnOddPages: true,
      showOnEvenPages: true,
    },
  },
  background: {
    type: 'solid',
    color: '#ffffff',
  },
  margins: {
    top: 25,
    bottom: 25,
    left: 20,
    right: 20,
  },
  typography: {
    bodyFont: 'David Libre',
    bodyFontSize: 12,
    lineHeight: 1.6,
    textColor: '#1a1a1a',
    headingFont: 'David Libre',
    headingFontSize: 24,
    headingColor: '#000000',
  },
  isRTL: true,
  showPageNumber: true,
  pageNumberPosition: 'bottom-center',
};

interface UsePageLayoutOptions {
  initialLayout?: Partial<PageLayoutTemplate>;
  onSave?: (layout: PageLayoutTemplate) => void;
}

interface UsePageLayoutReturn {
  // State
  layout: PageLayoutTemplate;
  isDirty: boolean;
  history: PageLayoutTemplate[];
  historyIndex: number;

  // Actions
  setLayout: (layout: PageLayoutTemplate) => void;
  updateLayout: (updates: Partial<PageLayoutTemplate>) => void;
  resetLayout: () => void;

  // Specific updates
  setColumns: (columns: ColumnLayoutType) => void;
  setColumnGap: (gap: number) => void;
  setSplitType: (type: PageSplitType, ratio?: number[]) => void;
  setHeader: (header: HeaderFooterConfig) => void;
  setFooter: (footer: HeaderFooterConfig) => void;
  setBackground: (background: BackgroundConfig) => void;
  setMargins: (margins: Margins) => void;
  setTypography: (typography: TypographySettings) => void;
  setRTL: (isRTL: boolean) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Persistence
  save: () => void;
}

export function usePageLayout(options: UsePageLayoutOptions = {}): UsePageLayoutReturn {
  const { initialLayout, onSave } = options;

  // Merge initial layout with defaults
  const mergedInitial = useMemo(
    () => ({
      ...defaultLayout,
      ...initialLayout,
      header: { ...defaultLayout.header, ...initialLayout?.header },
      footer: { ...defaultLayout.footer, ...initialLayout?.footer },
      background: { ...defaultLayout.background, ...initialLayout?.background },
      margins: { ...defaultLayout.margins, ...initialLayout?.margins },
      typography: { ...defaultLayout.typography, ...initialLayout?.typography },
    }),
    [initialLayout]
  );

  // State
  const [layout, setLayoutState] = useState<PageLayoutTemplate>(mergedInitial);
  const [history, setHistory] = useState<PageLayoutTemplate[]>([mergedInitial]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedLayout, setSavedLayout] = useState<PageLayoutTemplate>(mergedInitial);

  // Check if layout has changed
  const isDirty = useMemo(
    () => JSON.stringify(layout) !== JSON.stringify(savedLayout),
    [layout, savedLayout]
  );

  // Add to history
  const addToHistory = useCallback((newLayout: PageLayoutTemplate) => {
    setHistory((prev) => {
      // Remove any future history if we're not at the end
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newLayout].slice(-50); // Keep last 50 states
    });
    setHistoryIndex((prev) => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Set layout with history
  const setLayout = useCallback(
    (newLayout: PageLayoutTemplate) => {
      setLayoutState(newLayout);
      addToHistory(newLayout);
    },
    [addToHistory]
  );

  // Update partial layout
  const updateLayout = useCallback(
    (updates: Partial<PageLayoutTemplate>) => {
      const newLayout = { ...layout, ...updates };
      setLayout(newLayout);
    },
    [layout, setLayout]
  );

  // Reset to initial
  const resetLayout = useCallback(() => {
    setLayout(mergedInitial);
  }, [mergedInitial, setLayout]);

  // Specific update functions
  const setColumns = useCallback(
    (columns: ColumnLayoutType) => updateLayout({ columns }),
    [updateLayout]
  );

  const setColumnGap = useCallback(
    (columnGap: number) => updateLayout({ columnGap }),
    [updateLayout]
  );

  const setSplitType = useCallback(
    (splitType: PageSplitType, splitRatio?: number[]) =>
      updateLayout({ splitType, splitRatio }),
    [updateLayout]
  );

  const setHeader = useCallback(
    (header: HeaderFooterConfig) => updateLayout({ header }),
    [updateLayout]
  );

  const setFooter = useCallback(
    (footer: HeaderFooterConfig) => updateLayout({ footer }),
    [updateLayout]
  );

  const setBackground = useCallback(
    (background: BackgroundConfig) => updateLayout({ background }),
    [updateLayout]
  );

  const setMargins = useCallback(
    (margins: Margins) => updateLayout({ margins }),
    [updateLayout]
  );

  const setTypography = useCallback(
    (typography: TypographySettings) => updateLayout({ typography }),
    [updateLayout]
  );

  const setRTL = useCallback(
    (isRTL: boolean) => updateLayout({ isRTL }),
    [updateLayout]
  );

  // Undo/Redo
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const undo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex((prev) => prev - 1);
      setLayoutState(history[historyIndex - 1]);
    }
  }, [canUndo, history, historyIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex((prev) => prev + 1);
      setLayoutState(history[historyIndex + 1]);
    }
  }, [canRedo, history, historyIndex]);

  // Save
  const save = useCallback(() => {
    setSavedLayout(layout);
    onSave?.(layout);
  }, [layout, onSave]);

  return {
    layout,
    isDirty,
    history,
    historyIndex,
    setLayout,
    updateLayout,
    resetLayout,
    setColumns,
    setColumnGap,
    setSplitType,
    setHeader,
    setFooter,
    setBackground,
    setMargins,
    setTypography,
    setRTL,
    undo,
    redo,
    canUndo,
    canRedo,
    save,
  };
}

export default usePageLayout;
