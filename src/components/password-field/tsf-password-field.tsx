import type { ComponentProps, ReactNode } from "react";

import { useKeyboardSequence } from "../../lib/forms/keyboard-sequence";
import {
	useConnectedField,
	type ConnectedProps,
} from "../../lib/forms/use-connected-field";
import { PasswordField } from "./password-field";

type Props = ConnectedProps<
	ComponentProps<typeof PasswordField.Root>
>;

/**
 * The password field bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="password">
 *   	{field => (
 *   		<field.PasswordField
 *   			copy={fieldCopy}
 *   			label={m.login_password()}
 *   			hidePasswordLabel={m.common_hide_password()}
 *   			showPasswordLabel={m.common_show_password()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFPasswordField = ({
	next,
	onSubmit,
	...props
}: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	const submitKey = useKeyboardSequence({ next, onSubmit });
	return (
		<PasswordField.Root
			{...submitKey}
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
			value={field.state.value}
		/>
	);
};
