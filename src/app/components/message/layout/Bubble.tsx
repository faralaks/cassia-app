import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Box, ContainerColor, as, color, toRem } from 'folds';
import * as css from './layout.css';
import { ScreenSize, useScreenSizeContext } from '../../../hooks/useScreenSize';

type BubbleArrowProps = {
  variant: ContainerColor;
};

function BubbleLeftArrow({ variant }: BubbleArrowProps) {
  return (
    <svg
      className={css.BubbleLeftArrow}
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.00004 8V0H4.82847C3.04666 0 2.15433 2.15428 3.41426 3.41421L8.00004 8H9.00004Z"
        fill={color[variant].Container}
      />
    </svg>
  );
}

function BubbleRightArrow({ variant }: BubbleArrowProps) {
  return (
    <svg
      className={css.BubbleRightArrow}
      width="9"
      height="8"
      viewBox="0 0 9 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 8V0H4.17157C5.95338 0 6.84571 2.15428 5.58578 3.41421L1 8H0Z"
        fill={`var(--bubble-outgoing-bg, ${color[variant].Container})`}
      />
    </svg>
  );
}

// Telegram-style curved bottom-corner tail for mobile bubbles: a concave
// sweep from the bubble's bottom edge out to a point at the screen-side
// corner. Tucked 2px under the bubble so no seam shows (see the tail styles
// in layout.css.ts for the geometry).
function BubbleBottomTail({ own }: { own: boolean }) {
  return (
    <svg
      className={own ? css.BubbleBottomTailOwn : css.BubbleBottomTailIn}
      width="10"
      height="13"
      viewBox="0 0 10 13"
      fill="none"
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d={own ? 'M0 3C1.2 8 4.5 11.4 10 13L0 13Z' : 'M10 3C8.8 8 5.5 11.4 0 13L10 13Z'}
        fill={
          own
            ? 'var(--bubble-outgoing-bg, rgba(70, 90, 180, 0.85))'
            : 'var(--bubble-incoming-bg, rgba(60, 60, 80, 0.85))'
        }
      />
    </svg>
  );
}

type BubbleLayoutProps = {
  hideBubble?: boolean;
  before?: ReactNode;
  header?: ReactNode;
  isOwn?: boolean;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  ({ hideBubble, before, header, children, isOwn, ...props }, ref) => {
    const mobile = useScreenSizeContext() === ScreenSize.Mobile;

    // Mobile portrait: no avatar gutter — the sender avatar sits inline with
    // the header row ABOVE the message group, so bubbles (incoming and
    // outgoing alike) hug their screen edge instead of losing ~50px to the
    // side column. The left bubble arrow goes with the gutter; the outgoing
    // arrow stays.
    if (mobile) {
      return (
        <Box justifyContent={isOwn ? 'End' : 'Start'} {...props} ref={ref}>
          <Box grow="No" direction="Column" alignItems={isOwn ? 'End' : 'Start'} gap="100">
            {(header || (!isOwn && before)) && (
              <Box alignItems="Center" gap="200">
                {!isOwn && before}
                {header}
              </Box>
            )}
            {hideBubble ? (
              children
            ) : (
              <Box>
                <Box
                  className={isOwn ? css.BubbleContentOwn : css.BubbleContent}
                  direction="Column"
                  // Square the corner the tail grows from so bubble + tail
                  // read as one shape.
                  style={
                    isOwn
                      ? { borderBottomRightRadius: toRem(4) }
                      : { borderBottomLeftRadius: toRem(4) }
                  }
                >
                  <BubbleBottomTail own={!!isOwn} />
                  {children}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      );
    }

    return (
      <Box gap="300" justifyContent={isOwn ? 'End' : 'Start'} {...props} ref={ref}>
        {!isOwn && (
          <Box className={css.BubbleBefore} shrink="No">
            {before}
          </Box>
        )}
        <Box grow="No" direction="Column" alignItems={isOwn ? 'End' : 'Start'}>
          {header}
          {hideBubble ? (
            children
          ) : (
            <Box>
              <Box
                className={classNames(
                  isOwn ? css.BubbleContentOwn : css.BubbleContent,
                  !isOwn && before ? css.BubbleContentArrowLeft : undefined
                )}
                direction="Column"
              >
                {!isOwn && before ? <BubbleLeftArrow variant="SurfaceVariant" /> : null}
                {isOwn ? <BubbleRightArrow variant="Primary" /> : null}
                {children}
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }
);
