import React, { useState } from 'react';
import { User } from 'lucide-react';

type Props = {
  photoUrl?: string | null;
  alt: string;
  className?: string;
  iconSize?: number;
};

/**
 * Shows profile photo or the default user icon if missing or failed to load.
 */
const UserAvatarDisplay = ({
  photoUrl,
  alt,
  className = 'w-8 h-8',
  iconSize = 18,
}: Props) => {
  const [failed, setFailed] = useState(false);
  if (photoUrl && !failed) {
    return (
      <img
        src={photoUrl}
        alt={alt}
        className={`${className} rounded-full object-cover shrink-0 border border-gray-100 bg-gray-50`}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      className={`${className} rounded-full bg-brand-primary-soft flex items-center justify-center shrink-0`}
      aria-hidden
    >
      <User size={iconSize} className="text-brand-primary stroke-[2]" />
    </span>
  );
};

export default UserAvatarDisplay;
