export const formatCoinAmount = (value, digit = 9, comma = true) => {
  if (!value) return '0';
  
  const dividedValue = digit > 0 ? value / Math.pow(10, digit) : value;
  
  if (comma) {
    return dividedValue.toLocaleString();
  }
  
  return dividedValue.toString();
};
