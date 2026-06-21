import React, { CSSProperties, ReactNode } from 'react';
import { Box, Badge, toRem, Text } from 'folds';
import { millify } from '../../plugins/millify';

type UnreadBadgeProps = {
  highlight?: boolean;
  count: number;
};
const styles: CSSProperties = {
  minWidth: toRem(20),
};
export function UnreadBadgeCenter({ children }: { children: ReactNode }) {
  return (
    <Box as="span" style={styles} shrink="No" alignItems="Center" justifyContent="Center">
      {children}
    </Box>
  );
}

export function UnreadBadge({ highlight, count }: UnreadBadgeProps) {
  return (
    <Badge
      variant={highlight ? 'Success' : 'Secondary'}
      size={count > 0 ? '500' : '300'}
      fill="Solid"
      radii="Pill"
      outlined={false}
    >
      {count > 0 && (
        <Text as="span" size="T200">
          {millify(count)}
        </Text>
      )}
    </Badge>
  );
}
