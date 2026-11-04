import { Temporal } from "temporal-polyfill";

const DAYS_PER_WEEK = 7;

/**
 * The ISO weekday a locale's weeks open on, 1 for Monday to 7 for Sunday.
 *
 * @example
 *   weekStart("en-US"); // 7
 */
export const weekStart = (locale: string): number =>
	new Intl.Locale(locale).getWeekInfo().firstDay;

/**
 * The weeks a month is drawn in, each opening on `start` and running into the
 * months either side where the first and last week are shared.
 *
 * @example
 *   monthGrid(Temporal.PlainYearMonth.from("2026-10"), 1)[0][0].toString(); // "2026-09-28"
 */
export const monthGrid = (
	month: Temporal.PlainYearMonth,
	start: number,
): readonly (readonly Temporal.PlainDate[])[] => {
	const first = month.toPlainDate({ day: 1 });
	const lead =
		(first.dayOfWeek - start + DAYS_PER_WEEK) %
		DAYS_PER_WEEK;
	const opens = first.subtract({ days: lead });
	const weeks = Math.ceil(
		(lead + month.daysInMonth) / DAYS_PER_WEEK,
	);
	return Array.from({ length: weeks }, (_week, week) =>
		Array.from({ length: DAYS_PER_WEEK }, (_day, day) =>
			opens.add({ days: week * DAYS_PER_WEEK + day }),
		),
	);
};

/**
 * Today's date in `zone`, an IANA time zone.
 *
 * @example
 *   today("Europe/Amsterdam").toString(); // "2026-09-24"
 */
export const today = (zone: string): Temporal.PlainDate =>
	Temporal.Now.plainDateISO(zone);

/**
 * This month in `zone`, an IANA time zone, as `YYYY-MM`.
 *
 * @example
 *   currentMonth("Europe/Amsterdam"); // "2026-09"
 */
export const currentMonth = (zone: string): string =>
	today(zone).toPlainYearMonth().toString();

const formatters = new Map<string, Intl.DateTimeFormat>();

const formatterOf = (
	options: Intl.DateTimeFormatOptions,
	locale: string,
): Intl.DateTimeFormat => {
	const key = `${locale} ${JSON.stringify(options)}`;
	const known = formatters.get(key);
	if (known !== undefined) {
		return known;
	}
	const formatter = new Intl.DateTimeFormat(
		locale,
		options,
	);
	formatters.set(key, formatter);
	return formatter;
};

/**
 * A calendar date written out in `locale`, the app's own locale tag.
 *
 * @example
 *   formatDay(Temporal.PlainDate.from("2026-10-25"), { month: "long" }, "nl-NL"); // "oktober"
 */
export const formatDay = (
	day: Temporal.PlainDate,
	options: Intl.DateTimeFormatOptions,
	locale: string,
): string =>
	formatterOf(options, locale).format(
		new Date(day.year, day.month - 1, day.day, 12),
	);
