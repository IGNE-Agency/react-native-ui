import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	RadioGroupField,
	type RadioGroupFieldProps,
} from "./radio-group-field";

type Props<TValue extends string> = Omit<
	RadioGroupFieldProps<TValue>,
	"errors" | "onValueChange" | "value"
>;

/**
 * The radio group bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="appearance">
 *   	{field => (
 *   		<field.RadioGroupField
 *   			copy={fieldCopy}
 *   			label={m.settings_theme()}
 *   			options={appearances}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFRadioGroupField = <TValue extends string>(
	props: Props<TValue>,
): ReactNode => {
	const { field, ...state } = useConnectedField<
		TValue | undefined
	>();
	return (
		<RadioGroupField
			{...props}
			{...state}
			onValueChange={field.handleChange}
			value={field.state.value}
		/>
	);
};
