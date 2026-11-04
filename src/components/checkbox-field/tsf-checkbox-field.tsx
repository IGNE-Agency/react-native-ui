import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	CheckboxField,
	type CheckboxFieldProps,
} from "./checkbox-field";

type Props = Omit<
	CheckboxFieldProps,
	"checked" | "onCheckedChange" | "errors"
>;

/**
 * The checkbox bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="terms">
 *   	{field => (
 *   		<field.CheckboxField
 *   			copy={fieldCopy}
 *   			label={m.register_terms()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFCheckboxField = (
	props: Props,
): ReactNode => {
	const { field, ...state } = useConnectedField<boolean>();
	return (
		<CheckboxField.Root
			{...props}
			{...state}
			checked={field.state.value}
			onCheckedChange={checked => {
				field.handleChange(checked);
				field.handleBlur();
			}}
		/>
	);
};
