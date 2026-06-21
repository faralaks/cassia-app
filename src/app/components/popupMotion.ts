// Shared open/close animation for anchored popup surfaces (emoji board, contact
// card, pinned messages, etc.) so they feel consistent. Pair with AnimatePresence
// and a motion.div whose transformOrigin points back at the anchor.

export const getPopupMotionProps = (reduceMotion: boolean | null) => ({
  initial: reduceMotion ? false : { opacity: 0, scale: 0.96, y: 6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 6 },
  transition: { duration: reduceMotion ? 0 : 0.12, ease: 'easeOut' as const },
});
