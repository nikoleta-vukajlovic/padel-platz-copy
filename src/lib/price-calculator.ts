
import { Court, PricingPeriod } from "@/types/booking";

export function calculateBookingPrice(
  court: Court,
  startTime: string,
  duration: number
): number {
  let totalPrice = 0;
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const startTimeInMinutes = startHour * 60 + startMinute;
  const durationInMinutes = duration * 60;
  const endTimeInMinutes = startTimeInMinutes + durationInMinutes;

  // Convert pricing period times to minutes for easier comparison
  const pricingPeriods =
      court.pricingPeriods.map(period => ({
    ...period,
    startTimeInMinutes: convertTimeToMinutes(period.startTime),
    endTimeInMinutes: convertTimeToMinutes(period.endTime)
  }));

  // Calculate price for each 30-minute slot
  for (let currentTime = startTimeInMinutes; currentTime < endTimeInMinutes; currentTime += 30) {
    const applicablePeriod = findApplicablePricingPeriod(pricingPeriods, currentTime);
    if (applicablePeriod) {
      totalPrice += applicablePeriod.pricePerHalfHour;
    }
  }

  return totalPrice;
}

function convertTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function findApplicablePricingPeriod(
  periods: (PricingPeriod & { startTimeInMinutes: number; endTimeInMinutes: number })[],
  timeInMinutes: number
): PricingPeriod | null {
  return periods.find(period =>
    timeInMinutes >= period.startTimeInMinutes && timeInMinutes < period.endTimeInMinutes
  ) || null;
}
