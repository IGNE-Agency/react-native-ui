import type { ComponentProps, ReactNode } from "react";

import { suffixed } from "../../lib/test-id/test-id";
import { OtpInput } from "../otp-input/otp-input";

type RootProps = Omit<
	ComponentProps<typeof OtpInput.Root>,
	"children" | "testID"
> &
	Omit<ComponentProps<typeof OtpInput.Slots>, "testID"> &
	Readonly<{
		/** `testID` goes on the hidden input the code is typed into and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = ({
	label,
	copy,
	description,
	errors,
	disabled,
	requiredness,
	testID,
	...props
}: RootProps): ReactNode => (
	<OtpInput.Root
		copy={copy}
		description={description}
		disabled={disabled}
		errors={errors}
		label={label}
		requiredness={requiredness}>
		<OtpInput.Label />
		<OtpInput.Slots {...props} testID={testID} />
		<OtpInput.Description />
		<OtpInput.Error testID={suffixed(testID, "error")} />
	</OtpInput.Root>
);

type OtpFieldNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A one-time-code field: the label, description and error scaffold around a row
 * of character slots.
 *
 * @example
 *   <OtpField.Root
 *   	copy={fieldCopy}
 *   	label={m.verify_code()}
 *   	numberOfDigits={6}
 *   	onChangeText={setCode}
 *   />
 */
export const OtpField: OtpFieldNamespace = { Root };
