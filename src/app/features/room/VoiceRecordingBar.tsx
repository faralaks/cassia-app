import React, { useCallback, useRef, useState } from 'react';
import { Text } from 'folds';
import { secondsToMinutesAndSeconds } from '../../utils/common';
import { useElementSizeObserver } from '../../hooks/useElementSizeObserver';
import * as css from './VoiceRecordingBar.css';

// Keep in sync with WaveformBar width + Waveform gap in VoiceRecordingBar.css.ts.
const BAR_WIDTH = 3;
const BAR_GAP = 2;

type VoiceRecordingBarProps = {
  elapsed: number;
  levels: number[];
};

// Live recording indicator shown in place of the text area: pulsing dot,
// elapsed mm:ss timer, and a rolling waveform of recent input levels. The bar
// count is derived from the available width so thin fixed-width bars fill it.
export function VoiceRecordingBar({ elapsed, levels }: VoiceRecordingBarProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [barCount, setBarCount] = useState(0);

  useElementSizeObserver(
    useCallback(() => waveformRef.current, []),
    useCallback((width) => {
      setBarCount(Math.max(0, Math.floor((width + BAR_GAP) / (BAR_WIDTH + BAR_GAP))));
    }, [])
  );

  // Newest sample on the right; left-pad with zeros so the waveform always
  // fills the full width even early in the recording.
  let visible: number[] = [];
  if (barCount > 0) {
    const tail = levels.slice(Math.max(0, levels.length - barCount));
    visible =
      tail.length < barCount
        ? new Array(barCount - tail.length).fill(0).concat(tail)
        : tail;
  }

  return (
    <div className={css.VoiceRecordingBar}>
      <span className={css.RecordingDot} />
      <Text className={css.RecordingTime} size="T300">
        {secondsToMinutesAndSeconds(elapsed)}
      </Text>
      <div className={css.Waveform} ref={waveformRef}>
        {visible.map((level, i) => (
          <div
            // eslint-disable-next-line react/no-array-index-key
            key={i}
            className={css.WaveformBar}
            style={{ height: `${Math.max(Math.round(level * 100), 8)}%` }}
          />
        ))}
      </div>
    </div>
  );
}
