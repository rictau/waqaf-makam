export const formatJPY = (amount: number) => {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', minimumFractionDigits: 0 }).format(amount);
};

export const formatIDR = (amountJPY: number, jpyToIdrRate: number = 113) => {
  const idr = amountJPY * jpyToIdrRate;
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(idr);
};
