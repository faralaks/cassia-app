import React, { ReactNode } from 'react';
import FocusTrap from 'focus-trap-react';
import { Modal, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import { stopPropagation } from '../utils/keyboard';
import { Modal500Mobile } from './Modal500.css';
import { SwipeToDismiss } from './SwipeToDismiss';

type Modal500Props = {
  open?: boolean;
  requestClose: () => void;
  children: ReactNode;
};
export function Modal500({ open = true, requestClose, children }: Modal500Props) {
  if (!open) return null;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            clickOutsideDeactivates: true,
            onDeactivate: requestClose,
            escapeDeactivates: stopPropagation,
          }}
        >
          <SwipeToDismiss onDismiss={requestClose}>
            <Modal className={Modal500Mobile} size="500" variant="Background">
              {children}
            </Modal>
          </SwipeToDismiss>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  );
}
