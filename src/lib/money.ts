export function paise(value: unknown): number {
  const s = String(value);
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s))
    throw Error("Enter a valid amount with at most two decimals.");
  const [whole, fraction = ""] = s.split(".");
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}
export function proratedRent(rent: number, joined: string, month: string) {
  const [y, m] = month.split("-").map(Number);
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const day = joined.slice(0, 7) === month ? Number(joined.slice(8, 10)) : 1;
  return Math.round((rent * (days - day + 1)) / days);
}
export function today() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
