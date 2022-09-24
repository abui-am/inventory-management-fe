export const calculateChange = (totalPayment: number, totalPrice: number, discount: number) => {
  return totalPayment - (totalPrice - discount);
};
