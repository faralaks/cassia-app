import React, { MouseEventHandler, useState } from 'react';
import {
  Avatar,
  Box,
  Icon,
  IconButton,
  Icons,
  Menu,
  MenuItem,
  Modal,
  Overlay,
  OverlayBackdrop,
  OverlayCenter,
  PopOut,
  RectCords,
  Text,
  config,
} from 'folds';
import classNames from 'classnames';
import FocusTrap from 'focus-trap-react';
import * as css from './styles.css';
import { UserAvatar } from '../user-avatar';
import colorMXID from '../../../util/colorMXID';
import { getMxIdLocalPart } from '../../utils/matrix';
import { BreakWord, LineClamp3 } from '../../styles/Text.css';
import { UserPresence } from '../../hooks/useUserPresence';
import { AvatarPresence, PresenceBadge } from '../presence';
import { ImageViewer } from '../image-viewer';
import { stopPropagation } from '../../utils/keyboard';
import { useFilePicker } from '../../hooks/useFilePicker';
import { useUserAvatarOverride } from '../../state/userAvatars';
import { encodeAvatar } from '../../utils/userAvatar';

type UserHeroProps = {
  userId: string;
  avatarUrl?: string;
  presence?: UserPresence;
};
export function UserHero({ userId, avatarUrl, presence }: UserHeroProps) {
  const [viewAvatar, setViewAvatar] = useState<string>();
  const [menuAnchor, setMenuAnchor] = useState<RectCords>();

  const override = useUserAvatarOverride(userId);
  const displayUrl = override.value ?? avatarUrl;
  const hasOverride = override.value !== undefined;

  const handleAvatarFile = async (file: File) => {
    setMenuAnchor(undefined);
    try {
      const dataUrl = await encodeAvatar(file);
      override.set(dataUrl);
    } catch {
      // bad/unsupported image; leave the existing avatar untouched
    }
  };
  const pickAvatar = useFilePicker(handleAvatarFile, false);

  const handleReset = () => {
    setMenuAnchor(undefined);
    override.clear();
  };

  const openMenuFromButton: MouseEventHandler<HTMLButtonElement> = (evt) => {
    evt.stopPropagation();
    setMenuAnchor(evt.currentTarget.getBoundingClientRect());
  };
  const openMenuFromContext: MouseEventHandler<HTMLElement> = (evt) => {
    evt.preventDefault();
    evt.stopPropagation();
    setMenuAnchor({ x: evt.clientX, y: evt.clientY, width: 0, height: 0 });
  };

  return (
    <Box direction="Column" className={css.UserHero}>
      <div
        className={css.UserHeroCoverContainer}
        style={{
          backgroundColor: colorMXID(userId),
          filter: displayUrl ? undefined : 'brightness(50%)',
        }}
      >
        {displayUrl && (
          <img
            key={displayUrl}
            ref={(el) => {
              if (el && el.complete) el.style.opacity = '1';
            }}
            className={css.UserHeroCover}
            src={displayUrl}
            alt={userId}
            draggable="false"
            style={{ opacity: 0, transition: 'opacity 200ms ease-out' }}
            onLoad={(evt) => {
              evt.currentTarget.style.opacity = '1';
            }}
          />
        )}
      </div>
      <div className={css.UserHeroAvatarContainer}>
        <AvatarPresence
          className={css.UserAvatarContainer}
          onContextMenu={openMenuFromContext}
          badge={
            presence && <PresenceBadge presence={presence.presence} status={presence.status} />
          }
        >
          <Avatar
            as={displayUrl ? 'button' : 'div'}
            onClick={displayUrl ? () => setViewAvatar(displayUrl) : undefined}
            className={css.UserHeroAvatar}
            size="500"
            radii="Pill"
          >
            <UserAvatar
              className={css.UserHeroAvatarImg}
              userId={userId}
              src={avatarUrl}
              alt={userId}
              renderFallback={() => (
                <Text size="H3" style={{ color: 'inherit', lineHeight: 1 }}>
                  {(getMxIdLocalPart(userId)?.[0] ?? '?').toUpperCase()}
                </Text>
              )}
            />
          </Avatar>
          <IconButton
            className={css.AvatarEditButton}
            size="300"
            radii="Pill"
            variant="Surface"
            aria-label="Edit avatar"
            aria-pressed={!!menuAnchor}
            onClick={openMenuFromButton}
          >
            <Icon size="50" src={Icons.Pencil} />
          </IconButton>
        </AvatarPresence>
        <PopOut
          anchor={menuAnchor}
          offset={menuAnchor?.width === 0 ? 0 : undefined}
          position="Bottom"
          align={menuAnchor?.width === 0 ? 'Start' : 'Center'}
          content={
            <FocusTrap
              focusTrapOptions={{
                initialFocus: false,
                returnFocusOnDeactivate: false,
                onDeactivate: () => setMenuAnchor(undefined),
                clickOutsideDeactivates: true,
                escapeDeactivates: stopPropagation,
              }}
            >
              <Menu style={{ padding: config.space.S100 }}>
                <Box direction="Column" gap="100">
                  <MenuItem
                    size="300"
                    radii="300"
                    after={<Icon size="100" src={Icons.Photo} />}
                    onClick={() => {
                      setMenuAnchor(undefined);
                      pickAvatar('image/*');
                    }}
                  >
                    <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                      {hasOverride ? 'Upload new photo' : 'Upload photo'}
                    </Text>
                  </MenuItem>
                  {hasOverride && (
                    <MenuItem
                      size="300"
                      radii="300"
                      variant="Critical"
                      fill="None"
                      after={<Icon size="100" src={Icons.Delete} />}
                      onClick={handleReset}
                    >
                      <Text style={{ flexGrow: 1 }} as="span" size="T300" truncate>
                        Reset
                      </Text>
                    </MenuItem>
                  )}
                </Box>
              </Menu>
            </FocusTrap>
          }
        />
        {viewAvatar && (
          <Overlay open backdrop={<OverlayBackdrop />}>
            <OverlayCenter>
              <FocusTrap
                focusTrapOptions={{
                  initialFocus: false,
                  onDeactivate: () => setViewAvatar(undefined),
                  clickOutsideDeactivates: true,
                  escapeDeactivates: stopPropagation,
                }}
              >
                <Modal size="500" onContextMenu={(evt: any) => evt.stopPropagation()}>
                  <ImageViewer
                    src={viewAvatar}
                    alt={userId}
                    requestClose={() => setViewAvatar(undefined)}
                  />
                </Modal>
              </FocusTrap>
            </OverlayCenter>
          </Overlay>
        )}
      </div>
    </Box>
  );
}

type UserHeroNameProps = {
  displayName?: string;
  userId: string;
};
export function UserHeroName({ displayName, userId }: UserHeroNameProps) {
  const username = getMxIdLocalPart(userId);

  return (
    <Box grow="Yes" direction="Column" gap="0">
      <Box alignItems="Baseline" gap="200" wrap="Wrap">
        <Text
          size="H4"
          className={classNames(BreakWord, LineClamp3)}
          title={displayName ?? username}
        >
          {displayName ?? username ?? userId}
        </Text>
      </Box>
      <Box alignItems="Center" gap="100" wrap="Wrap">
        <Text size="T200" className={classNames(BreakWord, LineClamp3)} title={username}>
          @{username}
        </Text>
      </Box>
    </Box>
  );
}
