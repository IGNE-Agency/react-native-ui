import CloseIcon from "@material-design-icons/svg/outlined/close.svg";
import {
	createContext,
	useContext,
	type ReactNode,
} from "react";
import {
	Text as NativeText,
	TextInput as RNTextInput,
	View,
	type TextInputProps as RNTextInputProps,
	type TextStyle,
	type ViewStyle,
} from "react-native";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import { Field, type FieldCopy } from "../field/field";
import {
	fieldControl,
	fieldControlVariants,
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import {
	useFieldFocus,
	type FieldFocus,
} from "../field/use-field-focus";

/**
 * What a text input's field frame takes: the state a caller can observe, the
 * copy around the control, and the value the control holds.
 */
export type TextInputFieldProps = Omit<
	FieldState,
	"filled" | "focused"
> &
	Readonly<{
		label: string;
		copy: FieldCopy;
		description?: string;
		errors?: unknown;
		handle?: FieldHandle;
		value: string;
		onChangeText: (value: string) => void;
		/** The most characters the value should hold, which the counter counts towards. */
		maxLength?: number;
	}>;

/**
 * What the counter under a text input reads, handed the value's length and its
 * `maxLength`, so a project's message function can be passed as is.
 *
 * @example
 *   const counter: CounterLabel = ({ length, max }) => `${length} / ${max}`;
 */
export type CounterLabel = (
	inputs: Readonly<{ length: number; max: number }>,
) => string;

/**
 * What a text input's bare control takes: the keyboard's own settings and the
 * focus handlers, with the value and the field's state left to the frame.
 */
export type TextInputInputProps = Pick<
	RNTextInputProps,
	| "autoCapitalize"
	| "autoComplete"
	| "autoCorrect"
	| "autoFocus"
	| "keyboardType"
	| "onBlur"
	| "onFocus"
	| "onSubmitEditing"
	| "placeholder"
	| "returnKeyType"
	| "secureTextEntry"
	| "spellCheck"
	| "submitBehavior"
	| "testID"
	| "textContentType"
>;

type TextInputValue = Readonly<{
	value: string;
	setValue: (value: string) => void;
	maxLength: number | undefined;
	multiline: boolean;
	focus: FieldFocus;
}>;

type RootProps = TextInputFieldProps &
	Readonly<{
		multiline?: boolean;
		testID?: string;
		children: ReactNode;
	}>;

type PartProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type ClearProps = Readonly<{
	/** What the clear button is announced as, such as "Clear". */
	label: string;
	testID?: string;
}>;

type CounterProps = Readonly<{
	label: CounterLabel;
	testID?: string;
}>;

const TextInputContext = createContext<
	TextInputValue | undefined
>(undefined);

const useTextInput = (): TextInputValue => {
	const value = useContext(TextInputContext);
	if (value === undefined) {
		throw new Error(
			"A text input part must be rendered inside TextInput.Root",
		);
	}
	return value;
};

const Root = ({
	children,
	maxLength,
	multiline = false,
	onChangeText,
	value,
	...field
}: RootProps): ReactNode => {
	const focus = useFieldFocus();
	return (
		<TextInputContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				value,
				setValue: onChangeText,
				maxLength,
				multiline,
				focus,
			}}>
			<Field.Root filled={value !== ""} {...field}>
				{children}
			</Field.Root>
		</TextInputContext.Provider>
	);
};

const Group = ({
	testID,
	children,
}: PartProps): ReactNode => {
	const { focus, multiline } = useTextInput();
	const { accessibility, state } = Field.useControl();
	styles.useVariants({
		...state,
		focused: focus.focused,
		multiline,
	});
	return (
		<FieldControl {...accessibility}>
			<Field.Group style={styles.box} testID={testID}>
				{children}
			</Field.Group>
		</FieldControl>
	);
};

const Affix = ({
	testID,
	children,
}: PartProps): ReactNode => (
	<View
		pointerEvents="none"
		style={styles.affix}
		testID={testID}>
		<NativeText aria-hidden style={styles.caption}>
			{children}
		</NativeText>
	</View>
);

