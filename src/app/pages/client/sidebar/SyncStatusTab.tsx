import React, { useCallback, useState } from 'react';
import { Icon, Icons } from 'folds';
import { SyncState } from 'matrix-js-sdk';
import { useMatrixClient } from '../../../hooks/useMatrixClient';
import { useSyncState } from '../../../hooks/useSyncState';
import { SidebarAvatar, SidebarItem, SidebarItemTooltip } from '../../../components/sidebar';
import { ContainerColor } from '../../../styles/ContainerColor.css';

type SyncInfo = { variant: 'Warning' | 'Critical'; label: string } | null;

function getSyncInfo(current: SyncState | null): SyncInfo {
  if (current === SyncState.Reconnecting) {
    return { variant: 'Warning', label: 'Reconnecting...' };
  }
  if (current === SyncState.Error) {
    return { variant: 'Critical', label: 'Connection Lost!' };
  }
  return null;
}

export function SyncStatusTab() {
  const mx = useMatrixClient();
  const [current, setCurrent] = useState<SyncState | null>(null);

  useSyncState(
    mx,
    useCallback((state) => {
      setCurrent(state);
    }, [])
  );

  const info = getSyncInfo(current);
  if (!info) return null;

  return (
    <SidebarItem>
      <SidebarItemTooltip tooltip={info.label}>
        {(triggerRef) => (
          <SidebarAvatar ref={triggerRef} className={ContainerColor({ variant: info.variant })}>
            <Icon src={Icons.Warning} size="200" />
          </SidebarAvatar>
        )}
      </SidebarItemTooltip>
    </SidebarItem>
  );
}
