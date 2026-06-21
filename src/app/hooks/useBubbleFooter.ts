import { createContext, useContext } from 'react';

export type BubbleFooterContextValue = {
  setExtraText: (text: string | undefined) => void;
};

export const BubbleFooterContext = createContext<BubbleFooterContextValue | undefined>(undefined);

export const useBubbleFooterContext = (): BubbleFooterContextValue | undefined =>
  useContext(BubbleFooterContext);
