import React, { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardShortcut, useSequenceShortcut } from '../../hooks/useKeyboardShortcuts';
import { ShortcutOverlay } from '../../components/ui/molecules/ShortcutOverlay';

interface AccessibilityContextType {
  toggleShortcuts: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const navigate = useNavigate();

  const toggleShortcuts = () => setShowShortcuts((prev) => !prev);

  // Global Shortcuts

  // '?' - Show Shortcut Overlay
  useKeyboardShortcut('?', () => toggleShortcuts(), { preventDefault: true });

  // '/' - Focus the global search (matches id="global-search" in AppShell header)
  useKeyboardShortcut('/', () => {
    const searchInput = document.getElementById('global-search') as HTMLInputElement | null;
    if (searchInput) searchInput.focus();
  }, { preventDefault: true });

  // Sequences: G + <key> → navigate to section
  useSequenceShortcut(['g', 'd'], () => navigate('/app/dashboard'));
  useSequenceShortcut(['g', 's'], () => navigate('/app/datasets'));
  useSequenceShortcut(['g', 'm'], () => navigate('/app/models'));
  useSequenceShortcut(['g', 'p'], () => navigate('/app/predict'));
  useSequenceShortcut(['g', 'a'], () => navigate('/app/admin'));

  return (
    <AccessibilityContext.Provider value={{ toggleShortcuts }}>
      {children}
      <ShortcutOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility must be used within AccessibilityProvider');
  return context;
}
