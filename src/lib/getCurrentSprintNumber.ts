import differenceInBusinessDays from "date-fns/differenceInBusinessDays";

export default function getCurrentSprintNumber(
  startDate: Date | undefined,
  startSprint: number | undefined,
  weekdaysPerSprint: number | undefined
): number | undefined {
  if (!startDate || !weekdaysPerSprint || startSprint === undefined) {
    return undefined;
  }

  const daysSinceStart = differenceInBusinessDays(new Date(), startDate);
  const sprintsSinceStart = Math.floor(daysSinceStart / weekdaysPerSprint);
  return sprintsSinceStart + startSprint;
}
