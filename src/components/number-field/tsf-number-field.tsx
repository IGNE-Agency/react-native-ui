import type { ComponentProps, ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import { NumberField } from "./number-field";

type Props = Omit<
	ComponentProps<typeof NumberField.Root>,
	"errors" | "onValueChange" | "value"
>;

/**
 * The number field bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="quantity">
 *   	{field => (
 *   		<field.NumberField
 *   			copy={fieldCopy}
 *   			label={m.order_quantity()}
 *   			decrementLabel={m.number_decrement()}
 *   			incrementLabel={m.number_increment()}
 *   			locale={getLocale()}
 *   			max={10}
 *   			min={1}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFNumberField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<number>();
	return (
		<NumberField.Root
			{...props}
			{...state}
			onValueChange={next => {
				field.handleChange(next);
				field.handleBlur();
			}}
			value={field.state.value}
		/>
	);
};
