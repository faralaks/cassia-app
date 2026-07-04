import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Text,
  Dialog,
  Header,
  IconButton,
  Icon,
  Icons,
  config,
  color,
  toRem,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { stopPropagation } from '../utils/keyboard';
import { ScreenSize, useScreenSizeContext } from '../hooks/useScreenSize';
import { BottomSheet, OverlayBottom } from './BottomSheet';
import { SecretStorageRecoveryKey, SecretStorageRecoveryPassphrase } from './SecretStorage';
import { ManualVerificationMethod, ManualVerificationMethodSwitcher } from './ManualVerification';
import { useMatrixClient } from '../hooks/useMatrixClient';
import { useCrossSigningActive } from '../hooks/useCrossSigning';
import { useDeviceList, useSplitCurrentDevice } from '../hooks/useDeviceList';
import {
  useDeviceVerificationStatus,
  VerificationStatus,
} from '../hooks/useDeviceVerificationStatus';
import { AsyncStatus, useAsyncCallback } from '../hooks/useAsyncCallback';
import {
  useSecretStorageDefaultKeyId,
  useSecretStorageKeyContent,
} from '../hooks/useSecretStorage';
import { storePrivateKey } from '../../client/secretStorageKeys';
import { SecretStorageKeyContent } from '../../types/matrix/accountData';

const SKIPPED_KEY_PREFIX = 'cassia_recovery_prompt_skipped_';

function markSkipped(userId: string): void {
  localStorage.setItem(SKIPPED_KEY_PREFIX + userId, '1');
}

function wasSkipped(userId: string): boolean {
  return localStorage.getItem(SKIPPED_KEY_PREFIX + userId) === '1';
}

type RecoveryKeyPromptDialogProps = {
  secretStorageKeyId: string;
  secretStorageKeyContent: SecretStorageKeyContent;
  onSkip: () => void;
  // Mobile bottom-sheet presentation: full width, rounded top, stacked form.
  sheet?: boolean;
};
function RecoveryKeyPromptDialog({
  secretStorageKeyId,
  secretStorageKeyContent,
  onSkip,
  sheet,
}: RecoveryKeyPromptDialogProps) {
  const mx = useMatrixClient();

  const hasPassphrase = !!secretStorageKeyContent.passphrase;
  const [method, setMethod] = useState(
    hasPassphrase
      ? ManualVerificationMethod.RecoveryPassphrase
      : ManualVerificationMethod.RecoveryKey
  );

  const verifyAndRestoreBackup = useCallback(
    async (recoveryKey: Uint8Array) => {
      const crypto = mx.getCrypto();
      if (!crypto) {
        throw new Error('Unexpected Error! Crypto object not found.');
      }

      storePrivateKey(secretStorageKeyId, recoveryKey);

      await crypto.bootstrapCrossSigning({});
      await crypto.bootstrapSecretStorage({});

      await crypto.loadSessionBackupPrivateKeyFromSecretStorage();

      // Pull room keys from the backup now so already-failed messages re-decrypt
      // right away. The SDK emits Event.decrypted per event as keys land, which
      // the timeline listens for to re-render the "Unable to decrypt" messages.
      await crypto.restoreKeyBackup().catch(() => undefined);
    },
    [mx, secretStorageKeyId]
  );

  const [verifyState, handleDecodedRecoveryKey] = useAsyncCallback<void, Error, [Uint8Array]>(
    verifyAndRestoreBackup
  );
  const verifying = verifyState.status === AsyncStatus.Loading;
  const verified = verifyState.status === AsyncStatus.Success;

  // Auto-close shortly after success — long enough to show the confirmation,
  // then dismiss so the user returns to their (now decrypting) timeline.
  useEffect(() => {
    if (!verified) return undefined;
    const id = window.setTimeout(onSkip, 1500);
    return () => window.clearTimeout(id);
  }, [verified, onSkip]);

  return (
    <Dialog
      variant="Surface"
      style={
        sheet
          ? {
              width: '100%',
              maxWidth: '100%',
              borderRadius: `${toRem(20)} ${toRem(20)} 0 0`,
              // Clear the home indicator; --bottom-bar-inset collapses while
              // the keyboard is open so the sheet hugs it with no dead band.
              paddingBottom: 'calc(var(--bottom-bar-inset, 0px) + 8px)',
            }
          : { width: toRem(400) }
      }
    >
      <Header
        style={{
          padding: `0 ${config.space.S200} 0 ${config.space.S400}`,
          borderBottomWidth: config.borderWidth.B300,
          // Leave room for the sheet grabber above the title.
          paddingTop: sheet ? config.space.S100 : undefined,
        }}
        variant="Surface"
        size="500"
      >
        <Box grow="Yes">
          <Text size="H4">Enter Recovery Key</Text>
        </Box>
        <IconButton size="300" radii="300" onClick={onSkip}>
          <Icon src={Icons.Cross} />
        </IconButton>
      </Header>
      <Box style={{ padding: config.space.S400 }} direction="Column" gap="400">
        {verified ? (
          <Text size="T200" style={{ color: color.Success.Main }}>
            <b>Device verified! You can now read your encrypted message history.</b>
          </Text>
        ) : (
          <>
            <Text size="T300" priority="300">
              This device is not verified, so it cannot read your encrypted message history. Enter
              your Recovery Key to verify this device and unlock your messages.
            </Text>
            <Box direction="Column" gap="200">
              {hasPassphrase && (
                <Box>
                  <ManualVerificationMethodSwitcher value={method} onChange={setMethod} />
                </Box>
              )}
              {method === ManualVerificationMethod.RecoveryKey && (
                <SecretStorageRecoveryKey
                  processing={verifying}
                  keyContent={secretStorageKeyContent}
                  onDecodedRecoveryKey={handleDecodedRecoveryKey}
                  stacked={sheet}
                />
              )}
              {method === ManualVerificationMethod.RecoveryPassphrase &&
                secretStorageKeyContent.passphrase && (
                  <SecretStorageRecoveryPassphrase
                    processing={verifying}
                    keyContent={secretStorageKeyContent}
                    passphraseContent={secretStorageKeyContent.passphrase}
                    onDecodedRecoveryKey={handleDecodedRecoveryKey}
                    stacked={sheet}
                  />
                )}
              {verifyState.status === AsyncStatus.Error && (
                <Text size="T200" style={{ color: color.Critical.Main }}>
                  <b>{verifyState.error.message}</b>
                </Text>
              )}
            </Box>
          </>
        )}
      </Box>
    </Dialog>
  );
}

