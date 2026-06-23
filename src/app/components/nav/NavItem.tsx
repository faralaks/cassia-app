import classNames from 'classnames';
import React, { ComponentProps, forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { as } from 'folds';
import * as css from './styles.css';
import { ScreenSize, useScreenSizeContext } from '../../hooks/useScreenSize';

const supportsViewTransitions = (): boolean =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function';

export const NavItem = as<
  'div',
  {
    highlight?: boolean;
  } & css.RoomSelectorVariants
>(({ as: AsNavItem = 'div', className, highlight, variant, radii, children, ...props }, ref) => (
  <AsNavItem
    className={classNames(css.NavItem({ variant, radii }), className)}
    data-highlight={highlight}
    {...props}
    ref={ref}
  >
    {children}
  </AsNavItem>
));

export const NavLink = forwardRef<HTMLAnchorElement, ComponentProps<typeof Link>>(
  ({ className, onMouseDown, onClick, viewTransition, ...props }, ref) => {
    const screenSize = useScreenSizeContext();
    // Opening a nav item (room/section) is a forward action — on mobile slide
    // the new screen in from the right. Desktop/unsupported browsers no-op.
    const animate = screenSize === ScreenSize.Mobile && supportsViewTransitions();

    const handleMouseDown = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (e.button === 2) e.preventDefault();
      onMouseDown?.(e);
    };
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (animate) {
        const html = document.documentElement;
        html.setAttribute('data-vt-mobile', '');
        html.setAttribute('data-vt', 'forward');
      }
      onClick?.(e);
    };
    return (
      <Link
        className={classNames(css.NavLink, className)}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        viewTransition={viewTransition ?? animate}
        {...props}
        ref={ref}
      />
    );
  }
);

export const NavButton = as<'button'>(
  ({ as: AsNavButton = 'button', className, ...props }, ref) => (
    <AsNavButton className={classNames(css.NavLink, className)} {...props} ref={ref} />
  )
);
