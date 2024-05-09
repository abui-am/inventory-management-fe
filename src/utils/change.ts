export const calculateChange = (totalPayment: number, totalPrice: number, discount: number, shippingCost: number) => {
  return totalPayment - (totalPrice - discount) - shippingCost;
};
