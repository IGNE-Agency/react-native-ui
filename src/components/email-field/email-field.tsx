import MailIcon from "@material-design-icons/svg/outlined/mail_outline.svg";
import type { ComponentProps, ReactNode } from "react";
import { useUnistyles } from "react-native-unistyles";

import { Icon } from "../icon/icon";
import { TextField } from "../text-field/text-field";
import { TextInput } from "../text-input/text-input";

type RootProps = Omit<
	ComponentProps<typeof TextField.Root>,
	| "autoCapitalize"
	| "autoComplete"
	| "keyboardType"
	| "leading"
	| "secureTextEntry"
	| "spellCheck"
	| "testID"
	| "textContentType"
> &
	Readonly<{
		/** `testID` goes on the input, `${testID}-clear` on the clear button and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = (props: RootProps): ReactNode => {
	const { theme } = useUnistyles();
	return (
		<TextField.Root
			{...props}
			autoCapitalize="none"
			autoComplete="email"
			keyboardType="email-address"
			leading={
				<TextInput.Inlay end="leading">
					<Icon.Root
						color={theme.color.textMuted}
						svg={MailIcon}
					/>
				</TextInput.Inlay>
			}
			spellCheck={false}
			textContentType="emailAddress"
		/>
	);
};

type EmailFieldNamespace = Readonly<{ Root: typeof Root }>;

/**
 * An email address field: the text field with the address keyboard, the
 * platform's own address autofill and a leading glyph, all fixed.
 *
 * @example
 *   <EmailField.Root
 *   	copy={fieldCopy}
 *   	label={m.login_email()}
 *   	value={email}
 *   	onChangeText={setEmail}
 *   />
 */
export const EmailField: EmailFieldNamespace = { Root };
