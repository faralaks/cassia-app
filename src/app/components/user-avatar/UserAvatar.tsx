import { AvatarFallback, AvatarImage, color } from 'folds';
import React, { ReactEventHandler, ReactNode, useEffect, useState } from 'react';
import classNames from 'classnames';
import * as css from './UserAvatar.css';
import colorMXID from '../../../util/colorMXID';
import { useUserAvatarOverrideValue } from '../../state/userAvatars';

type UserAvatarProps = {
  className?: string;
  userId: string;
  src?: string;
  alt?: string;
  renderFallback: () => ReactNode;
};
export function UserAvatar({ className, userId, src, alt, renderFallback }: UserAvatarProps) {
  // Custom override (set in the contact card) wins over the Matrix avatar.
  const override = useUserAvatarOverrideValue(userId);
  const effectiveSrc = override ?? src;

  const [error, setError] = useState(false);
  useEffect(() => setError(false), [effectiveSrc]);

  const handleLoad: ReactEventHandler<HTMLImageElement> = (evt) => {
    evt.currentTarget.setAttribute('data-image-loaded', 'true');
  };

  if (!effectiveSrc || error) {
    return (
      <AvatarFallback
        style={{ backgroundColor: colorMXID(userId), color: color.Surface.Container }}
        className={classNames(css.UserAvatar, className)}
      >
        {renderFallback()}
      </AvatarFallback>
    );
  }

  return (
    <AvatarImage
      className={classNames(css.UserAvatar, className)}
      src={effectiveSrc}
      alt={alt}
      onError={() => setError(true)}
      onLoad={handleLoad}
      draggable={false}
    />
  );
}
