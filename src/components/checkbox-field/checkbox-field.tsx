import type { ReactNode } from "react";

import type { Requiredness } from "../../lib/forms/field-state";
import { suffixed } from "../../lib/test-id/test-id";
import { Checkbox } from "../checkbox/checkbox";
import { Field, type FieldCopy } from "../field/field";

/** The props a single opt-in takes as a whole field. */
export type CheckboxFieldProps = Readonly<{
	label: string;
	copy: FieldCopy;
	description?: string;
	errors?: unknown;
	disabled?: boolean;
	requiredness?: Requiredness;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	/** `testID` goes on the checkbox and `${testID}-error` on the error. */
	testID?: string;
}>;

const Root = ({
	label,
	copy,
	description,
	errors,
	disabled,
	requiredness,
	checked,
	onCheckedChange,
	testID,
}: CheckboxFieldProps): ReactNode => (
	<Field.Root
		copy={copy}
		description={description}
		disabled={disabled}
		errors={errors}
		filled={checked}
		label={label}
		requiredness={requiredness}>
		<Checkbox.Control
			checked={checked}
			onCheckedChange={onCheckedChange}
			testID={testID}
		/>
		<Field.Description />
		<Field.Error testID={suffixed(testID, "error")} />
	</Field.Root>
);

type CheckboxFieldNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * A single opt-in as a field: the box and its name on one row, with the shared
 * description and error beneath.
 *
 * @example
 *   <CheckboxField.Root
 *   	label={m.register_terms()}
 *   	copy={fieldCopy}
 *   	checked={accepted}
 *   	onCheckedChange={setAccepted}
 *   />
 */
export const CheckboxField: CheckboxFieldNamespace = {
	Root,
};
