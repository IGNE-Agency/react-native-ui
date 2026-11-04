import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { suffixed } from "../../lib/test-id/test-id";
import { Field } from "../field/field";
import {
	TextInput,
	type CounterLabel,
	type TextInputFieldProps,
	type TextInputInputProps,
} from "../text-input/text-input";

type RootProps = TextInputFieldProps &
	Omit<
		TextInputInputProps,
		| "keyboardType"
		| "secureTextEntry"
		| "testID"
		| "textContentType"
	> &
	Readonly<{
		/** What the counter on the group's strip reads. Given with `maxLength`, the field shows one. */
		counterLabel?: CounterLabel;
		/** `testID` goes on the input and `${testID}-error` on the error. */
		testID?: string;
	}>;

const Root = ({
	copy,
	counterLabel,
	description,
	dirty,
	disabled,
	errors,
	handle,
	invalid,
	label,
	maxLength,
	onChangeText,
	pending,
	readonly,
	requiredness,
	testID,
	touched,
	valid,
	value,
	...input
}: RootProps): ReactNode => (
	<TextInput.Root
		copy={copy}
		description={description}
		dirty={dirty}
		disabled={disabled}
		errors={errors}
		handle={handle}
		invalid={invalid}
		label={label}
		maxLength={maxLength}
		multiline
		onChangeText={onChangeText}
		pending={pending}
		readonly={readonly}
		requiredness={requiredness}
		touched={touched}
		valid={valid}
		value={value}>
		<TextInput.Label />
		<TextInput.Group>
			<TextInput.Input {...input} testID={testID} />
			<View pointerEvents="none" style={styles.strip}>
				{counterLabel === undefined ? null : (
					<TextInput.Counter label={counterLabel} />
				)}
				<TextInput.Pending />
			</View>
		</TextInput.Group>
		<Field.Description />
		<Field.Error testID={suffixed(testID, "error")} />
	</TextInput.Root>
);

const styles = StyleSheet.create(theme => ({
	strip: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		paddingStart: theme.unit[8],
	},
}));

type TextareaFieldNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * A multi-line entry field: the text field's anatomy over a control that grows
 * with its content, with the counter and the spinner on a strip along the bottom
 * of the group, where inlays cannot sit beside the control.
 *
 * @example
 *   <TextareaField.Root
 *   	copy={fieldCopy}
 *   	counterLabel={m.text_counter}
 *   	label={m.feedback_message()}
 *   	maxLength={2000}
 *   	value={message}
 *   	onChangeText={setMessage}
 *   />
 */
export const TextareaField: TextareaFieldNamespace = {
	Root,
};