const Input = ({
	onBlur,
	onFocus,
	...props
}: TextInputInputProps): ReactNode => {
	const { focus, multiline, setValue, value } =
		useTextInput();
	const {
		accessibilityHint,
		accessibilityLabel,
		reportFocus,
		setControl,
		state,
	} = Field.useControl();
	const { theme } = useUnistyles();
	styles.useVariants({
		...state,
		focused: focus.focused,
		multiline,
	});
	return (
		<RNTextInput
			accessibilityHint={accessibilityHint}
			accessibilityLabel={accessibilityLabel}
			aria-disabled={state.disabled}
			editable={!state.disabled && !state.readonly}
			multiline={multiline}
			onChangeText={setValue}
			placeholderTextColor={theme.color.textPlaceholder}
			ref={setControl}
			selectionColor={theme.color.focusRing}
			style={styles.input}
			value={value}
			{...props}
			onBlur={event => {
				focus.handlers.onBlur(event);
				reportFocus(false);
				onBlur?.(event);
			}}
			onFocus={event => {
				focus.handlers.onFocus(event);
				reportFocus(true);
				onFocus?.(event);
			}}
		/>
	);
};

const Clear = ({
	label,
	testID,
}: ClearProps): ReactNode => {
	const { setValue, value } = useTextInput();
	const { focusControl, state } = Field.useControl();
	if (value === "" || state.disabled || state.readonly) {
		return null;
	}
	return (
		<Field.InlayButton
			end="trailing"
			label={label}
			onPress={() => {
				setValue("");
				focusControl();
			}}
			svg={CloseIcon}
			testID={testID}
		/>
	);
};

const Counter = ({
	label,
	testID,
}: CounterProps): ReactNode => {
	const { maxLength, value } = useTextInput();
	return maxLength === undefined ? null : (
		<NativeText style={styles.caption} testID={testID}>
			{label({ length: value.length, max: maxLength })}
		</NativeText>
	);
};

const styles = StyleSheet.create(theme => ({
	box: {
		...fieldGroup(theme),
		variants: {
			...fieldGroupVariants(theme),
			multiline: {
				true: {
					alignItems: "stretch",
					flexDirection: "column",
					paddingVertical: theme.unit[4],
					borderRadius: fieldGroup(theme).minHeight / 2,
				} satisfies ViewStyle,
				false: {} satisfies ViewStyle,
			},
		},
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	affix: {
		marginStart: -theme.unit[4],
		paddingEnd: theme.unit[8],
	},
	caption: {
		...theme.font.body.small,
		color: theme.color.textMuted,
	},
	input: {
		...fieldControl(theme),
		variants: {
			...fieldControlVariants(theme),
			multiline: {
				true: {
					minHeight: theme.unit[32],
					paddingVertical: 0,
					textAlignVertical: "top",
				} satisfies TextStyle,
				false: {} satisfies TextStyle,
			},
		},
	},
}));

type TextInputNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Group: typeof Group;
	Inlay: typeof Field.Inlay;
	InlayButton: typeof Field.InlayButton;
	Affix: typeof Affix;
	Input: typeof Input;
	Clear: typeof Clear;
	Counter: typeof Counter;
	Pending: typeof Field.Pending;
}>;

/**
 * The parts of a text input: the field frame, the group that wears the border
 * with its inlays, and the bare control inside it. An `Affix` is decoration, so
 * what it says belongs in the label or the description too.
 *
 * @example
 *   <TextInput.Root label={m.search()} copy={fieldCopy} value={query} onChangeText={setQuery}>
 *   	<TextInput.Label />
 *   	<TextInput.Group>
 *   		<TextInput.Input placeholder={m.search_hint()} />
 *   		<TextInput.Clear label={m.text_clear()} />
 *   	</TextInput.Group>
 *   </TextInput.Root>
 */
export const TextInput: TextInputNamespace = {
	Root,
	Label: Field.Label,
	Group,
	Inlay: Field.Inlay,
	InlayButton: Field.InlayButton,
	Affix,
	Input,
	Clear,
	Counter,
	Pending: Field.Pending,
};
