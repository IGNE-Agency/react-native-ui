import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	DateField,
	type DateFieldProps,
} from "./date-field";

type Props = Omit<
	DateFieldProps,
	"errors" | "onValueChange" | "value"
>;

/**
 * The date field bound to its TanStack Form field, whose stored value is a
 * `YYYY-MM-DD` day.
 *
 * @example
 *   <form.AppField name="date">
 *   	{field => (
 *   		<field.DateField
 *   			calendarCopy={calendarCopy}
 *   			copy={fieldCopy}
 *   			label={m.visit_date()}
 *   			locale={getLocale()}
 *   			placeholder={m.date_placeholder()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFDateField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<
		string | undefined
	>();
	return (
		<DateField
			{...props}
			{...state}
			onValueChange={field.handleChange}
			value={field.state.value}
		/>
	);
};
