export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumberInput = (value: string | number): string => {
  if (value === '' || value === null || value === undefined) return '';
  const stringValue = value.toString().replace(/\D/g, '');
  return stringValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};
