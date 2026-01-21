export const comma = (value, digit = 0) => {
    if (!value) return '-';
    if (isNaN(value)) return '-';

    return value.toFixed(digit).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  };
  