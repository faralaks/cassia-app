import React, { useState } from 'react';
import { Box, Header, Icon, IconButton, Icons, Text, config } from 'folds';
import * as css from './styles.css';

const DISMISS_KEY = 'cassia_disclaimer_dismissed_v1';

// Honest warning shown bottom-right on the login page: this is an AI-written,
// unreviewed personal fork. Closable; the dismissal is remembered so it does
// not nag on every visit. Mirrors the disclaimer on the Settings -> About page.
export function DisclaimerPopup() {
  const [open, setOpen] = useState(() => localStorage.getItem(DISMISS_KEY) !== '1');

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setOpen(false);
  };

  return (
    <Box className={css.DisclaimerPopup} direction="Column">
      <Header className={css.DisclaimerHeader} size="400">
        <Box grow="Yes" alignItems="Center" gap="200">
          <Text size="L400">⚠️ Use at your own risk</Text>
        </Box>
        <IconButton size="300" variant="Surface" radii="300" onClick={dismiss}>
          <Icon src={Icons.Cross} size="200" />
        </IconButton>
      </Header>
      <Box
        direction="Column"
        gap="200"
        style={{ padding: config.space.S300, paddingTop: config.space.S200 }}
      >
        <Text size="T200">
          Cassia is a personal fork of Cinny. Most of the changes in this fork were written by
          Claude (Anthropic&apos;s AI assistant) and have not been fully reviewed or verified by a
          human. Expect rough edges and the occasional bug.
        </Text>
        <Text size="T200">
          If you use this client, you do so at your own risk. There is no warranty, and the
          maintainer is not responsible for any data loss, security issues, or other problems that
          may result from using it.
        </Text>
      </Box>
    </Box>
  );
}
