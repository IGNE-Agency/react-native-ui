import type { ComponentProps, ReactNode } from "react";

import { TextField } from "../text-field/text-field";
import { TextInput } from "../text-input/text-input";

type RootProps = Omit<
	ComponentProps<typeof TextField.Root>,
	"children" | "keyboardType" | "testID"
> &
	Readonly<{
		/** What the number is counted in, drawn after the value. */
		unit?: string;
		/** `testID` goes on the input, `${testID}-clear` on the clear button and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = ({ unit, ...props }: RootProps): ReactNode => (
	<TextField.Root {...props} keyboardType="decimal-pad">
		{unit === undefined ? null : (
			<TextInput.Affix>{unit}</TextInput.Affix>
		)}
	</TextField.Root>
);

type DecimalFieldNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * A decimal amount as a field: the text input with the platform's decimal keypad
 * and the unit drawn after the value. The unit is decoration, so it belongs in
 * the label or the description too.
 *
 * @example
 *   <DecimalField.Root
 *   	copy={fieldCopy}
 *   	label={m.order_weight()}
 *   	unit={m.order_weight_unit()}
 *   	value={weight}
 *   	onChangeText={setWeight}
 *   />
 */
export const DecimalField: DecimalFieldNamespace = { Root };
