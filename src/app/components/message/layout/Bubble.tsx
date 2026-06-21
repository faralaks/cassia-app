import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { Box, ContainerColor, as, color } from 'folds';
import * as css from './layout.css';

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

type BubbleLayoutProps = {
  hideBubble?: boolean;
  before?: ReactNode;
  header?: ReactNode;
  isOwn?: boolean;
};

export const BubbleLayout = as<'div', BubbleLayoutProps>(
  ({ hideBubble, before, header, children, isOwn, ...props }, ref) => (
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
  )
);
