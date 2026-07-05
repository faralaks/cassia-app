import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MatrixCall } from 'matrix-js-sdk';
import { CallErrorCode, CallEvent, CallState, CallDirection } from 'matrix-js-sdk/lib/webrtc/call';
import { CallEventHandlerEvent } from 'matrix-js-sdk/lib/webrtc/callEventHandler';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { getAccountData, getMDirects } from '../../utils/room';
import { AccountDataEvent } from '../../../types/matrix/accountData';
import { webRTCSupported } from '../../utils/rtc';
import { IncomingCallPrompt } from './IncomingCallPrompt';
import { startCallSession, updateCallSessionMic, endCallSession } from '../../utils/callSession';

// Snapshot of the single active legacy (1:1 VoIP) call, mirrored into React state.
export type LegacyVoipSnapshot = {
  active: boolean;
  roomId?: string;
  peerId?: string;
  state: CallState | null;
  direction: CallDirection | null;
  muted: boolean;
  length: number;
};

export type LegacyVoip = LegacyVoipSnapshot & {
  localStream: MediaStream | null;
  placeCall: (roomId: string) => void;
  hangup: () => void;
  toggleMute: () => void;
};

const EMPTY_SNAPSHOT: LegacyVoipSnapshot = {
  active: false,
  state: null,
  direction: null,
  muted: false,
  length: 0,
};

const LegacyVoipContext = createContext<LegacyVoip | null>(null);

export const useLegacyVoip = (): LegacyVoip => {
  const ctx = useContext(LegacyVoipContext);
  if (!ctx) throw new Error('LegacyVoipProvider not mounted!');
  return ctx;
};

type LegacyVoipProviderProps = {
  children: ReactNode;
};

