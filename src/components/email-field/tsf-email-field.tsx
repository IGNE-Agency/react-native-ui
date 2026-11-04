import type { ComponentProps, ReactNode } from "react";

import { useKeyboardSequence } from "../../lib/forms/keyboard-sequence";
import {
	useConnectedField,
	type ConnectedProps,
} from "../../lib/forms/use-connected-field";
import { EmailField } from "./email-field";

type Props = ConnectedProps<
	ComponentProps<typeof EmailField.Root>
>;

/**
 * The email preset bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="email">
 *   	{field => (
 *   		<field.EmailField
 *   			copy={fieldCopy}
 *   			label={m.login_email()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFEmailField = ({
	next,
	onSubmit,
	...props
}: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	const submitKey = useKeyboardSequence({ next, onSubmit });
	return (
		<EmailField.Root
			{...submitKey}
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
			value={field.state.value}
		/>
	);
};
