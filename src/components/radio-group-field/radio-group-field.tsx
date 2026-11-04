import type { ReactNode } from "react";

import { withOptionIds } from "../../lib/forms/option";
import { suffixed } from "../../lib/test-id/test-id";
import {
	RadioGroup,
	type RadioGroupRootProps,
} from "../radio-group/radio-group";

/** What a `RadioGroupField` takes: a `RadioGroup.Root` without its parts. */
export type RadioGroupFieldProps<TValue extends string> =
	Omit<RadioGroupRootProps<TValue>, "children" | "testID"> &
		Readonly<{
			/** `testID` goes on the rows, `${testID}-${option.value}` on each option and `${testID}-error` on the error. */
			testID?: string;
		}>;

/**
 * A field that picks exactly one of a list, assembled: label, the rows of
 * choices, description and error.
 *
 * @example
 *   <RadioGroupField
 *   	label={m.settings_theme()}
 *   	copy={fieldCopy}
 *   	options={appearances}
 *   	value={appearance}
 *   	onValueChange={setAppearance}
 *   />
 */
export const RadioGroupField = <TValue extends string>({
	testID,
	options,
	...props
}: RadioGroupFieldProps<TValue>): ReactNode => (
	<RadioGroup.Root
		{...props}
		options={withOptionIds(options, testID)}>
		<RadioGroup.Label />
		<RadioGroup.Control testID={testID} />
		<RadioGroup.Description />
		<RadioGroup.Error testID={suffixed(testID, "error")} />
	</RadioGroup.Root>
);
