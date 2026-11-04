import {
	createContext,
	useContext,
	type ReactNode,
} from "react";
import {
	Text as NativeText,
	Pressable,
	View,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import type { FieldState } from "../../lib/forms/field-state";
import type { FieldHandle } from "../../lib/forms/keyboard-sequence";
import type { Option } from "../../lib/forms/option";
import { hapticTick } from "../../lib/haptics/haptics";
import { timing } from "../../lib/motion/motion";
import { Field, type FieldCopy } from "../field/field";
import {
	controlEdge,
	fieldGroupVariants,
} from "../field/field-shell";

type ToggleGroupContextValue = Readonly<{
	options: readonly Option<string>[];
	pressed: readonly string[];
	toggle: (value: string) => void;
}>;

/** What a `ToggleGroup.Root` takes: the field's own state, plus the chips it shows. */
export type ToggleGroupRootProps<TValue extends string> =
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

type ChipProps = Readonly<{
	option: Option<string>;
	pressed: boolean;
	index: number;
}>;

const ToggleGroupContext = createContext<
	ToggleGroupContextValue | undefined
>(undefined);

const useToggleGroupContext =
	(): ToggleGroupContextValue => {
		const value = useContext(ToggleGroupContext);
		if (value === undefined) {
			throw new Error(
				"A toggle group part must be rendered inside ToggleGroup.Root",
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
}: ToggleGroupRootProps<TValue>): ReactNode => {
	const pressed = options.filter(option =>
		value.includes(option.value),
	);
	return (
		<ToggleGroupContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				options,
				pressed: pressed.map(option => option.value),
				toggle: next => {
					const chip = options.find(
						option => option.value === next,
					);
					if (chip === undefined) {
						return;
					}
					hapticTick();
					const kept = value.filter(
						held => held !== chip.value,
					);
					onValueChange(
						kept.length === value.length
							? [...kept, chip.value]
							: kept,
					);
				},
			}}>
			<Field.Root
				{...given}
				description={description}
				errors={errors}
				filled={given.filled ?? pressed.length > 0}
				handle={handle}
				label={label}>
				{children}
			</Field.Root>
		</ToggleGroupContext.Provider>
	);
};

const Chip = ({
	option,
	pressed,
	index,
}: ChipProps): ReactNode => {
	const { state } = Field.useControl();
	const target = Field.useFocusTarget({
		kind: pressed ? "chosen" : "option",
		index,
		disabled: option.disabled === true,
	});
	const { toggle } = useToggleGroupContext();
	const { theme } = useUnistyles();
	const disabled =
		state.disabled || option.disabled === true;
	styles.useVariants({ ...state, disabled, pressed });
	const shown = timing(
		theme.motion.instant,
		theme.motion.standard,
	);
	const grown = pressed
		? timing(theme.motion.short, theme.motion.overshoot)
		: shown;
	const fill = useAnimatedStyle(() => ({
		opacity: withTiming(pressed ? 1 : 0, shown),
		transform: [
			{ scale: withTiming(pressed ? 1 : 0, grown) },
		],
	}));
	return (
		<Pressable
			accessibilityLabel={option.label}
			accessibilityRole="togglebutton"
			accessibilityState={{ checked: pressed }}
			disabled={disabled || state.readonly}
			onPress={() => toggle(option.value)}
			ref={target}
			testID={option.testID}>
			<View style={styles.chip}>
				<View style={styles.rest} />
				<Animated.View
					pointerEvents="none"
					style={[styles.fill, fill]}
				/>
				<NativeText
					aria-hidden
					numberOfLines={1}
					style={styles.chipLabel}>
					{option.label}
				</NativeText>
			</View>
		</Pressable>
	);
};

