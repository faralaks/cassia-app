import React, { createContext, ReactNode, useContext } from 'react';
import { Box, Icon, IconButton, Icons } from 'folds';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';

// Exposes "close the whole settings window" to settings sub-pages. On mobile a
// sub-page's own close button goes *back* to the settings menu, so this context
// lets the page also offer a real close (×) without threading a prop through
// every sub-page component.
const SettingsCloseAllContext = createContext<(() => void) | undefined>(undefined);

export function SettingsCloseAllProvider({
  closeAll,
  children,
}: {
  closeAll: () => void;
  children: ReactNode;
}) {
  return (
    <SettingsCloseAllContext.Provider value={closeAll}>{children}</SettingsCloseAllContext.Provider>
  );
}

type SettingsPageCloseButtonProps = {
  onClose: () => void;
  variant?: 'Surface' | 'Background';
};

// Header button for a settings sub-page (one reached from the settings menu).
// On mobile its action goes back to the menu, so it shows a back arrow pinned to
// the top-left, plus a separate × (top-right) that closes the whole window. On
// desktop/tablet it is a single × that closes the panel.
export function SettingsPageCloseButton({
  onClose,
  variant = 'Surface',
}: SettingsPageCloseButtonProps) {
  const screenSize = useScreenSizeContext();
  const mobile = screenSize === ScreenSize.Mobile;
  const closeAll = useContext(SettingsCloseAllContext);

  if (!mobile) {
    return (
      <IconButton onClick={onClose} variant={variant}>
        <Icon src={Icons.Cross} />
      </IconButton>
    );
  }

  return (
    <>
      {/* Back arrow → settings menu. order:-1 pulls it before the title. */}
      <IconButton onClick={onClose} variant={variant} style={{ order: -1 }}>
        <Icon src={Icons.ArrowLeft} />
      </IconButton>
      {/* Close × → close the whole window, when available. */}
      {closeAll && (
        <Box shrink="No">
          <IconButton onClick={closeAll} variant={variant}>
            <Icon src={Icons.Cross} />
          </IconButton>
        </Box>
      )}
    </>
  );
}
