import type { ComponentProps, ReactNode } from "react";

import { useKeyboardSequence } from "../../lib/forms/keyboard-sequence";
import {
	useConnectedField,
	type ConnectedProps,
} from "../../lib/forms/use-connected-field";
import { TextareaField } from "./textarea-field";

type Props = ConnectedProps<
	ComponentProps<typeof TextareaField.Root>
>;

/**
 * The textarea field bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="message">
 *   	{field => (
 *   		<field.TextareaField
 *   			copy={fieldCopy}
 *   			label={m.feedback_message()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFTextareaField = ({
	next,
	onSubmit,
	...props
}: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	const submitKey = useKeyboardSequence({ next, onSubmit });
	return (
		<TextareaField.Root
			{...submitKey}
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
			value={field.state.value}
		/>
	);
};