export function LegacyVoipProvider({ children }: LegacyVoipProviderProps) {
  const mx = useMatrixClient();

  const callRef = useRef<MatrixCall | null>(null);
  const lengthRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const bindRef = useRef<(call: MatrixCall) => void>(() => undefined);

  const [snapshot, setSnapshot] = useState<LegacyVoipSnapshot>(EMPTY_SNAPSHOT);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [incoming, setIncoming] = useState<MatrixCall | null>(null);

  const sync = useCallback(() => {
    const call = callRef.current;
    if (!call) {
      setSnapshot(EMPTY_SNAPSHOT);
      return;
    }
    setSnapshot({
      active: true,
      roomId: call.roomId,
      peerId: call.getOpponentMember()?.userId ?? call.invitee,
      state: call.state,
      direction: call.direction ?? null,
      muted: call.isMicrophoneMuted(),
      length: lengthRef.current,
    });
  }, []);

  const attachStreams = useCallback(() => {
    const call = callRef.current;
    const remote = call?.remoteUsermediaStream ?? null;
    if (audioRef.current) {
      audioRef.current.srcObject = remote;
      if (remote) audioRef.current.play().catch(() => undefined);
    }
    setLocalStream(call?.localUsermediaStream ?? null);
  }, []);

  const teardown = useCallback(() => {
    const call = callRef.current;
    if (call) call.removeAllListeners();
    callRef.current = null;
    lengthRef.current = 0;
    if (audioRef.current) audioRef.current.srcObject = null;
    setLocalStream(null);
    sync();
  }, [sync]);

  const bind = useCallback(
    (call: MatrixCall) => {
      call.on(CallEvent.State, (state) => {
        if (state === CallState.Connected) attachStreams();
        sync();
        if (state === CallState.Ended) teardown();
      });
      call.on(CallEvent.FeedsChanged, () => {
        attachStreams();
        sync();
      });
      call.on(CallEvent.LengthChanged, (length) => {
        lengthRef.current = length;
        sync();
      });
      call.on(CallEvent.Replaced, (newCall) => {
        call.removeAllListeners();
        callRef.current = newCall;
        bindRef.current(newCall);
        attachStreams();
        sync();
      });
      call.on(CallEvent.Hangup, () => teardown());
      // Required: placeCall/answer throw if no 'error' listener is attached.
      call.on(CallEvent.Error, (err) => {
        // eslint-disable-next-line no-console
        console.error('Legacy call error', err);
      });
    },
    [attachStreams, sync, teardown]
  );
  bindRef.current = bind;

  const placeCall = useCallback(
    (roomId: string) => {
      if (callRef.current || !webRTCSupported()) return;
      const call = mx.createCall(roomId);
      if (!call) return;
      callRef.current = call;
      lengthRef.current = 0;
      bind(call);
      sync();
      call.placeVoiceCall().catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to place call', err);
        teardown();
      });
    },
    [mx, bind, sync, teardown]
  );

  const hangup = useCallback(() => {
    callRef.current?.hangup(CallErrorCode.UserHangup, false);
    teardown();
  }, [teardown]);

  const toggleMute = useCallback(() => {
    const call = callRef.current;
    if (!call) return;
    call.setMicrophoneMuted(!call.isMicrophoneMuted()).finally(sync);
  }, [sync]);

  const answerIncoming = useCallback(() => {
    const call = incoming;
    if (!call) return;
    setIncoming(null);
    callRef.current = call;
    lengthRef.current = 0;
    bind(call);
    sync();
    call.answer(true, false).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('Failed to answer call', err);
      teardown();
    });
  }, [incoming, bind, sync, teardown]);

  const rejectIncoming = useCallback(() => {
    incoming?.reject();
    setIncoming(null);
  }, [incoming]);

  // Best-effort OS call integration while a call is active: iOS
  // play-and-record audio session, screen wake lock (auto-lock was killing
  // calls), media-session metadata + hangup/mic actions. See callSession.ts.
  useEffect(() => {
    if (!snapshot.active) return undefined;
    startCallSession(snapshot.peerId ?? 'Voice call', {
      onHangup: hangup,
      onToggleMic: toggleMute,
    });
    return () => endCallSession();
  }, [snapshot.active, snapshot.peerId, hangup, toggleMute]);

  useEffect(() => {
    if (snapshot.active) updateCallSessionMic(snapshot.muted);
  }, [snapshot.active, snapshot.muted]);

  // Mic self-heal: iOS suspends capture when the app is backgrounded /
  // screen-locked and the dead track never recovers by itself — the call
  // continues with a silent mic. On return to foreground, if the local audio
  // track died (or stayed OS-muted), rebuild it via a mute/unmute cycle
  // (the SDK re-acquires the microphone on unmute).
  useEffect(() => {
    if (!snapshot.active) return undefined;
    const recover = () => {
      if (document.visibilityState !== 'visible') return;
      window.setTimeout(() => {
        const call = callRef.current;
        if (!call || call.state !== CallState.Connected || call.isMicrophoneMuted()) return;
        const track = call.localUsermediaStream?.getAudioTracks()[0];
        if (!track || track.readyState === 'ended' || track.muted) {
          call
            .setMicrophoneMuted(true)
            .then(() => call.setMicrophoneMuted(false))
            .catch(() => undefined)
            .finally(sync);
        }
      }, 500);
    };
    document.addEventListener('visibilitychange', recover);
    return () => document.removeEventListener('visibilitychange', recover);
  }, [snapshot.active, sync]);

  useEffect(() => {
    const onIncoming = (call: MatrixCall) => {
      const directEvent = getAccountData(mx, AccountDataEvent.Direct);
      const directs = directEvent ? getMDirects(directEvent) : new Set<string>();
      const isDirect = directs.has(call.roomId);
      if (!isDirect || callRef.current || incoming) {
        if (isDirect && (callRef.current || incoming)) call.reject();
        return;
      }
      const dismiss = () => setIncoming((cur) => (cur === call ? null : cur));
      call.on(CallEvent.Hangup, dismiss);
      call.on(CallEvent.State, (state) => {
        if (state === CallState.Ended) dismiss();
      });
      setIncoming(call);
    };

    mx.on(CallEventHandlerEvent.Incoming, onIncoming);
    return () => {
      mx.removeListener(CallEventHandlerEvent.Incoming, onIncoming);
    };
  }, [mx, incoming]);

  const value = useMemo<LegacyVoip>(
    () => ({
      ...snapshot,
      localStream,
      placeCall,
      hangup,
      toggleMute,
    }),
    [snapshot, localStream, placeCall, hangup, toggleMute]
  );

  return (
    <LegacyVoipContext.Provider value={value}>
      {children}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio ref={audioRef} autoPlay />
      {incoming && (
        <IncomingCallPrompt call={incoming} onAnswer={answerIncoming} onReject={rejectIncoming} />
      )}
    </LegacyVoipContext.Provider>
  );
}
