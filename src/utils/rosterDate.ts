export interface RosterWeekDay {
  date: string;
  dayNum: number;
  dayName: string;
  isWeekend: boolean;
}

export interface RosterWeek {
  label: string;
  days: RosterWeekDay[];
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const MONTH_NUMBERS: Record<string, number> = {
  jan: 1,
  januari: 1,
  january: 1,
  feb: 2,
  februari: 2,
  february: 2,
  mar: 3,
  maret: 3,
  march: 3,
  apr: 4,
  april: 4,
  mei: 5,
  may: 5,
  jun: 6,
  juni: 6,
  june: 6,
  jul: 7,
  juli: 7,
  july: 7,
  agu: 8,
  agustus: 8,
  aug: 8,
  august: 8,
  sep: 9,
  september: 9,
  okt: 10,
  oktober: 10,
  oct: 10,
  october: 10,
  nov: 11,
  november: 11,
  des: 12,
  desember: 12,
  dec: 12,
  december: 12,
};

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseIso(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function monthShort(date: Date): string {
  return MONTHS_SHORT[date.getMonth()] ?? '';
}

export function toIsoDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = parseIso(trimmed);
  if (iso) {
    return toIso(iso.getFullYear(), iso.getMonth() + 1, iso.getDate());
  }

  const dayMonthYear = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (dayMonthYear) {
    const day = Number(dayMonthYear[1]);
    const month = MONTH_NUMBERS[dayMonthYear[2].toLowerCase()];
    const year = Number(dayMonthYear[3]);
    if (!month) return null;
    return toIso(year, month, day);
  }

  const monthYear = /^([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (monthYear) {
    const month = MONTH_NUMBERS[monthYear[1].toLowerCase()];
    if (!month) return null;
    return toIso(Number(monthYear[2]), month, 1);
  }

  return null;
}

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatRosterDate(iso: string): string {
  const date = parseIso(iso);
  if (!date) return iso;
  return `${date.getDate()} ${monthShort(date)} ${date.getFullYear()}`;
}

export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseIso(startIso);
  const end = parseIso(endIso);
  if (!start || !end) return '';

  const startDay = start.getDate();
  const endDay = end.getDate();
  const startMonth = start.getMonth();
  const endMonth = end.getMonth();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startIso === endIso) {
    return formatRosterDate(startIso);
  }
  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay} - ${endDay} ${monthShort(end)} ${endYear}`;
  }
  if (startYear === endYear) {
    return `${startDay} ${monthShort(start)} - ${endDay} ${monthShort(end)} ${endYear}`;
  }
  return `${startDay} ${monthShort(start)} ${startYear} - ${endDay} ${monthShort(end)} ${endYear}`;
}

export function normalizeTeamPeriod(
  startDate: string,
  endDate?: string
): { startDate: string; endDate: string } {
  const monthOnly = /^([A-Za-z]+)\s+(\d{4})$/.test(startDate.trim());
  const start = toIsoDate(startDate) ?? todayIso();
  let end = endDate ? toIsoDate(endDate) : null;

  if (!end) {
    if (monthOnly) {
      const date = parseIso(start);
      if (date) {
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        end = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(lastDay)}`;
      }
    }
    end = end ?? addDays(start, 29);
  }

  if (end < start) {
    end = start;
  }

  return { startDate: start, endDate: end };
}

export function buildRosterWeeks(startIso: string, endIso: string): RosterWeek[] {
  const start = parseIso(startIso);
  const end = parseIso(endIso);
  if (!start || !end || endIso < startIso) return [];

  const weeks: RosterWeek[] = [];
  let cursor = startIso;

  while (cursor <= endIso) {
    const days: RosterWeekDay[] = [];
    for (let i = 0; i < 7 && cursor <= endIso; i += 1) {
      const date = parseIso(cursor);
      if (!date) break;
      const day = date.getDay();
      days.push({
        date: cursor,
        dayNum: date.getDate(),
        dayName: DAY_NAMES[day] ?? '',
        isWeekend: day === 0 || day === 6,
      });
      cursor = addDays(cursor, 1);
    }
    if (days.length === 0) break;
    weeks.push({
      label: formatDateRange(days[0].date, days[days.length - 1].date),
      days,
    });
  }

  return weeks;
}
