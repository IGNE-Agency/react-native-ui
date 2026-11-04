import * as SwitchPrimitive from "@rn-primitives/switch";
import type { ReactNode } from "react";
import { Pressable } from "react-native";
import Animated from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { FieldControl } from "../../lib/a11y/field-accessibility";
import { hapticTick } from "../../lib/haptics/haptics";
import {
	timing,
	travel,
	useBorderTransition,
	useFillTransition,
} from "../../lib/motion/motion";
import { Field } from "../field/field";
import {
	controlEdge,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";
import { Spinner } from "../spinner/spinner";

type TrackProps = Readonly<{
	checked: boolean;
	testID?: string;
}>;

/** The words a switch's value is announced as. */
export type SwitchStateLabels = Readonly<{
	/** What a switch that is on reads as, such as "On". */
	onLabel: string;
	/** What a switch that is off reads as, such as "Off". */
	offLabel: string;
}>;

type ControlProps = SwitchStateLabels &
	Readonly<{
		checked: boolean;
		onCheckedChange: (checked: boolean) => void;
		testID?: string;
	}>;

const Track = ({
	checked,
	testID,
}: TrackProps): ReactNode => {
	const { state } = Field.useControl();
	const { theme } = useUnistyles();
	styles.useVariants({ ...state, checked });
	const config = timing(
		theme.motion.short,
		theme.motion.emphasized,
	);
	const trackEdge = useBorderTransition(
		styles.track,
		config,
	);
	const trackFill = useFillTransition(styles.track, config);
	const thumbFill = useFillTransition(styles.thumb, config);
	return (
		<Animated.View
			style={[styles.track, trackEdge, trackFill]}
			testID={testID}>
			<SwitchPrimitive.Thumb asChild>
				<Animated.View
					layout={travel(theme.motion)}
					style={[styles.thumb, thumbFill]}>
					{state.pending ? (
						<Spinner.Indicator size="sm" />
					) : null}
				</Animated.View>
			</SwitchPrimitive.Thumb>
		</Animated.View>
	);
};

const Control = ({
	checked,
	onCheckedChange,
	onLabel,
	offLabel,
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
			<SwitchPrimitive.Root
				aria-valuetext={checked ? onLabel : offLabel}
				asChild
				checked={checked}
				disabled={state.disabled}
				onCheckedChange={next => {
					if (state.pending) {
						return;
					}
					hapticTick();
					onCheckedChange(next);
				}}>
				<Pressable
					aria-busy={state.pending}
					accessibilityHint={accessibilityHint}
					accessibilityLabel={accessibilityLabel}
					ref={node => {
						setControl(node);
						target(node);
					}}
					style={styles.row}
					testID={testID}>
					<Track checked={checked} />
					<Field.InlineLabelText />
				</Pressable>
			</SwitchPrimitive.Root>
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
	track: {
		alignItems: "center",
		flexDirection: "row",
		width: theme.unit[24],
		height: theme.unit[16],
		padding: theme.unit[2],
		...controlEdge(theme).resting,
		borderRadius: theme.radius.full,
		backgroundColor: theme.color.surfaceHighest,
		variants: {
			...fieldGroupVariants(theme),
			checked: {
				true: {
					justifyContent: "flex-end",
					borderColor: theme.color.primary,
					backgroundColor: theme.color.primary,
				},
				false: { justifyContent: "flex-start" },
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
	thumb: {
		alignItems: "center",
		justifyContent: "center",
		width: theme.unit[12],
		height: theme.unit[12],
		borderRadius: theme.radius.full,
		backgroundColor: theme.color.outline,
		variants: {
			...fieldGroupVariants(theme),
			disabled: {
				true: { backgroundColor: theme.color.disabled.fg },
				false: {},
			},
			checked: {
				true: {
					backgroundColor: theme.color.onPrimary,
				},
				false: {},
			},
		},
		compoundVariants: [
			{
				pending: true,
				checked: false,
				styles: {
					backgroundColor: theme.color.surfaceHighest,
				},
			},
			{
				checked: true,
				disabled: true,
				styles: {
					backgroundColor: theme.color.disabled.fg,
				},
			},
		],
	},
}));

type SwitchNamespace = Readonly<{
	Track: typeof Track;
	Control: typeof Control;
}>;

/**
 * The parts of a two-state toggle: the track with its sliding thumb, and the row
 * that flips it and carries the field's name beside it. While the field is
 * `pending` the thumb holds a spinner and a press changes nothing.
 *
 * @example
 *   <Field.Root label={m.settings_notifications()} copy={fieldCopy}>
 *   	<Switch.Control
 *   		checked={enabled}
 *   		offLabel={m.switch_state_off()}
 *   		onCheckedChange={setEnabled}
 *   		onLabel={m.switch_state_on()}
 *   	/>
 *   </Field.Root>
 */
export const Switch: SwitchNamespace = { Track, Control };
