import type { ReactNode } from "react";

import type { Requiredness } from "../../lib/forms/field-state";
import { suffixed } from "../../lib/test-id/test-id";
import { Field, type FieldCopy } from "../field/field";
import {
	Switch,
	type SwitchStateLabels,
} from "../switch/switch";

/** The props a two-state toggle takes as a whole field. */
export type SwitchFieldProps = SwitchStateLabels &
	Readonly<{
		label: string;
		copy: FieldCopy;
		description?: string;
		errors?: unknown;
		disabled?: boolean;
		/** Shows a spinner in the thumb and ignores presses, while a change is being applied. */
		pending?: boolean;
		requiredness?: Requiredness;
		checked: boolean;
		onCheckedChange: (checked: boolean) => void;
		/** `testID` goes on the switch and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = ({
	label,
	copy,
	description,
	errors,
	disabled,
	pending,
	requiredness,
	checked,
	onCheckedChange,
	onLabel,
	offLabel,
	testID,
}: SwitchFieldProps): ReactNode => (
	<Field.Root
		copy={copy}
		description={description}
		disabled={disabled}
		errors={errors}
		filled={checked}
		label={label}
		pending={pending}
		requiredness={requiredness}>
		<Switch.Control
			checked={checked}
			offLabel={offLabel}
			onCheckedChange={onCheckedChange}
			onLabel={onLabel}
			testID={testID}
		/>
		<Field.Description />
		<Field.Error testID={suffixed(testID, "error")} />
	</Field.Root>
);

type SwitchFieldNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A two-state toggle as a field: the track and its name on one row, with the
 * shared description and error beneath.
 *
 * @example
 *   <SwitchField.Root
 *   	label={m.settings_notifications()}
 *   	copy={fieldCopy}
 *   	onLabel={m.switch_state_on()}
 *   	offLabel={m.switch_state_off()}
 *   	checked={enabled}
 *   	onCheckedChange={setEnabled}
 *   />
 */
export const SwitchField: SwitchFieldNamespace = { Root };
