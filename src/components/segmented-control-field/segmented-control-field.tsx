import type { ReactNode } from "react";

import { withOptionIds } from "../../lib/forms/option";
import { suffixed } from "../../lib/test-id/test-id";
import {
	SegmentedControl,
	type SegmentedControlRootProps,
} from "../segmented-control/segmented-control";

/** What a `SegmentedControlField` takes: a `SegmentedControl.Root` without its parts. */
export type SegmentedControlFieldProps<
	TValue extends string,
> = Omit<
	SegmentedControlRootProps<TValue>,
	"children" | "testID"
> &
	Readonly<{
		/** `testID` goes on the rail, `${testID}-${option.value}` on each segment and `${testID}-error` on the error. */
		testID?: string;
	}>;

/**
 * A segmented control assembled as a field: label, description, the rail of
 * segments and error.
 *
 * @example
 *   <SegmentedControlField
 *   	label={m.results_sort()}
 *   	copy={fieldCopy}
 *   	options={sortOrders}
 *   	value={sort}
 *   	onValueChange={setSort}
 *   />
 */
export const SegmentedControlField = <
	TValue extends string,
>({
	testID,
	options,
	...props
}: SegmentedControlFieldProps<TValue>): ReactNode => (
	<SegmentedControl.Root
		{...props}
		options={withOptionIds(options, testID)}>
		<SegmentedControl.Label />
		<SegmentedControl.Control testID={testID} />
		<SegmentedControl.Description />
		<SegmentedControl.Error
			testID={suffixed(testID, "error")}
		/>
	</SegmentedControl.Root>
);
