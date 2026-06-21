import React from 'react';
import { useAtomValue } from 'jotai';
import { Page } from '../../components/page';
import { defaultStyleAtom } from '../../state/room/roomStyles';
import { bgImageCss } from '../../utils/chatStyle';

// Shown when no chat is selected — no logo, no actions. Just the default chat
// background, awaiting manual chat selection by the user.
export function WelcomePage() {
  const defaultStyle = useAtomValue(defaultStyleAtom);

  return (
    <Page
      style={
        defaultStyle.bgImage && !defaultStyle.bgPlain
          ? { background: bgImageCss(defaultStyle.bgImage, defaultStyle.bgDim ?? 0) }
          : undefined
      }
    />
  );
}
