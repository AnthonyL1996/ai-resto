export const formatTime = (timestamp: Date | string): string => {
  const now = new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
  if (diff < 1) return 'Just now';
  return `${diff}m ago`;
};

export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

export const formatRequestedTime = (date?: Date): string => {
  if (!date) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};