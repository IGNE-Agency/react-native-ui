import type { ReactNode } from "react";

import { withOptionIds } from "../../lib/forms/option";
import { suffixed } from "../../lib/test-id/test-id";
import {
	ToggleGroup,
	type ToggleGroupRootProps,
} from "../toggle-group/toggle-group";

/** What a `ToggleGroupField` takes: a `ToggleGroup.Root` without its parts. */
export type ToggleGroupFieldProps<TValue extends string> =
	Omit<
		ToggleGroupRootProps<TValue>,
		"children" | "testID"
	> &
		Readonly<{
			/** `testID` goes on the chips, `${testID}-${option.value}` on each chip and `${testID}-error` on the error. */
			testID?: string;
		}>;

/**
 * A toggle group assembled as a field: label, description, the chips and error.
 *
 * @example
 *   <ToggleGroupField
 *   	label={m.results_connectors()}
 *   	copy={fieldCopy}
 *   	options={connectors}
 *   	value={pressed}
 *   	onValueChange={setPressed}
 *   />
 */
export const ToggleGroupField = <TValue extends string>({
	testID,
	options,
	...props
}: ToggleGroupFieldProps<TValue>): ReactNode => (
	<ToggleGroup.Root
		{...props}
		options={withOptionIds(options, testID)}>
		<ToggleGroup.Label />
		<ToggleGroup.Control testID={testID} />
		<ToggleGroup.Description />
		<ToggleGroup.Error testID={suffixed(testID, "error")} />
	</ToggleGroup.Root>
);
