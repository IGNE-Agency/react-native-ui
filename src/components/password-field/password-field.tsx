import VisibilityIcon from "@material-design-icons/svg/outlined/visibility.svg";
import VisibilityOffIcon from "@material-design-icons/svg/outlined/visibility_off.svg";
import {
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";

import {
	usePasswordRating,
	type PasswordLanguages,
} from "../../lib/password-strength/use-password-score";
import { suffixed } from "../../lib/test-id/test-id";
import {
	PasswordStrength,
	type PasswordStrengthCopy,
} from "../password-strength/password-strength";
import { TextField } from "../text-field/text-field";
import { TextInput } from "../text-input/text-input";

/**
 * What the strength meter under a password field needs: the app's locale tag,
 * which picks the dictionaries and feedback language, and the meter's words.
 */
export type PasswordStrengthOptions = Readonly<{
	locale: string;
	copy: PasswordStrengthCopy;
	/** Language packs beside the kit's English and Dutch, such as `{ de: () => import("@zxcvbn-ts/language-de") }`. */
	languages?: PasswordLanguages;
}>;

type RootProps = Omit<
	ComponentProps<typeof TextField.Root>,
	| "autoCapitalize"
	| "below"
	| "children"
	| "clearLabel"
	| "counterLabel"
	| "keyboardType"
	| "maxLength"
	| "secureTextEntry"
	| "spellCheck"
	| "testID"
> &
	Readonly<{
		/** What the reveal toggle is announced as while the password is hidden. */
		showPasswordLabel: string;
		/** What the reveal toggle is announced as while the password shows. */
		hidePasswordLabel: string;
		/** Given, the field shows the strength meter under it. */
		strength?: PasswordStrengthOptions;
		/** `testID` goes on the input, `${testID}-reveal` on the reveal toggle, `${testID}-strength` on the strength meter and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Meter = ({
	value,
	strength,
	testID,
}: Readonly<{
	value: string;
	strength: PasswordStrengthOptions;
	testID: string | undefined;
}>): ReactNode => (
	<PasswordStrength.Root
		copy={strength.copy}
		rating={usePasswordRating(
			value,
			strength.locale,
			strength.languages,
		)}
		testID={testID}
	/>
);

const Root = ({
	disabled,
	hidePasswordLabel,
	showPasswordLabel,
	strength,
	testID,
	...props
}: RootProps): ReactNode => {
	const [revealed, setRevealed] = useState(false);
	return (
		<TextField.Root
			autoCapitalize="none"
			below={
				strength === undefined ? null : (
					<Meter
						strength={strength}
						testID={suffixed(testID, "strength")}
						value={props.value}
					/>
				)
			}
			disabled={disabled}
			secureTextEntry={!revealed}
			spellCheck={false}
			testID={testID}
			{...props}>
			<TextInput.InlayButton
				disabled={disabled}
				end="trailing"
				label={
					revealed ? hidePasswordLabel : showPasswordLabel
				}
				onPress={() => setRevealed(!revealed)}
				svg={revealed ? VisibilityOffIcon : VisibilityIcon}
				testID={suffixed(testID, "reveal")}
			/>
		</TextField.Root>
	);
};

type PasswordFieldNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * A password entry field: the text field with a reveal toggle that names which
 * of the two things it does next. `strength` adds the meter, for a field that
 * defines a password rather than confirming one that exists.
 *
 * @example
 *   <PasswordField.Root
 *   	autoComplete="current-password"
 *   	copy={fieldCopy}
 *   	hidePasswordLabel={m.common_hide_password()}
 *   	label={m.login_password()}
 *   	showPasswordLabel={m.common_show_password()}
 *   	value={password}
 *   	onChangeText={setPassword}
 *   />
 */
export const PasswordField: PasswordFieldNamespace = {
	Root,
};
