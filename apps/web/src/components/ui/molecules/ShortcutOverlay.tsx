import React from 'react';
import { Modal } from './Modal';
import { colors } from '../../../lib/design-tokens';

interface ShortcutInfo {
  keys: string[];
  description: string;
  group?: string;
}

const shortcuts: ShortcutInfo[] = [
  // Global
  { keys: ['?'], description: 'Show this overlay', group: 'Global' },
  { keys: ['/'], description: 'Focus global search', group: 'Global' },
  { keys: ['Esc'], description: 'Close modal / cancel', group: 'Global' },
  // Navigation
  { keys: ['G', 'D'], description: 'Go to Dashboard', group: 'Navigate' },
  { keys: ['G', 'S'], description: 'Go to Datasets', group: 'Navigate' },
  { keys: ['G', 'M'], description: 'Go to Models', group: 'Navigate' },
  { keys: ['G', 'P'], description: 'Go to Predictions', group: 'Navigate' },
  { keys: ['G', 'A'], description: 'Go to Admin', group: 'Navigate' },
  // Loan Queue (Dashboard)
  { keys: ['J'], description: 'Select next loan', group: 'Loan Queue' },
  { keys: ['K'], description: 'Select previous loan', group: 'Loan Queue' },
  { keys: ['A'], description: 'Approve selected loan', group: 'Loan Queue' },
  { keys: ['R'], description: 'Reject selected loan', group: 'Loan Queue' },
];

const groups = ['Global', 'Navigate', 'Loan Queue'];

export const ShortcutOverlay: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" size="md">
      <div className="space-y-6">
        {groups.map((group) => {
          const groupShortcuts = shortcuts.filter((s) => s.group === group);
          return (
            <div key={group}>
              <p className="text-[9px] font-black text-base-600 uppercase tracking-[0.2em] mb-3">{group}</p>
              <div className="grid grid-cols-1 gap-2">
                {groupShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ backgroundColor: colors.base[900], border: `1px solid ${colors.base[800]}` }}
                  >
                    <span className="text-sm text-base-300 font-medium">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, kIndex) => (
                        <React.Fragment key={kIndex}>
                          <kbd
                            className="px-2 py-1 rounded bg-base-800 text-base-100 font-mono text-xs shadow-sm"
                            style={{ border: `1px solid ${colors.base[700]}`, minWidth: '1.75rem', textAlign: 'center' }}
                          >
                            {key}
                          </kbd>
                          {kIndex < shortcut.keys.length - 1 && (
                            <span className="text-base-700 text-xs font-bold">then</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-base-800 text-center">
        <p className="text-[10px] text-base-600 italic">
          Hotkeys are disabled when typing in input fields.
        </p>
      </div>
    </Modal>
  );
};
