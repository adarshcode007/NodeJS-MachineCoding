export const toPaise = (amount) => {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid amount");
  }

  return Math.round(value * 100);
};

export const fromPaise = (paise) => {
  return (paise / 100).toFixed(2);
};

export const splitEqually = (amount, count) => {
  const totalPaise = toPaise(amount);

  const base = Math.floor(totalPaise / count);
  const remainder = totalPaise % count;

  return Array.from({ length: count }, (_, index) => ({
    amount: base + (index < remainder ? 1 : 0),
  }));
};
