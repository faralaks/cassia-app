import React, { MouseEventHandler, ReactNode, useEffect, useState } from 'react';
import {
  Box,
  Chip,
  Icon,
  IconButton,
  Icons,
  Menu,
  PopOut,
  MenuItem,
  RectCords,
  Text,
  color,
  config,
  toRem,
} from 'folds';
import FocusTrap from 'focus-trap-react';
import { UploadCard, UploadCardError, UploadCardProgress } from './UploadCard';
import { UploadStatus, UploadSuccess, useBindUploadAtom } from '../../state/upload';
import { useMatrixClient } from '../../hooks/useMatrixClient';
import { TUploadContent } from '../../utils/matrix';
import { bytesToSize, getFileTypeIcon } from '../../utils/common';
import {
  roomUploadAtomFamily,
  TUploadItem,
  TUploadMetadata,
} from '../../state/room/roomInputDrafts';
import { useObjectURL } from '../../hooks/useObjectURL';
import { useMediaConfig } from '../../hooks/useMediaConfig';
import { useSetting } from '../../state/hooks/settings';
import { settingsAtom } from '../../state/settings';
import {
  ImageQuality,
  QUALITY_VALUE,
  compressImageFile,
  isCompressibleImage,
} from '../../utils/imageCompression';
import { stopPropagation } from '../../utils/keyboard';

type PreviewImageProps = {
  fileItem: TUploadItem;
};
function PreviewImage({ fileItem }: PreviewImageProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return (
    <img
      style={{
        objectFit: 'contain',
        width: '100%',
        height: toRem(152),
        filter: metadata.markedAsSpoiler ? 'blur(44px)' : undefined,
      }}
      alt={originalFile.name}
      src={fileUrl}
    />
  );
}

type PreviewVideoProps = {
  fileItem: TUploadItem;
};
function PreviewVideo({ fileItem }: PreviewVideoProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      style={{
        objectFit: 'contain',
        width: '100%',
        height: toRem(152),
        filter: metadata.markedAsSpoiler ? 'blur(44px)' : undefined,
      }}
      src={fileUrl}
    />
  );
}

type MediaPreviewProps = {
  fileItem: TUploadItem;
  onSpoiler: (marked: boolean) => void;
  children: ReactNode;
};
function MediaPreview({ fileItem, onSpoiler, children }: MediaPreviewProps) {
  const { originalFile, metadata } = fileItem;
  const fileUrl = useObjectURL(originalFile);

  return fileUrl ? (
    <Box
      style={{
        borderRadius: config.radii.R300,
        overflow: 'hidden',
        backgroundColor: 'black',
        position: 'relative',
      }}
    >
      {children}
      <Box
        justifyContent="End"
        style={{
          position: 'absolute',
          bottom: config.space.S100,
          left: config.space.S100,
          right: config.space.S100,
        }}
      >
        <Chip
          variant={metadata.markedAsSpoiler ? 'Warning' : 'Secondary'}
          fill="Soft"
          radii="Pill"
          aria-pressed={metadata.markedAsSpoiler}
          before={<Icon src={Icons.EyeBlind} size="50" />}
          onClick={() => onSpoiler(!metadata.markedAsSpoiler)}
        >
          <Text size="B300">Spoiler</Text>
        </Chip>
      </Box>
    </Box>
  ) : null;
}

const QUALITY_ITEMS: { name: string; quality: ImageQuality }[] = [
  { name: 'High quality', quality: 'high' },
  { name: 'Medium quality', quality: 'medium' },
  { name: 'Low quality', quality: 'low' },
];

type CompressMenuProps = {
  busy: boolean;
  onPick: (quality: ImageQuality) => void;
};
function CompressMenu({ busy, onPick }: CompressMenuProps) {
  const [cords, setCords] = useState<RectCords>();

  const handleMenu: MouseEventHandler<HTMLButtonElement> = (evt) => {
    setCords(evt.currentTarget.getBoundingClientRect());
  };

  const handlePick = (quality: ImageQuality) => {
    setCords(undefined);
    onPick(quality);
  };

  return (
    <>
      <Chip
        as="button"
        onClick={handleMenu}
        aria-label="Compress and send"
        variant="Primary"
        radii="Pill"
        outlined
        disabled={busy}
        before={<Icon src={Icons.Photo} size="50" />}
      >
        <Text size="B300">{busy ? 'Compressing…' : 'Compress & send'}</Text>
      </Chip>
      <PopOut
        anchor={cords}
        offset={5}
        position="Bottom"
        align="End"
        content={
          <FocusTrap
            focusTrapOptions={{
              initialFocus: false,
              onDeactivate: () => setCords(undefined),
              clickOutsideDeactivates: true,
              escapeDeactivates: stopPropagation,
            }}
          >
            <Menu>
              <Box direction="Column" gap="100" style={{ padding: config.space.S100 }}>
                {QUALITY_ITEMS.map((item) => (
                  <MenuItem
                    key={item.quality}
                    size="300"
                    variant="Surface"
                    radii="300"
                    onClick={() => handlePick(item.quality)}
                  >
                    <Text size="T300">{item.name}</Text>
                  </MenuItem>
                ))}
              </Box>
            </Menu>
          </FocusTrap>
        }
      />
    </>
  );
}

