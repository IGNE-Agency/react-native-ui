import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	ToggleGroupField,
	type ToggleGroupFieldProps,
} from "./toggle-group-field";

type Props<TValue extends string> = Omit<
	ToggleGroupFieldProps<TValue>,
	"value" | "onValueChange" | "errors"
>;

/**
 * The toggle group bound to its TanStack Form field, whose value is the list of
 * pressed values.
 *
 * @example
 *   <form.AppField name="connectors">
 *   	{field => (
 *   		<field.ToggleGroupField
 *   			copy={fieldCopy}
 *   			label={m.results_connectors()}
 *   			options={connectors}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFToggleGroupField = <TValue extends string>(
	props: Props<TValue>,
): ReactNode => {
	const { field, ...state } =
		useConnectedField<readonly TValue[]>();
	return (
		<ToggleGroupField
			{...props}
			{...state}
			onValueChange={value => {
				field.handleChange(value);
				field.handleBlur();
			}}
			value={field.state.value}
		/>
	);
};
