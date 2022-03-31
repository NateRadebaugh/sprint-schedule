import differenceInBusinessDays from "date-fns/differenceInBusinessDays";

export default function getActiveDayNumber(
  startDate: Date | undefined,
  weekdaysPerSprint: number | undefined
): number | undefined {
  if (!startDate || !weekdaysPerSprint) {
    return undefined;
  }

  const daysSinceStart = differenceInBusinessDays(new Date(), startDate);
  const mod = daysSinceStart % weekdaysPerSprint;
  return mod + 1;
}
