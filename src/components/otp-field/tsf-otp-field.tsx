import type { ComponentProps, ReactNode } from "react";

import { useConnectedField } from "../../lib/forms/use-connected-field";
import { OtpField } from "./otp-field";

type Props = Omit<
	ComponentProps<typeof OtpField.Root>,
	"errors" | "onBlur" | "onChangeText"
>;

/**
 * The one-time-code field bound to its TanStack Form field.
 *
 * @example
 *   <form.AppField name="code">
 *   	{field => (
 *   		<field.OtpField
 *   			copy={fieldCopy}
 *   			label={m.verify_code()}
 *   		/>
 *   	)}
 *   </form.AppField>
 */
export const TSFOtpField = (props: Props): ReactNode => {
	const { field, ...state } = useConnectedField<string>();
	return (
		<OtpField.Root
			{...props}
			{...state}
			onBlur={field.handleBlur}
			onChangeText={field.handleChange}
		/>
	);
};
