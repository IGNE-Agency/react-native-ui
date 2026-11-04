import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import {
	createContext,
	useContext,
	type ReactNode,
} from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import type { Option } from "../../lib/forms/option";
import { hapticTick } from "../../lib/haptics/haptics";
import { Checkbox } from "../checkbox/checkbox";
import { ChoiceRow } from "../field/choice-row";
import { Field, type FieldCopy } from "../field/field";

type CheckboxGroupContextValue = Readonly<{
	options: readonly Option<string>[];
	checked: readonly string[];
	toggle: (value: string, on: boolean) => void;
}>;

/** What a `CheckboxGroup.Root` takes: the field's own state, plus the list it picks from. */
export type CheckboxGroupRootProps<TValue extends string> =
	FieldState &
		Readonly<{
			label: string;
			copy: FieldCopy;
			description?: string;
			errors?: unknown;
			handle?: FieldHandle;
			testID?: string;
			options: readonly Option<TValue>[];
			value: readonly TValue[];
			onValueChange: (value: readonly TValue[]) => void;
			children: ReactNode;
		}>;

type ControlProps = Readonly<{ testID?: string }>;

type ItemProps = Readonly<{
	option: Option<string>;
	checked: boolean;
	index: number;
}>;

const CheckboxGroupContext = createContext<
	CheckboxGroupContextValue | undefined
>(undefined);

const useCheckboxGroupContext =
	(): CheckboxGroupContextValue => {
		const value = useContext(CheckboxGroupContext);
		if (value === undefined) {
			throw new Error(
				"A checkbox group part must be rendered inside CheckboxGroup.Root",
			);
		}
		return value;
	};

const Root = <TValue extends string>({
	label,
	description,
	errors,
	handle,
	options,
	value,
	onValueChange,
	children,
	...given
}: CheckboxGroupRootProps<TValue>): ReactNode => {
	const checked = options.filter(option =>
		value.includes(option.value),
	);
	return (
		<CheckboxGroupContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				checked: checked.map(option => option.value),
				options,
				toggle: (next, on) => {
					const picked = options.find(
						option => option.value === next,
					);
					if (picked === undefined) {
						return;
					}
					hapticTick();
					const kept = value.filter(
						held => held !== picked.value,
					);
					onValueChange(
						on ? [...kept, picked.value] : kept,
					);
				},
			}}>
			<Field.Root
				{...given}
				description={description}
				errors={errors}
				filled={given.filled ?? checked.length > 0}
				handle={handle}
				label={label}>
				{children}
			</Field.Root>
		</CheckboxGroupContext.Provider>
	);
};

const Item = ({
	option,
	checked,
	index,
}: ItemProps): ReactNode => {
	const { state } = Field.useControl();
	const target = Field.useFocusTarget({
		kind: checked ? "chosen" : "option",
		index,
		disabled: option.disabled === true,
	});
	const { toggle } = useCheckboxGroupContext();
	const unavailable =
		state.disabled || option.disabled === true;
	return (
		<CheckboxPrimitive.Root
			accessibilityLabel={option.label}
			checked={checked}
			disabled={unavailable || state.readonly}
			onCheckedChange={next => toggle(option.value, next)}
			ref={target}
			testID={option.testID}>
			<ChoiceRow
				disabled={unavailable}
				label={option.label}>
				<Checkbox.Box
					checked={checked}
					disabled={unavailable}
				/>
			</ChoiceRow>
		</CheckboxPrimitive.Root>
	);
};

const Items = ({ testID }: ControlProps): ReactNode => {
	const { checked, options } = useCheckboxGroupContext();
	const { accessibility, accessibilityLabel } =
		Field.useControl();
	return (
		<FieldControl {...accessibility}>
			<View
				accessibilityLabel={accessibilityLabel}
				role="group"
				style={styles.items}
				testID={testID}>
				{options.map((option, index) => (
					<Item
						checked={checked.includes(option.value)}
						index={index}
						key={option.value}
						option={option}
					/>
				))}
			</View>
		</FieldControl>
	);
};

const styles = StyleSheet.create({
	items: {
		alignItems: "stretch",
		flexDirection: "column",
	},
});

type CheckboxGroupNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Control: typeof Items;
}>;

/**
 * The parts of a field that picks any number of a list, stacked as rows of a
 * checkbox and its label; none checked is a value too.
 *
 * @example
 *   <CheckboxGroup.Root
 *   	label={m.profile_notifications()}
 *   	copy={fieldCopy}
 *   	options={channels}
 *   	value={chosen}
 *   	onValueChange={setChosen}>
 *   	<CheckboxGroup.Label />
 *   	<CheckboxGroup.Control />
 *   	<CheckboxGroup.Error />
 *   </CheckboxGroup.Root>
 */
export const CheckboxGroup: CheckboxGroupNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Control: Items,
};
