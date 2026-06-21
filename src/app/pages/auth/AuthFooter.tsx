import React from 'react';
import { Box, Text } from 'folds';
import * as css from './styles.css';
import { APP_VERSION, RELEASES_URL, REPO_URL } from '../../cons';

export function AuthFooter() {
  return (
    <Box className={css.AuthFooter} justifyContent="Center" gap="400" wrap="Wrap">
      <Text as="a" size="T300" href={REPO_URL} target="_blank" rel="noreferrer">
        About
      </Text>
      <Text as="a" size="T300" href={RELEASES_URL} target="_blank" rel="noreferrer">
        v{APP_VERSION}
      </Text>
      <Text as="a" size="T300" href="https://matrix.org" target="_blank" rel="noreferrer">
        Powered by Matrix
      </Text>
    </Box>
  );
}