export function RecoveryKeyPrompt() {
  const mx = useMatrixClient();
  const screenSize = useScreenSizeContext();
  const crossSigningActive = useCrossSigningActive();

  const defaultSecretStorageKeyId = useSecretStorageDefaultKeyId();
  const secretStorageKeyContent = useSecretStorageKeyContent(defaultSecretStorageKeyId ?? '');

  const crypto = mx.getCrypto();
  const [devices] = useDeviceList();
  const [currentDevice] = useSplitCurrentDevice(devices);

  const verificationStatus = useDeviceVerificationStatus(
    crypto,
    mx.getSafeUserId(),
    currentDevice?.device_id
  );

  const userId = mx.getSafeUserId();
  const [dismissed, setDismissed] = useState(() => wasSkipped(userId));

  const handleSkip = useCallback(() => {
    markSkipped(userId);
    setDismissed(true);
  }, [userId]);

  if (dismissed) return null;
  if (!crossSigningActive) return null;
  if (verificationStatus !== VerificationStatus.Unverified) return null;
  if (!defaultSecretStorageKeyId || !secretStorageKeyContent) return null;

  const mobile = screenSize === ScreenSize.Mobile;

  return (
    <Overlay open backdrop={<OverlayBackdrop />}>
      {mobile ? (
        <OverlayBottom>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: handleSkip,
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <BottomSheet onDismiss={handleSkip}>
              <RecoveryKeyPromptDialog
                secretStorageKeyId={defaultSecretStorageKeyId}
                secretStorageKeyContent={secretStorageKeyContent}
                onSkip={handleSkip}
                sheet
              />
            </BottomSheet>
          </FocusTrap>
        </OverlayBottom>
      ) : (
        <OverlayCenter>
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: handleSkip,
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <RecoveryKeyPromptDialog
              secretStorageKeyId={defaultSecretStorageKeyId}
              secretStorageKeyContent={secretStorageKeyContent}
              onSkip={handleSkip}
            />
          </FocusTrap>
        </OverlayCenter>
      )}
    </Overlay>
  );
}
