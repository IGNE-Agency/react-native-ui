import type { ComponentProps, ReactNode } from "react";

import { useKeyboardSequence } from "../../lib/forms/keyboard-sequence";
import {
	useConnectedField,
	type ConnectedProps,
} from "../../lib/forms/use-connected-field";
import { DecimalField } from "./decimal-field";

type Props = ConnectedProps<
	ComponentProps<typeof DecimalField.Root>
>;

/**
 * The decimal field bound to its TanStack Form field, whose value is the text
 * as typed so a half-written number is never read as a different one.
 *
 * @example
 *   <form.AppField name="weightKg">
 *   	{field => (
 *   		<field.DecimalField
 *   			copy={fieldCopy}
 *   			label={m.order_weight()}
 *   			unit={m.order_weight_unit()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFDecimalField = ({
	next,
	onSubmit,
	...props
}: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	const submitKey = useKeyboardSequence({ next, onSubmit });
	return (
		<DecimalField.Root
			{...submitKey}
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
			value={field.state.value}
		/>
	);
};
