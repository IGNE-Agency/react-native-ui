import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	TimeField,
	type TimeFieldProps,
} from "./time-field";

type Props = Omit<
	TimeFieldProps,
	"errors" | "onValueChange" | "value"
>;

/**
 * The time field bound to its TanStack Form field, whose stored value is a
 * `Date`.
 *
 * @example
 *   <form.AppField name="startsAt">
 *   	{field => (
 *   		<field.TimeField
 *   			copy={fieldCopy}
 *   			label={m.booking_starts_at()}
 *   			placeholder={m.time_mask_minutes()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFTimeField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<
		Date | undefined
	>();
	return (
		<TimeField
			{...props}
			{...state}
			onValueChange={field.handleChange}
			value={field.state.value}
		/>
	);
};
