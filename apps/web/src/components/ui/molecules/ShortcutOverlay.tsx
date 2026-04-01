import React from 'react';
import { Modal } from './Modal';
import { colors } from '../../../lib/design-tokens';

interface ShortcutInfo {
  keys: string[];
  description: string;
}

const shortcuts: ShortcutInfo[] = [
  { keys: ['G', 'D'], description: 'Go to Dashboard' },
  { keys: ['G', 'A'], description: 'Go to Admin' },
  { keys: ['G', 'B'], description: 'Go to Billing' },
  { keys: ['/'], description: 'Focus Search' },
  { keys: ['Esc'], description: 'Close Modal / Cancel' },
  { keys: ['?'], description: 'Show Shortcuts' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last action' },
];

export const ShortcutOverlay: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="grid grid-cols-1 gap-4">
        {shortcuts.map((shortcut, index) => (
          <div 
            key={index} 
            className="flex items-center justify-between p-3 rounded-md"
            style={{ backgroundColor: colors.base[900], border: `1px solid ${colors.base[800]}` }}
          >
            <span className="text-base-400 font-medium">{shortcut.description}</span>
            <div className="flex gap-1">
              {shortcut.keys.map((key, kIndex) => (
                <React.Fragment key={kIndex}>
                  <kbd 
                    className="px-2 py-1 rounded bg-base-800 border-base-700 text-base-100 font-mono text-xs shadow-sm"
                    style={{ border: `1px solid ${colors.base[700]}`, minWidth: '1.5rem', textAlign: 'center' }}
                  >
                    {key}
                  </kbd>
                  {kIndex < shortcut.keys.length - 1 && <span className="text-base-700 mx-1">+</span>}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-4 border-t border-base-800 text-center">
        <p className="text-xs text-base-500 italic">
          Tip: Hotkeys are disabled when typing in input fields.
        </p>
      </div>
    </Modal>
  );
};
