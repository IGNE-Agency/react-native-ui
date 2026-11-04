import type { ComponentProps, ReactNode } from "react";
import { Platform } from "react-native";

import { suffixed } from "../../lib/test-id/test-id";
import { NumberInput } from "../number-input/number-input";

type RootProps = Omit<
	ComponentProps<typeof NumberInput.Root>,
	"children" | "testID"
> &
	Readonly<{
		/** `testID` goes on the adjustable box, `${testID}-stepper` on the iOS stepper, `${testID}-decrement`, `${testID}-value` and `${testID}-increment` on Android's buttons and value, and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = ({
	testID,
	...props
}: RootProps): ReactNode => (
	<NumberInput.Root {...props}>
		<NumberInput.Label />
		<NumberInput.Group testID={testID}>
			{Platform.OS === "ios" ? (
				<NumberInput.Stepper
					testID={suffixed(testID, "stepper")}
				/>
			) : (
				<>
					<NumberInput.Decrement
						testID={suffixed(testID, "decrement")}
					/>
					<NumberInput.Value
						testID={suffixed(testID, "value")}
					/>
					<NumberInput.Increment
						testID={suffixed(testID, "increment")}
					/>
				</>
			)}
			<NumberInput.Pending />
		</NumberInput.Group>
		<NumberInput.Description />
		<NumberInput.Error testID={suffixed(testID, "error")} />
	</NumberInput.Root>
);

type NumberFieldNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A numeric stepper field: the label, description and error scaffold around one
 * adjustable box holding the platform's own way of stepping.
 *
 * @example
 *   <NumberField.Root
 *   	copy={fieldCopy}
 *   	decrementLabel={m.number_decrement()}
 *   	incrementLabel={m.number_increment()}
 *   	label={m.order_quantity()}
 *   	locale={getLocale()}
 *   	max={10}
 *   	min={1}
 *   	onValueChange={setQuantity}
 *   	value={quantity}
 *   />
 */
export const NumberField: NumberFieldNamespace = { Root };
