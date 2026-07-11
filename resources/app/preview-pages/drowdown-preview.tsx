import { useRef, useState } from 'react';

import { ButtonDefaultIcon } from '@/icons';
import Button from '@/molecules/button';
import Separator from '@/molecules/separator';
import {
  Dropdown,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownTrigger,
} from '@/molecules/dropdown';

type InvalidDropdownMenuItemProps = {
  onClick?: () => void;
};

const invalidOnClickProps = (
  onClick: () => void,
): InvalidDropdownMenuItemProps =>
  ({ onClick }) as unknown as InvalidDropdownMenuItemProps;

const DrowdownPreview = () => {
  const [openDropdown, setOpenDropdown] = useState<boolean>(false);
  const [openDropdownSubmenu, setOpenDropdownSubmenu] = useState<boolean>(false);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const triggerSubmenuRef = useRef<HTMLDivElement | null>(null);

  const toggleDropdownOpen = () => {
    setOpenDropdown((prev) => !prev);
  };
  const toggleDropdownSubmenu = () => {
    setOpenDropdownSubmenu((prev) => !prev);
  };
  const closeSubmenu = () => {
    setOpenDropdownSubmenu(false);
  };
  return (
    <div>
      <Dropdown>
        <DropdownTrigger ref={triggerRef}>
          <Button
            onClick={toggleDropdownOpen}
            type="outlined"
            text="Click Me"
          />
        </DropdownTrigger>
        <DropdownMenuContent
          hasLeftIcon
          triggerRef={triggerRef}
          isOpen={openDropdown}
          onClose={() => {
            setOpenDropdown(false);
            setOpenDropdownSubmenu(false);
          }}
        >
          <DropdownMenuItem state="titleOnly">My Account</DropdownMenuItem>
          <Separator />
          <DropdownMenuItem
            onItemClick={() => {
              setOpenDropdown(false);
            }}
            rightContent="⇧⌘P"
          >
            This is Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            leftIcon={<ButtonDefaultIcon />}
            state="disabled"
            rightContent="⌘B"
          >
            Billing
          </DropdownMenuItem>
          <DropdownMenuItem rightContent="⌘S">Settings</DropdownMenuItem>
          <DropdownMenuItem rightContent="⌘K" state="disabled">
            Keyboard shortcuts
          </DropdownMenuItem>
          <Separator />
          <DropdownMenuItem>Team</DropdownMenuItem>
          <DropdownMenuItem
            ref={triggerSubmenuRef}
            onItemClick={() => setOpenDropdownSubmenu(true)}
            state="hasChild"
            onMouseEnter={() => {
              setOpenDropdownSubmenu(true);
            }}
            onMouseLeave={() => {
              setOpenDropdownSubmenu(false);
            }}
          >
            Invite users
          </DropdownMenuItem>
          <DropdownMenuContent
            hasLeftIcon
            triggerRef={triggerSubmenuRef}
            isOpen={openDropdownSubmenu}
            onClose={closeSubmenu}
            onMouseLeave={closeSubmenu}
            onMouseEnter={() => {
              setOpenDropdownSubmenu(true);
            }}
            size="small"
            position={{
              right: true,
              top: true,
            }}
          >
            <DropdownMenuItem
              leftIcon={<ButtonDefaultIcon />}
              {...invalidOnClickProps(toggleDropdownSubmenu)}
            >
              Email
            </DropdownMenuItem>

            <DropdownMenuItem {...invalidOnClickProps(toggleDropdownSubmenu)}>
              Message
            </DropdownMenuItem>
            <Separator />
            <DropdownMenuItem>More...</DropdownMenuItem>
          </DropdownMenuContent>
          <DropdownMenuItem rightContent="⌘+T">New Team</DropdownMenuItem>
          <Separator />
          <DropdownMenuItem>Github</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuItem state="disabled">API</DropdownMenuItem>
          <Separator />
          <DropdownMenuItem rightContent="⇧⌘Q">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </Dropdown>
    </div>
  );
};

DrowdownPreview.displayName = 'DrowdownPreview';

export default DrowdownPreview;
