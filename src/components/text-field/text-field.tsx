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
	Omit<TextInputInputProps, "testID"> &
	Readonly<{
		below?: ReactNode;
		/** What the clear button is announced as. Given, the field shows one while it holds a value. */
		clearLabel?: string;
		/** What the counter under the group reads. Given with `maxLength`, the field shows one. */
		counterLabel?: CounterLabel;
		labelHidden?: boolean;
		leading?: ReactNode;
		/** `testID` goes on the input, `${testID}-clear` on the clear button and `${testID}-error` on the error. */
		testID?: string;
		children?: ReactNode;
	}>;

const Root = ({
	below,
	children,
	clearLabel,
	counterLabel,
	labelHidden = false,
	leading,
	copy,
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
		onChangeText={onChangeText}
		pending={pending}
		readonly={readonly}
		requiredness={requiredness}
		touched={touched}
		valid={valid}
		value={value}>
		{labelHidden ? null : <TextInput.Label />}
		<View style={styles.control}>
			<TextInput.Group>
				{leading}
				<TextInput.Input {...input} testID={testID} />
				{children}
				<TextInput.Pending />
				{clearLabel === undefined ? null : (
					<TextInput.Clear
						label={clearLabel}
						testID={suffixed(testID, "clear")}
					/>
				)}
			</TextInput.Group>
			{below}
		</View>
		{counterLabel === undefined ? null : (
			<TextInput.Counter label={counterLabel} />
		)}
		<Field.Description />
		<Field.Error testID={suffixed(testID, "error")} />
	</TextInput.Root>
);

const styles = StyleSheet.create(theme => ({
	control: { gap: theme.unit[4] },
}));

type TextFieldNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A single-line entry field: the label, description and error around one
 * bordered group, with the counter under it, `leading` ahead of the control and
 * any inlay of the caller's own after it. `below` takes chrome that comments on
 * the value from under the group. `labelHidden` drops the label from the screen
 * and leaves the announced name it came from in place.
 *
 * @example
 *   <TextField.Root
 *   	clearLabel={m.text_clear()}
 *   	copy={fieldCopy}
 *   	label={m.search()}
 *   	leading={
 *   		<TextInput.Inlay end="leading">
 *   			<Icon.Root svg={SearchIcon} />
 *   		</TextInput.Inlay>
 *   	}
 *   	value={query}
 *   	onChangeText={setQuery}
 *   />
 */
export const TextField: TextFieldNamespace = { Root };
