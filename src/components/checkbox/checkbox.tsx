import CheckIcon from "@material-design-icons/svg/outlined/check.svg";
import * as CheckboxPrimitive from "@rn-primitives/checkbox";
import type { ReactNode } from "react";
import { View } from "react-native";
import Animated from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import { hapticTick } from "../../lib/haptics/haptics";
import {
	popIn,
	popOut,
	timing,
	useBorderTransition,
	useFillTransition,
} from "../../lib/motion/motion";
import { Field } from "../field/field";
import {
	controlEdge,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { Icon } from "../icon/icon";

type BoxProps = Readonly<{
	checked: boolean;
	disabled?: boolean;
	testID?: string;
}>;

type ControlProps = Readonly<{
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	testID?: string;
}>;

const Box = ({
	checked,
	disabled,
	testID,
}: BoxProps): ReactNode => {
	const { state } = Field.useControl();
	const { theme } = useUnistyles();
	const unavailable = disabled ?? state.disabled;
	styles.useVariants({
		...state,
		checked,
		disabled: unavailable,
	});
	const config = timing(
		theme.motion.short,
		theme.motion.standard,
	);
	const edge = useBorderTransition(styles.box, config);
	const fill = useFillTransition(styles.box, config);
	return (
		<Animated.View
			style={[styles.box, edge, fill]}
			testID={testID}>
			<CheckboxPrimitive.Indicator asChild>
				<Animated.View
					entering={popIn(theme.motion)}
					exiting={popOut(theme.motion)}>
					<Icon.Root
						color={
							unavailable
								? theme.color.disabled.fg
								: theme.color.onPrimary
						}
						size="sm"
						svg={CheckIcon}
					/>
				</Animated.View>
			</CheckboxPrimitive.Indicator>
		</Animated.View>
	);
};

const Control = ({
	checked,
	onCheckedChange,
	testID,
}: ControlProps): ReactNode => {
	const {
		accessibility,
		accessibilityHint,
		accessibilityLabel,
		setControl,
		state,
	} = Field.useControl();
	const target = Field.useFocusTarget({ kind: "control" });
	return (
		<FieldControl {...accessibility}>
			<CheckboxPrimitive.Root
				accessibilityHint={accessibilityHint}
				accessibilityLabel={accessibilityLabel}
				checked={checked}
				disabled={state.disabled}
				onCheckedChange={next => {
					hapticTick();
					onCheckedChange(next);
				}}
				ref={node => {
					setControl(node);
					target(node);
				}}
				testID={testID}>
				<View style={styles.row}>
					<Box checked={checked} />
					<Field.InlineLabelText />
				</View>
			</CheckboxPrimitive.Root>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	row: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[6],
		minHeight: theme.unit[22],
	},
	box: {
		...controlEdge(theme).resting,
		alignItems: "center",
		justifyContent: "center",
		width: theme.unit[12],
		height: theme.unit[12],
		borderRadius: theme.radius.xs,
		backgroundColor: theme.color.surfaceHighest,
		variants: {
			...fieldGroupVariants(theme),
			checked: {
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
					checked: true,
					invalid: true,
					styles: {
						borderColor: theme.color.error.fg,
						backgroundColor: theme.color.error.fg,
					},
				},
				{
					checked: true,
					readonly: true,
					styles: {
						backgroundColor: theme.color.primary,
					},
				},
			]),
		],
	},
}));

type CheckboxNamespace = Readonly<{
	Box: typeof Box;
	Control: typeof Control;
}>;

/**
 * The parts of a single opt-in: the painted box, and the row that toggles it and
 * carries the field's name beside it. The primitive's own trigger is the
 * pressable node, and our styled row sits inside it.
 *
 * @example
 *   <Field.Root label={m.register_terms()} copy={fieldCopy}>
 *   	<Checkbox.Control
 *   		checked={accepted}
 *   		onCheckedChange={setAccepted}
 *   	/>
 *   </Field.Root>
 */
export const Checkbox: CheckboxNamespace = { Box, Control };
