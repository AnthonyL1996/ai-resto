import { useState, useCallback } from 'react';
import type { ISoundService, INotificationService } from '../types/service.types';
// Assume dummy services for now if not implementing actual sound/notifications immediately
// import { soundService } from '../services/SoundService';
// import { notificationService } from '../services/NotificationService';
import { ALERT_DURATION } from '../config/constants';


export function useSoundNotification(/* Pass actual services here */) {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev);
    // soundService.toggleSound(!soundEnabled);
  }, [/* soundService */]);

  const playNewOrderSound = useCallback(() => {
    if (soundEnabled) {
      // soundService.playSound('newOrder');
      console.log("Playing new order sound (if enabled)");
    }
  }, [soundEnabled /*, soundService */]);

  const showNotification = useCallback((message: string) => {
    setActiveAlert(message);
    // notificationService.showSuccess(message);
    setTimeout(() => setActiveAlert(null), ALERT_DURATION);
  }, [/* notificationService */]);

  return {
    soundEnabled,
    toggleSound,
    playNewOrderSound,
    activeAlert,
    showNotification,
    clearAlert: () => setActiveAlert(null),
  };
}