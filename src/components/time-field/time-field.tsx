import type { ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import {
	TimeInput,
	type TimeInputRootProps,
} from "../time-input/time-input";

/** What a `TimeField` takes: a `TimeInput.Root` without its parts. */
export type TimeFieldProps = Omit<
	TimeInputRootProps,
	"children" | "testID"
> &
	Readonly<{
		/** `testID` goes on the input and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A field that holds one time of day, assembled: label, the typed `hh:mm` or
 * `hh:mm:ss` control, description and error. Its value is a `Date`, whose
 * time of day is read in the zone of the nearest `TimeZoneProvider`.
 *
 * @example
 *   <TimeField
 *   	copy={fieldCopy}
 *   	label={m.booking_starts_at()}
 *   	onValueChange={setStartsAt}
 *   	placeholder={m.time_mask_minutes()}
 *   	value={startsAt}
 *   />
 */
export const TimeField = ({
	testID,
	...props
}: TimeFieldProps): ReactNode => (
	<TimeInput.Root {...props}>
		<TimeInput.Label />
		<TimeInput.Input testID={testID} />
		<TimeInput.Description />
		<TimeInput.Error testID={suffixed(testID, "error")} />
	</TimeInput.Root>
);
