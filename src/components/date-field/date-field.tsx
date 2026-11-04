import { useState, type ReactNode } from "react";
import { Temporal } from "temporal-polyfill";

import { today } from "../../lib/dates/month";
import { useTimeZone } from "../../lib/dates/time-zone";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { suffixed } from "../../lib/test-id/test-id";
import type { CalendarMarker } from "../calendar/calendar";
import { DateInput } from "../date-input/date-input";
import { Field, type FieldCopy } from "../field/field";
import type { CalendarCopy } from "../month-calendar/month-calendar";

/**
 * What a `DateField` takes: the field's own state, the day it holds as
 * `YYYY-MM-DD`, the range and the days that cannot be chosen, the markers some
 * days carry, and the resting copy the pill shows while the value is empty.
 * `locale` is the app's locale tag, which the date is written out in.
 */
export type DateFieldProps = FieldState &
	Readonly<{
		label: string;
		copy: FieldCopy;
		calendarCopy: CalendarCopy;
		locale: string;
		description?: string;
		errors?: unknown;
		handle?: FieldHandle;
		value: string | undefined;
		onValueChange: (day: string) => void;
		min?: string;
		max?: string;
		isDisabled?: (day: string) => boolean;
		disabledLabel?: string;
		markers?: readonly CalendarMarker[];
		placeholder: string;
		/** `testID` goes on the pill, `${testID}-calendar` on its calendar, which names its own parts from it as `MonthCalendar` does (`${testID}-calendar-${day}` for each day, `${testID}-calendar-previous` and `${testID}-calendar-next` for the month steps), and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A field that holds one date, assembled: label, the pill with its inline
 * calendar, description and error.
 *
 * @example
 *   <DateField
 *   	calendarCopy={calendarCopy}
 *   	copy={fieldCopy}
 *   	label={m.visit_date()}
 *   	locale={getLocale()}
 *   	placeholder={m.date_placeholder()}
 *   	onValueChange={setDate}
 *   	value={date}
 *   />
 */
export const DateField = ({
	value,
	onValueChange,
	min,
	max,
	isDisabled,
	disabledLabel,
	markers,
	placeholder,
	calendarCopy,
	locale,
	testID,
	...field
}: DateFieldProps): ReactNode => {
	const zone = useTimeZone();
	const [month, setMonth] = useState(() =>
		(value === undefined
			? today(zone)
			: Temporal.PlainDate.from(value)
		)
			.toPlainYearMonth()
			.toString(),
	);
	return (
		<Field.Root
			{...field}
			filled={field.filled ?? value !== undefined}>
			<Field.Label />
			<DateInput.Root
				copy={calendarCopy}
				disabledLabel={disabledLabel}
				isDisabled={isDisabled}
				locale={locale}
				markers={markers}
				max={max}
				min={min}
				month={month}
				onChange={onValueChange}
				onMonthChange={setMonth}
				value={value}>
				<DateInput.Trigger
					placeholder={placeholder}
					testID={testID}
				/>
				<DateInput.Calendar
					testID={suffixed(testID, "calendar")}
				/>
			</DateInput.Root>
			<Field.Description />
			<Field.Error testID={suffixed(testID, "error")} />
		</Field.Root>
	);
};
