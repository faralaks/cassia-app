import React, { useEffect, useRef } from 'react';
import { MatrixCall } from 'matrix-js-sdk';
import { Avatar, Box, Icon, Icons, IconButton, Text, config } from 'folds';
import { UserAvatar } from '../../components/user-avatar';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { useMediaAuthentication } from '../../hooks/useMediaAuthentication';
import { mxcUrlToHttp } from '../../utils/matrix';
import { nameInitials } from '../../utils/common';
import * as css from './IncomingCallPrompt.css';

// Repeating placeholder ring tone generated on the fly (no asset shipped).
const useRingtone = () => {
  useEffect(() => {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    let stopped = false;

    const blip = (freq: number, at: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.06, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.4);
      osc.start(at);
      osc.stop(at + 0.45);
    };

    const ring = () => {
      if (stopped) return;
      const now = ctx.currentTime;
      blip(520, now);
      blip(660, now + 0.5);
    };

    ring();
    const interval = window.setInterval(ring, 3000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      ctx.close().catch(() => undefined);
    };
  }, []);
};

type IncomingCallPromptProps = {
  call: MatrixCall;
  onAnswer: () => void;
  onReject: () => void;
};

export function IncomingCallPrompt({ call, onAnswer, onReject }: IncomingCallPromptProps) {
  const mx = useMatrixClient();
  const useAuthentication = useMediaAuthentication();
  const answerRef = useRef<HTMLButtonElement>(null);

  useRingtone();

  useEffect(() => {
    answerRef.current?.focus();
  }, []);

  const member = call.getOpponentMember();
  const peerId = member?.userId ?? call.invitee ?? '';
  const name = member?.name ?? peerId;
  const avatarMxc = member?.getMxcAvatarUrl();
  const avatarUrl = avatarMxc
    ? mxcUrlToHttp(mx, avatarMxc, useAuthentication, 64, 64, 'crop') ?? undefined
    : undefined;

  return (
    <Box className={css.IncomingCallPrompt} alignItems="Center" gap="300">
      <Avatar size="300">
        <UserAvatar
          userId={peerId}
          src={avatarUrl}
          alt={name}
          renderFallback={() => (
            <Text as="span" size="H6">
              {nameInitials(name)}
            </Text>
          )}
        />
      </Avatar>
      <Box direction="Column" grow="Yes" style={{ minWidth: 0 }}>
        <Text size="T300" truncate>
          {name}
        </Text>
        <Text size="T200" priority="300">
          Incoming audio call…
        </Text>
      </Box>
      <Box shrink="No" gap="200">
        <IconButton
          variant="Critical"
          radii="Pill"
          onClick={onReject}
          aria-label="Decline call"
          style={{ padding: config.space.S200 }}
        >
          <Icon src={Icons.PhoneDown} filled />
        </IconButton>
        <IconButton
          ref={answerRef}
          variant="Success"
          radii="Pill"
          onClick={onAnswer}
          aria-label="Answer call"
          style={{ padding: config.space.S200 }}
        >
          <Icon src={Icons.Phone} filled />
        </IconButton>
      </Box>
    </Box>
  );
}
