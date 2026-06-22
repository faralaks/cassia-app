import React, { ReactNode } from 'react';
import { Box } from 'folds';

type ClientLayoutProps = {
  nav: ReactNode;
  bottomNav?: ReactNode;
  children: ReactNode;
};
export function ClientLayout({ nav, bottomNav, children }: ClientLayoutProps) {
  return (
    <Box grow="Yes" direction="Column">
      <Box grow="Yes">
        <Box shrink="No">{nav}</Box>
        <Box grow="Yes">{children}</Box>
      </Box>
      {bottomNav}
    </Box>
  );
}
