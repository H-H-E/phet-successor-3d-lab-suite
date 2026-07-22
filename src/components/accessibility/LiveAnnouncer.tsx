import React from 'react';
import { useSimStore } from '../../store/useSimStore';

export const LiveAnnouncer: React.FC = () => {
  const { ariaAnnouncement } = useSimStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only fixed bottom-0 left-0 w-1 h-1 overflow-hidden opacity-0 pointer-events-none"
    >
      {ariaAnnouncement}
    </div>
  );
};
