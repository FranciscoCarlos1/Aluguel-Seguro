export type JourneyPunchLike = {
  type: "ENTRY" | "EXIT";
  time: string;
};

export function parseTimeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function formatMinutesAsHours(minutes: number) {
  const safeMinutes = Math.max(minutes, 0);
  const hoursPart = String(Math.floor(safeMinutes / 60)).padStart(2, "0");
  const minutesPart = String(safeMinutes % 60).padStart(2, "0");
  return `${hoursPart}:${minutesPart}`;
}

export function calculateWorkedMinutesForPunches<T extends JourneyPunchLike>(punches: T[]) {
  const sorted = [...punches].sort((left, right) => left.time.localeCompare(right.time));
  let openEntry: number | null = null;
  let workedMinutes = 0;
  let incomplete = false;

  for (const punch of sorted) {
    const minutes = parseTimeToMinutes(punch.time);

    if (punch.type === "ENTRY") {
      if (openEntry !== null) {
        incomplete = true;
      }

      openEntry = minutes;
      continue;
    }

    if (openEntry === null) {
      incomplete = true;
      continue;
    }

    if (minutes > openEntry) {
      workedMinutes += minutes - openEntry;
    }

    openEntry = null;
  }

  if (openEntry !== null) {
    incomplete = true;
  }

  return { workedMinutes, incomplete };
}