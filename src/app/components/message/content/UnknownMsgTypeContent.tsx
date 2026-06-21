import React, { useState } from 'react';
import {
  Box,
  Dialog,
  Header,
  Icon,
  IconButton,
  Icons,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../../../utils/keyboard';

type Props = { msgType: string; rawContent: unknown };

export function UnknownMsgTypeContent({ msgType, rawContent }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <Overlay open backdrop={<OverlayBackdrop />}>
          <OverlayCenter>
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                returnFocusOnDeactivate: false,
                onDeactivate: () => setOpen(false),
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Dialog variant="Surface" style={{ width: toRem(480) }}>
                <Header
                  style={{
                    padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
                    borderBottomWidth: config.borderWidth.B300,
                  }}
                  variant="Surface"
                  size="500"
                >
                  <Box grow="Yes" direction="Column" gap="100">
                    <Text size="H4">Unknown message type</Text>
                    <Text size="T200" style={{ opacity: 0.5 }}>{msgType}</Text>
                  </Box>
                  <IconButton size="300" onClick={() => setOpen(false)} radii="300">
                    <Icon src={Icons.Cross} />
                  </IconButton>
                </Header>
                <Box
                  style={{
                    padding: config.space.S400,
                    maxHeight: '60vh',
                    overflowY: 'auto',
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: 'monospace',
                      fontSize: toRem(12),
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {JSON.stringify(rawContent, null, 2)}
                  </pre>
                </Box>
              </Dialog>
            </FocusTrap>
          </OverlayCenter>
        </Overlay>
      )}
      <Box
        as="button"
        type="button"
        onClick={() => setOpen(true)}
        alignItems="Center"
        gap="100"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: color.Warning.Main,
          opacity: config.opacity.P300,
          padding: 0,
          textAlign: 'left',
        }}
      >
        <Icon size="50" src={Icons.Warning} />
        <Text as="i">Unknown message type</Text>
      </Box>
    </>
  );
}