const Chips = ({ testID }: ControlProps): ReactNode => {
	const { options, pressed } = useToggleGroupContext();
	const { accessibility, accessibilityLabel, state } =
		Field.useControl();
	styles.useVariants({ ...state, pressed: false });
	return (
		<FieldControl {...accessibility}>
			<View
				accessibilityLabel={accessibilityLabel}
				role="group"
				style={styles.chips}
				testID={testID}>
				{options.map((option, index) => (
					<Chip
						index={index}
						key={option.value}
						option={option}
						pressed={pressed.includes(option.value)}
					/>
				))}
				<Field.Pending />
			</View>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	chips: {
		alignItems: "center",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 0,
	},
	chip: {
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		minHeight: theme.unit[24],
		paddingHorizontal: theme.unit[10],
		overflow: "visible",
	},
	rest: {
		borderRadius: theme.radius.full,
		bottom: theme.unit[2],
		left: theme.unit[2],
		position: "absolute",
		right: theme.unit[2],
		top: theme.unit[2],
		backgroundColor: theme.color.primaryContainer,
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
					backgroundColor: theme.color.disabled.bg,
				},
				false: {},
			},
			pressed: { true: {}, false: {} },
		},
		compoundVariants: [
			{
				readonly: true,
				styles: {
					...controlEdge(theme).resting,
					...controlEdge(theme).readonly,
					backgroundColor: theme.color.surfaceHighest,
				},
			},
			{
				readonly: true,
				disabled: true,
				styles: {
					...controlEdge(theme).disabled,
					backgroundColor: theme.color.disabled.bg,
				},
			},
		],
	},
	fill: {
		borderRadius: theme.radius.full,
		bottom: theme.unit[2],
		left: theme.unit[2],
		position: "absolute",
		right: theme.unit[2],
		top: theme.unit[2],
		backgroundColor: theme.color.primary,
		variants: {
			...fieldGroupVariants(theme),
			invalid: {
				true: {
					backgroundColor: theme.color.error.fg,
				},
				false: {},
			},
			disabled: {
				true: {
					backgroundColor: theme.color.disabled.fg,
				},
				false: {},
			},
			pressed: { true: {}, false: {} },
		},
		compoundVariants: [
			{
				readonly: true,
				styles: {
					...controlEdge(theme).resting,
					...controlEdge(theme).readonly,
				},
			},
			{
				readonly: true,
				disabled: true,
				styles: controlEdge(theme).disabled,
			},
		],
	},
	chipLabel: {
		...theme.font.label.medium,
		color: theme.color.onPrimaryContainer,
		variants: {
			...fieldGroupVariants(theme),
			invalid: {
				true: { color: theme.color.error.fg },
				false: {},
			},
			disabled: {
				true: { color: theme.color.disabled.fg },
				false: {},
			},
			pressed: {
				true: {
					...theme.font.label.mediumStrong,
					color: theme.color.onPrimary,
				},
				false: {},
			},
		},
		compoundVariants: [
			{
				pressed: true,
				invalid: true,
				styles: { color: theme.color.error.bg },
			},
			{
				pressed: false,
				readonly: true,
				styles: { color: theme.color.text },
			},
			{
				pressed: true,
				disabled: true,
				styles: { color: theme.color.disabled.bg },
			},
			{
				pressed: false,
				disabled: true,
				styles: { color: theme.color.disabled.fg },
			},
		],
	},
}));

type ToggleGroupNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Control: typeof Chips;
}>;

/**
 * The parts of a toggle group: a wrapping row of chips for quick filter or tag
 * picking, each a toggle button that is pressed or not, with any number pressed.
 * For a form list of options, use `CheckboxGroup`.
 *
 * @example
 *   <ToggleGroup.Root
 *   	label={m.results_connectors()}
 *   	copy={fieldCopy}
 *   	options={connectors}
 *   	value={pressed}
 *   	onValueChange={setPressed}>
 *   	<ToggleGroup.Label />
 *   	<ToggleGroup.Control />
 *   	<ToggleGroup.Error />
 *   </ToggleGroup.Root>
 */
export const ToggleGroup: ToggleGroupNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Control: Chips,
};
