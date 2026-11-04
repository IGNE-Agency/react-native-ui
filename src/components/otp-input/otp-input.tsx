import type { ReactNode } from "react";
import {
	OtpInput as RNOtpInput,
	type Theme,
} from "react-native-otp-entry";
import { useUnistyles } from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type {
	FieldVariants,
	Requiredness,
} from "../../lib/forms/field-state";
import type { SysTheme } from "../../theme";
import { Field, type FieldCopy } from "../field/field";
import { controlEdge } from "../field/field-shell";

type RootProps = Readonly<{
	label: string;
	copy: FieldCopy;
	description?: string;
	errors?: unknown;
	disabled?: boolean;
	requiredness?: Requiredness;
	testID?: string;
	children: ReactNode;
}>;

type SlotsProps = Readonly<{
	numberOfDigits?: number;
	onChangeText: (value: string) => void;
	onBlur?: () => void;
	/** Goes on the hidden input the code is typed into. */
	testID?: string;
}>;

const slotTheme = (
	theme: SysTheme,
	state: FieldVariants,
): Theme => {
	const edge = controlEdge(theme);
	return {
		containerStyle: { gap: theme.unit[4] },
		pinCodeContainerStyle: {
			...edge.resting,
			...(state.invalid ? edge.invalid : {}),
			flex: 1,
			minWidth: 0,
			maxWidth: theme.unit[24],
			aspectRatio: 1,
			borderRadius: theme.radius.sm,
			backgroundColor: state.invalid
				? theme.color.error.bg
				: theme.color.surfaceHighest,
		},
		focusedPinCodeContainerStyle: state.invalid
			? edge.invalidFocused
			: edge.focused,
		disabledPinCodeContainerStyle: {
			...edge.disabled,
			backgroundColor: theme.color.disabled.bg,
		},
		pinCodeTextStyle: {
			...theme.font.label.large,
			color: state.disabled
				? theme.color.disabled.fg
				: theme.color.text,
		},
	};
};

const Root = ({
	label,
	copy,
	description,
	errors,
	disabled,
	requiredness,
	testID,
	children,
}: RootProps): ReactNode => (
	<Field.Root
		copy={copy}
		description={description}
		disabled={disabled}
		errors={errors}
		label={label}
		requiredness={requiredness}
		testID={testID}>
		{children}
	</Field.Root>
);

const Slots = ({
	numberOfDigits = 6,
	onChangeText,
	onBlur,
	testID,
}: SlotsProps): ReactNode => {
	const {
		accessibility,
		accessibilityHint,
		accessibilityLabel,
		setControl,
		state,
	} = Field.useControl();
	const { theme } = useUnistyles();
	return (
		<FieldControl {...accessibility}>
			<RNOtpInput
				autoFocus={false}
				disabled={state.disabled}
				focusColor={theme.color.focusRing}
				numberOfDigits={numberOfDigits}
				onBlur={onBlur}
				onTextChange={onChangeText}
				ref={setControl}
				textInputProps={{
					accessibilityHint,
					accessibilityLabel,
					"aria-disabled": state.disabled,
					testID,
				}}
				theme={slotTheme(theme, state)}
				type="numeric"
			/>
		</FieldControl>
	);
};

type OtpInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Slots: typeof Slots;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
}>;

/**
 * The parts of a one-time-code field: our field frame around the slot row the
 * library draws. A slot takes an even share of the row up to one step of the
 * length scale and keeps a square, so the row narrows without the slots
 * distorting. The hidden input behind the slots is the field's only
 * accessibility node, and it is uncontrolled — the slots report what is typed.
 *
 * @example
 *   <OtpInput.Root label={m.verify_code()} copy={fieldCopy}>
 *   	<OtpInput.Label />
 *   	<OtpInput.Slots onChangeText={setCode} />
 *   	<OtpInput.Error />
 *   </OtpInput.Root>
 */
export const OtpInput: OtpInputNamespace = {
	Root,
	Label: Field.Label,
	Slots,
	Description: Field.Description,
	Error: Field.Error,
};
