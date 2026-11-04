import * as RadioGroupPrimitive from "@rn-primitives/radio-group";
import {
	createContext,
	useContext,
	type ReactNode,
} from "react";
import { Pressable, View } from "react-native";
import Animated from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import type { Option } from "../../lib/forms/option";
import { hapticTick } from "../../lib/haptics/haptics";
import {
	popIn,
	popOut,
	timing,
	useBorderTransition,
	useFillTransition,
} from "../../lib/motion/motion";
import { ChoiceRow } from "../field/choice-row";
import { Field, type FieldCopy } from "../field/field";
import {
	controlEdge,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";

type RadioGroupContextValue = Readonly<{
	options: readonly Option<string>[];
	selected: string | undefined;
	select: (value: string) => void;
}>;

/** What a `RadioGroup.Root` takes: the field's own state, plus the list it picks from. */
export type RadioGroupRootProps<TValue extends string> =
	FieldState &
		Readonly<{
			label: string;
			copy: FieldCopy;
			description?: string;
			errors?: unknown;
			handle?: FieldHandle;
			testID?: string;
			options: readonly Option<TValue>[];
			value: TValue | undefined;
			onValueChange: (value: TValue) => void;
			children: ReactNode;
		}>;

type DotProps = Readonly<{
	chosen: boolean;
	unavailable: boolean;
}>;

type ControlProps = Readonly<{ testID?: string }>;

type RowProps = Readonly<{
	option: Option<string>;
	chosen: boolean;
	index: number;
}>;

const RadioGroupContext = createContext<
	RadioGroupContextValue | undefined
>(undefined);

const useRadioGroupContext = (): RadioGroupContextValue => {
	const value = useContext(RadioGroupContext);
	if (value === undefined) {
		throw new Error(
			"A radio group part must be rendered inside RadioGroup.Root",
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
}: RadioGroupRootProps<TValue>): ReactNode => {
	const chosen = options.find(
		option => option.value === value,
	);
	return (
		<RadioGroupContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				options,
				selected: chosen?.value,
				select: next => {
					const picked = options.find(
						option => option.value === next,
					);
					if (
						picked === undefined ||
						picked.value === chosen?.value
					) {
						return;
					}
					hapticTick();
					onValueChange(picked.value);
				},
			}}>
			<Field.Root
				{...given}
				description={description}
				errors={errors}
				filled={given.filled ?? chosen !== undefined}
				handle={handle}
				label={label}>
				{children}
			</Field.Root>
		</RadioGroupContext.Provider>
	);
};

const Dot = ({
	chosen,
	unavailable,
}: DotProps): ReactNode => {
	const { state } = Field.useControl();
	const { theme } = useUnistyles();
	styles.useVariants({
		...state,
		chosen,
		disabled: unavailable,
	});
	const config = timing(
		theme.motion.short,
		theme.motion.standard,
	);
	const edge = useBorderTransition(styles.ring, config);
	const fill = useFillTransition(styles.ring, config);
	return (
		<Animated.View style={[styles.ring, edge, fill]}>
			<RadioGroupPrimitive.Indicator asChild>
				<Animated.View
					entering={popIn(theme.motion)}
					exiting={popOut(theme.motion)}
					style={styles.dot}
				/>
			</RadioGroupPrimitive.Indicator>
		</Animated.View>
	);
};

const Row = ({
	option,
	chosen,
	index,
}: RowProps): ReactNode => {
	const { state } = Field.useControl();
	const target = Field.useFocusTarget({
		kind: chosen ? "chosen" : "option",
		index,
		disabled: option.disabled === true,
	});
	const unavailable =
		state.disabled || option.disabled === true;
	return (
		<RadioGroupPrimitive.Item
			accessibilityLabel={option.label}
			asChild
			disabled={option.disabled === true}
			value={option.value}>
			<Pressable ref={target} testID={option.testID}>
				<ChoiceRow
					disabled={unavailable}
					label={option.label}>
					<Dot chosen={chosen} unavailable={unavailable} />
				</ChoiceRow>
			</Pressable>
		</RadioGroupPrimitive.Item>
	);
};

const Rows = ({ testID }: ControlProps): ReactNode => {
	const { options, select, selected } =
		useRadioGroupContext();
	const { accessibility, accessibilityLabel, state } =
		Field.useControl();
	return (
		<FieldControl {...accessibility}>
			<RadioGroupPrimitive.Root
				accessibilityLabel={accessibilityLabel}
				asChild
				disabled={state.disabled || state.readonly}
				onValueChange={select}
				value={selected}>
				<View style={styles.rows} testID={testID}>
					{options.map((option, index) => (
						<Row
							chosen={option.value === selected}
							index={index}
							key={option.value}
							option={option}
						/>
					))}
				</View>
			</RadioGroupPrimitive.Root>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	rows: {
		alignItems: "stretch",
		flexDirection: "column",
	},
	ring: {
		...controlEdge(theme).resting,
		alignItems: "center",
		justifyContent: "center",
		width: theme.unit[12],
		height: theme.unit[12],
		borderRadius: theme.radius.circle,
		backgroundColor: theme.color.surfaceHighest,
		variants: {
			...fieldGroupVariants(theme),
			chosen: {
				true: {
					borderColor: theme.color.primary,
					backgroundColor: theme.color.primary,
				},
				false: {},
			},
		},
		compoundVariants: [
			...fieldGroupCompounds(theme, [
				{
					chosen: true,
					invalid: true,
					styles: {
						borderColor: theme.color.error.fg,
						backgroundColor: theme.color.error.fg,
					},
				},
				{
					chosen: true,
					readonly: true,
					styles: {
						backgroundColor: theme.color.primary,
					},
				},
			]),
		],
	},
	dot: {
		width: theme.unit[6],
		height: theme.unit[6],
		borderRadius: theme.radius.circle,
		backgroundColor: theme.color.onPrimary,
		variants: {
			...fieldGroupVariants(theme),
			invalid: {
				true: {
					backgroundColor: theme.color.error.bg,
				},
				false: {},
			},
			disabled: {
				true: {
					backgroundColor: theme.color.disabled.fg,
				},
				false: {},
			},
			chosen: { true: {}, false: {} },
		},
	},
}));

type RadioGroupNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Control: typeof Rows;
}>;

/**
 * The parts of a field that picks exactly one of a list, stacked as rows of a
 * radio and its label; once a value is chosen it can be changed but not cleared.
 *
 * @example
 *   <RadioGroup.Root
 *   	label={m.settings_theme()}
 *   	copy={fieldCopy}
 *   	options={appearances}
 *   	value={appearance}
 *   	onValueChange={setAppearance}>
 *   	<RadioGroup.Label />
 *   	<RadioGroup.Control />
 *   	<RadioGroup.Error />
 *   </RadioGroup.Root>
 */
export const RadioGroup: RadioGroupNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Control: Rows,
};
