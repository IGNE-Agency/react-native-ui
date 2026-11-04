import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import {
	Calendar,
	type CalendarProps,
} from "../calendar/calendar";

/**
 * The words a month calendar draws and announces of its own: the two month
 * steps, and what it says when the month's days fail to load or are slow to.
 *
 * @example
 *   const calendarCopy: CalendarCopy = {
 *   	previousMonthLabel: m.calendar_previous(),
 *   	nextMonthLabel: m.calendar_next(),
 *   	errorMessage: m.calendar_error(),
 *   	slowMessage: m.calendar_updating_slow(),
 *   	retryLabel: m.common_retry(),
 *   };
 */
export type CalendarCopy = Readonly<{
	/** What the step back a month is announced as. */
	previousMonthLabel: string;
	/** What the step on a month is announced as. */
	nextMonthLabel: string;
	/** What the calendar says when the month's days failed to load. */
	errorMessage: string;
	/** What the calendar says over days that are slow to update. */
	slowMessage: string;
	/** What the button that asks again says. */
	retryLabel: string;
}>;

/** What a `MonthCalendar` takes: a calendar's props and its copy. */
export type MonthCalendarProps = CalendarProps &
	Readonly<{
		copy: CalendarCopy;
		/** `testID` goes on the calendar, `${testID}-title` on the month's name, `${testID}-previous` and `${testID}-next` on the month steps, `${testID}-${day}` on each day as `YYYY-MM-DD`, `${testID}-status` on the frame of the days, `${testID}-status-message` on what a slow or failed load says and `${testID}-status-retry` on its retry button. */
		testID?: string;
	}>;

/**
 * A month of days to choose one from, assembled: the month's name with a step
 * to either side, the weekdays, the days with their loading, updating and
 * failed states, and the legend of whatever days are marked or disabled.
 *
 * @example
 *   <MonthCalendar
 *   	copy={calendarCopy}
 *   	locale={getLocale()}
 *   	month={month}
 *   	onChange={setDay}
 *   	onMonthChange={setMonth}
 *   	value={day}
 *   />
 */
export const MonthCalendar = ({
	copy,
	testID,
	...calendar
}: MonthCalendarProps): ReactNode => (
	<Calendar.Root {...calendar} testID={testID}>
		<Calendar.Header>
			<Calendar.Title testID={suffixed(testID, "title")} />
			<Calendar.Previous
				label={copy.previousMonthLabel}
				testID={suffixed(testID, "previous")}
			/>
			<Calendar.Next
				label={copy.nextMonthLabel}
				testID={suffixed(testID, "next")}
			/>
		</Calendar.Header>
		<Calendar.Weekdays />
		<Calendar.Page>
			<Calendar.Status
				errorMessage={copy.errorMessage}
				retryLabel={copy.retryLabel}
				slowMessage={copy.slowMessage}
				testID={suffixed(testID, "status")}>
				<Calendar.Grid
					dayTestID={
						testID === undefined
							? undefined
							: day => `${testID}-${day}`
					}
				/>
			</Calendar.Status>
		</Calendar.Page>
		<Calendar.Legend />
	</Calendar.Root>
);
