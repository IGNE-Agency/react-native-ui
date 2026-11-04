import type { ReactNode } from "react";

import { withOptionIds } from "../../lib/forms/option";
import { suffixed } from "../../lib/test-id/test-id";
import {
	CheckboxGroup,
	type CheckboxGroupRootProps,
} from "../checkbox-group/checkbox-group";

/** What a `CheckboxGroupField` takes: a `CheckboxGroup.Root` without its parts. */
export type CheckboxGroupFieldProps<TValue extends string> =
	Omit<
		CheckboxGroupRootProps<TValue>,
		"children" | "testID"
	> &
		Readonly<{
			/** `testID` goes on the rows, `${testID}-${option.value}` on each option and `${testID}-error` on the error. */
			testID?: string;
		}>;

/**
 * A field that picks any number of a list, assembled: label, the rows of
 * checkboxes, description and error.
 *
 * @example
 *   <CheckboxGroupField
 *   	label={m.profile_notifications()}
 *   	copy={fieldCopy}
 *   	options={channels}
 *   	value={chosen}
 *   	onValueChange={setChosen}
 *   />
 */
export const CheckboxGroupField = <TValue extends string>({
	testID,
	options,
	...props
}: CheckboxGroupFieldProps<TValue>): ReactNode => (
	<CheckboxGroup.Root
		{...props}
		options={withOptionIds(options, testID)}>
		<CheckboxGroup.Label />
		<CheckboxGroup.Control testID={testID} />
		<CheckboxGroup.Description />
		<CheckboxGroup.Error
			testID={suffixed(testID, "error")}
		/>
	</CheckboxGroup.Root>
);
