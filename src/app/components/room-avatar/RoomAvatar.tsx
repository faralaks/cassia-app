import { JoinRule } from 'matrix-js-sdk';
import { AvatarFallback, AvatarImage, Icon, Icons, color } from 'folds';
import React, {
  ComponentProps,
  ReactEventHandler,
  ReactNode,
  forwardRef,
  useEffect,
  useState,
} from 'react';
import * as css from './RoomAvatar.css';
import { getRoomIconSrc } from '../../utils/room';
import colorMXID from '../../../util/colorMXID';
import { useUserAvatarOverrideValue } from '../../state/userAvatars';

type RoomAvatarProps = {
  roomId: string;
  colorId?: string;
  overrideUserId?: string;
  src?: string;
  alt?: string;
  renderFallback: () => ReactNode;
};
export function RoomAvatar({
  roomId,
  colorId,
  overrideUserId,
  src,
  alt,
  renderFallback,
}: RoomAvatarProps) {
  // For DMs the row passes the peer's userId so a custom avatar override
  // resolves to the same source used everywhere else.
  const override = useUserAvatarOverrideValue(overrideUserId ?? '');
  const effectiveSrc = override ?? src;

  const [error, setError] = useState(false);
  useEffect(() => setError(false), [effectiveSrc]);

  const handleLoad: ReactEventHandler<HTMLImageElement> = (evt) => {
    evt.currentTarget.setAttribute('data-image-loaded', 'true');
  };

  if (!effectiveSrc || error) {
    return (
      <AvatarFallback
        style={{ backgroundColor: colorMXID(colorId ?? roomId ?? ''), color: color.Surface.Container }}
        className={css.RoomAvatar}
      >
        {renderFallback()}
      </AvatarFallback>
    );
  }

  return (
    <AvatarImage
      className={css.RoomAvatar}
      src={effectiveSrc}
      alt={alt}
      onError={() => setError(true)}
      onLoad={handleLoad}
      draggable={false}
    />
  );
}

export const RoomIcon = forwardRef<
  SVGSVGElement,
  Omit<ComponentProps<typeof Icon>, 'src'> & {
    joinRule?: JoinRule;
    roomType?: string;
  }
>(({ joinRule, roomType, ...props }, ref) => (
  <Icon src={getRoomIconSrc(Icons, roomType, joinRule)} {...props} ref={ref} />
));
