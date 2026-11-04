import type { ComponentProps, ReactNode } from "react";

import { useKeyboardSequence } from "../../lib/forms/keyboard-sequence";
import {
	useConnectedField,
	type ConnectedProps,
} from "../../lib/forms/use-connected-field";
import { TextField } from "./text-field";

type Props = ConnectedProps<
	ComponentProps<typeof TextField.Root>
>;

/**
 * The text field bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="firstName">
 *   	{field => (
 *   		<field.TextField
 *   			copy={fieldCopy}
 *   			label={m.register_first_name()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFTextField = ({
	next,
	onSubmit,
	...props
}: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	const submitKey = useKeyboardSequence({ next, onSubmit });
	return (
		<TextField.Root
			{...submitKey}
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
			value={field.state.value}
		/>
	);
};
