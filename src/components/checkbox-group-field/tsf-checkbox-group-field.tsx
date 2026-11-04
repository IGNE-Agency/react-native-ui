import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	CheckboxGroupField,
	type CheckboxGroupFieldProps,
} from "./checkbox-group-field";

type Props<TValue extends string> = Omit<
	CheckboxGroupFieldProps<TValue>,
	"value" | "onValueChange" | "errors"
>;

/**
 * The checkbox group bound to its TanStack Form field, whose value is the list
 * of checked values.
 *
 * @example
 *   <form.AppField name="notifications">
 *   	{field => (
 *   		<field.CheckboxGroupField
 *   			copy={fieldCopy}
 *   			label={m.profile_notifications()}
 *   			options={channels}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFCheckboxGroupField = <
	TValue extends string,
>(
	props: Props<TValue>,
): ReactNode => {
	const { field, ...state } =
		useConnectedField<readonly TValue[]>();
	return (
		<CheckboxGroupField
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
