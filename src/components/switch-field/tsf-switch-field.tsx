import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	SwitchField,
	type SwitchFieldProps,
} from "./switch-field";

type Props = Omit<
	SwitchFieldProps,
	"checked" | "onCheckedChange" | "errors"
>;

/**
 * The switch bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="notifications">
 *   	{field => (
 *   		<field.SwitchField
 *   			copy={fieldCopy}
 *   			label={m.settings_notifications()}
 *   			offLabel={m.switch_state_off()}
 *   			onLabel={m.switch_state_on()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFSwitchField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<boolean>();
	return (
		<SwitchField.Root
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
