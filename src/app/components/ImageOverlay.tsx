import FocusTrap from 'focus-trap-react';
import { as, Modal, Overlay, OverlayBackdrop, OverlayCenter } from 'folds';
import React, { ReactNode } from 'react';
import { ModalWide } from '../styles/Modal.css';
import { stopPropagation } from '../utils/keyboard';
import { SwipeToDismiss } from './SwipeToDismiss';

export type RenderViewerProps = {
  src: string;
  alt: string;
  requestClose: () => void;
};

type ImageOverlayProps = RenderViewerProps & {
  viewer: boolean;
  renderViewer: (props: RenderViewerProps) => ReactNode;
};

export const ImageOverlay = as<'div', ImageOverlayProps>(
  ({ src, alt, viewer, requestClose, renderViewer, ...props }, ref) => (
    <Overlay {...props} ref={ref} open={viewer} backdrop={<OverlayBackdrop />}>
      <OverlayCenter>
        <FocusTrap
          focusTrapOptions={{
            initialFocus: false,
            onDeactivate: () => requestClose(),
            clickOutsideDeactivates: true,
            escapeDeactivates: stopPropagation,
          }}
        >
          <Modal
            className={ModalWide}
            size="500"
            onContextMenu={(evt: any) => evt.stopPropagation()}
          >
            <SwipeToDismiss onDismiss={requestClose}>
              {renderViewer({
                src,
                alt,
                requestClose,
              })}
            </SwipeToDismiss>
          </Modal>
        </FocusTrap>
      </OverlayCenter>
    </Overlay>
  )
);
