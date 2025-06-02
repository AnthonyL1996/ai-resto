export const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000 / 60);
  if (diff < 1) return 'Just now';
  return `${diff}m ago`;
};

export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};

export const formatRequestedTime = (date?: Date): string => {
  if (!date) return 'N/A';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
};