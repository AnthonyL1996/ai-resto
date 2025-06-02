export const formatTime = (timestamp: Date): string => {
  const now = new Date();
  const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000 / 60);
  if (diff < 1) return 'Just now';
  return `${diff}m ago`;
};

export const formatCurrency = (amount: number): string => {
  return `€${amount.toFixed(2)}`;
};