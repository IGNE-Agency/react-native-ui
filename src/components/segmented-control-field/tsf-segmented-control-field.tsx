import type { ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import {
	SegmentedControlField,
	type SegmentedControlFieldProps,
} from "./segmented-control-field";

type Props<TValue extends string> = Omit<
	SegmentedControlFieldProps<TValue>,
	"errors" | "onValueChange" | "value"
>;

/**
 * The segmented control bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="pets">
 *   	{field => (
 *   		<field.SegmentedControlField
 *   			copy={fieldCopy}
 *   			label={m.booking_pets()}
 *   			options={yesNo}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFSegmentedControlField = <
	TValue extends string,
>(
	props: Props<TValue>,
): ReactNode => {
	const { field, ...state } = useConnectedField<
		TValue | undefined
	>();
	return (
		<SegmentedControlField
			{...props}
			{...state}
			onValueChange={field.handleChange}
			value={field.state.value}
		/>
	);
};
