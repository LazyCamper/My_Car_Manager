/**
 * 원화 금액 포맷터 (예: 65000 -> '₩65,000')
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round(Number.isFinite(amount) ? amount : 0);
  return `₩${rounded.toLocaleString('ko-KR')}`;
}

/**
 * 주행거리 포맷터 (예: 45200 -> '45,200km')
 */
export function formatMileage(mileage: number): string {
  const rounded = Math.round(Number.isFinite(mileage) ? mileage : 0);
  return `${rounded.toLocaleString('ko-KR')}km`;
}