type UploadCardRendererProps = {
  isEncrypted?: boolean;
  fileItem: TUploadItem;
  setMetadata: (fileItem: TUploadItem, metadata: TUploadMetadata) => void;
  onRemove: (file: TUploadContent) => void;
  onReplace?: (fileItem: TUploadItem, newOriginalFile: File) => void;
  onComplete?: (upload: UploadSuccess) => void;
};
export function UploadCardRenderer({
  isEncrypted,
  fileItem,
  setMetadata,
  onRemove,
  onReplace,
  onComplete,
}: UploadCardRendererProps) {
  const mx = useMatrixClient();
  const mediaConfig = useMediaConfig();
  const [imageUploadLimitMB] = useSetting(settingsAtom, 'imageUploadLimitMB');

  const configuredLimit = imageUploadLimitMB * 1024 * 1024;
  const allowSize = Math.min(mediaConfig['m.upload.size'] || Infinity, configuredLimit);

  const uploadAtom = roomUploadAtomFamily(fileItem.file);
  const { metadata } = fileItem;
  const { upload, startUpload, cancelUpload } = useBindUploadAtom(mx, uploadAtom, isEncrypted);
  const { file } = upload;
  const fileSizeExceeded = file.size >= allowSize;

  const [compressing, setCompressing] = useState(false);

  if (upload.status === UploadStatus.Idle && !fileSizeExceeded) {
    startUpload();
  }

  const isImage =
    fileItem.originalFile instanceof File && isCompressibleImage(fileItem.originalFile);
  const canCompress =
    !!onReplace &&
    isImage &&
    (upload.status === UploadStatus.Error ||
      (upload.status === UploadStatus.Idle && fileSizeExceeded));

  const handleSpoiler = (marked: boolean) => {
    setMetadata(fileItem, { ...metadata, markedAsSpoiler: marked });
  };

  const removeUpload = () => {
    cancelUpload();
    onRemove(file);
  };

  const handleCompress = async (quality: ImageQuality) => {
    if (!onReplace || !(fileItem.originalFile instanceof File)) return;
    setCompressing(true);
    try {
      const compressed = await compressImageFile(fileItem.originalFile, {
        quality: QUALITY_VALUE[quality],
        maxBytes: configuredLimit,
      });
      onReplace(fileItem, compressed);
    } catch {
      setCompressing(false);
    }
  };

  useEffect(() => {
    setCompressing(false);
  }, [fileItem.file]);

  useEffect(() => {
    if (upload.status === UploadStatus.Success) {
      onComplete?.(upload);
    }
  }, [upload, onComplete]);

  return (
    <UploadCard
      radii="300"
      before={<Icon src={getFileTypeIcon(Icons, file.type)} />}
      after={
        <>
          {canCompress && <CompressMenu busy={compressing} onPick={handleCompress} />}
          {upload.status === UploadStatus.Error && (
            <Chip
              as="button"
              onClick={startUpload}
              aria-label="Retry Upload"
              variant="Critical"
              radii="Pill"
              outlined
            >
              <Text size="B300">Retry</Text>
            </Chip>
          )}
          <IconButton
            onClick={removeUpload}
            aria-label="Cancel Upload"
            variant="SurfaceVariant"
            radii="Pill"
            size="300"
          >
            <Icon src={Icons.Cross} size="200" />
          </IconButton>
        </>
      }
      bottom={
        <>
          {fileItem.originalFile.type.startsWith('image') && (
            <MediaPreview fileItem={fileItem} onSpoiler={handleSpoiler}>
              <PreviewImage fileItem={fileItem} />
            </MediaPreview>
          )}
          {fileItem.originalFile.type.startsWith('video') && (
            <MediaPreview fileItem={fileItem} onSpoiler={handleSpoiler}>
              <PreviewVideo fileItem={fileItem} />
            </MediaPreview>
          )}
          {upload.status === UploadStatus.Idle && !fileSizeExceeded && (
            <UploadCardProgress sentBytes={0} totalBytes={file.size} />
          )}
          {upload.status === UploadStatus.Loading && (
            <UploadCardProgress sentBytes={upload.progress.loaded} totalBytes={file.size} />
          )}
          {upload.status === UploadStatus.Error && (
            <UploadCardError>
              <Text size="T200">
                {upload.error.message}
                {isImage ? ' Try “Compress & send” to shrink it below the limit.' : ''}
              </Text>
            </UploadCardError>
          )}
          {upload.status === UploadStatus.Idle && fileSizeExceeded && (
            <UploadCardError>
              <Text size="T200">
                This file is <b>{bytesToSize(file.size)}</b>, over the{' '}
                <b>{bytesToSize(allowSize)}</b> limit.
                {isImage
                  ? ' Use “Compress & send” to shrink it, or remove it.'
                  : ' Remove it and send a smaller file.'}
              </Text>
            </UploadCardError>
          )}
        </>
      }
    >
      <Text size="H6" truncate>
        {file.name}
      </Text>
      {upload.status === UploadStatus.Success && (
        <Icon style={{ color: color.Success.Main }} src={Icons.Check} size="100" />
      )}
    </UploadCard>
  );
}
