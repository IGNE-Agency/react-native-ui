import * as RadioGroupPrimitive from "@rn-primitives/radio-group";
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import {
	Text as NativeText,
	ScrollView,
	type LayoutRectangle,
} from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
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
import { AnimatedPressable } from "../../lib/motion/animated-pressable";
import {
	popIn,
	popOut,
	timing,
} from "../../lib/motion/motion";
import { Field, type FieldCopy } from "../field/field";
import {
	fieldGroup,
	fieldGroupCompounds,
	fieldGroupVariants,
} from "../field/field-shell";

type Span = Readonly<{ x: number; width: number }>;

type SegmentedControlContextValue = Readonly<{
	options: readonly Option<string>[];
	selected: string | undefined;
	select: (value: string) => void;
}>;

/** What a `SegmentedControl.Root` takes: the field's own state, plus the list it picks from. */
export type SegmentedControlRootProps<
	TValue extends string,
> = FieldState &
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

type SegmentProps = Readonly<{
	option: Option<string>;
	chosen: boolean;
	index: number;
	onMeasure: (value: string, span: Span) => void;
}>;

type IndicatorProps = Readonly<{ span: Span | undefined }>;

type ControlProps = Readonly<{ testID?: string }>;

const SegmentedControlContext = createContext<
	SegmentedControlContextValue | undefined
>(undefined);

const useSegmentedControlContext =
	(): SegmentedControlContextValue => {
		const value = useContext(SegmentedControlContext);
		if (value === undefined) {
			throw new Error(
				"A segmented control part must be rendered inside SegmentedControl.Root",
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
}: SegmentedControlRootProps<TValue>): ReactNode => {
	const chosen = options.find(
		option => option.value === value,
	);
	return (
		<SegmentedControlContext.Provider
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
		</SegmentedControlContext.Provider>
	);
};

const Indicator = ({ span }: IndicatorProps): ReactNode => {
	const { state } = Field.useControl();
	const { theme } = useUnistyles();
	styles.useVariants({ ...state, chosen: false });
	const x = useSharedValue(span?.x ?? 0);
	const width = useSharedValue(span?.width ?? 0);
	const placed = useRef(span !== undefined);

	useEffect(() => {
		if (span === undefined) {
			placed.current = false;
			return;
		}
		if (!placed.current) {
			placed.current = true;
			x.set(span.x);
			width.set(span.width);
			return;
		}
		const slide = timing(
			theme.motion.short,
			theme.motion.emphasized,
		);
		x.set(withTiming(span.x, slide));
		width.set(withTiming(span.width, slide));
	}, [span, theme, width, x]);

	const travel = useAnimatedStyle(() => ({
		transform: [{ translateX: x.get() }],
		width: width.get(),
	}));

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.slot, travel]}>
			{span === undefined ? null : (
				<Animated.View
					entering={popIn(theme.motion)}
					exiting={popOut(theme.motion)}
					style={styles.indicator}
				/>
			)}
		</Animated.View>
	);
};

const Segment = ({
	option,
	chosen,
	index,
	onMeasure,
}: SegmentProps): ReactNode => {
	const { state } = Field.useControl();
	const target = Field.useFocusTarget({
		kind: chosen ? "chosen" : "option",
		index,
		disabled: option.disabled === true,
	});
	styles.useVariants({ ...state, chosen });
	const measure = (layout: LayoutRectangle) =>
		onMeasure(option.value, {
			x: layout.x,
			width: layout.width,
		});
	return (
		<RadioGroupPrimitive.Item
			accessibilityLabel={option.label}
			asChild
			disabled={option.disabled === true}
			value={option.value}>
			<AnimatedPressable
				onLayout={event =>
					measure(event.nativeEvent.layout)
				}
				ref={target}
				style={styles.segment}
				testID={option.testID}>
				<NativeText
					aria-hidden
					numberOfLines={1}
					style={styles.segmentLabel}>
					{option.label}
				</NativeText>
			</AnimatedPressable>
		</RadioGroupPrimitive.Item>
	);
};

const Rail = ({ testID }: ControlProps): ReactNode => {
	const { options, select, selected } =
		useSegmentedControlContext();
	const { accessibility, state } = Field.useControl();
	const [spans, setSpans] = useState<
		Readonly<Record<string, Span>>
	>({});
	styles.useVariants({ ...state, chosen: false });
	return (
		<FieldControl {...accessibility}>
			<Field.Frame style={styles.box} testID={testID}>
				<RadioGroupPrimitive.Root
					asChild
					disabled={state.disabled || state.readonly}
					onValueChange={select}
					value={selected}>
					<ScrollView
						contentContainerStyle={styles.rail}
						horizontal
						showsHorizontalScrollIndicator={false}
						style={styles.scroll}>
						<Indicator
							span={
								selected === undefined
									? undefined
									: spans[selected]
							}
						/>
						{options.map((option, index) => (
							<Segment
								chosen={option.value === selected}
								index={index}
								key={option.value}
								onMeasure={(value, span) =>
									setSpans(previous =>
										previous[value]?.x === span.x &&
										previous[value]?.width === span.width
											? previous
											: { ...previous, [value]: span },
									)
								}
								option={option}
							/>
						))}
					</ScrollView>
				</RadioGroupPrimitive.Root>
				<Field.Pending />
			</Field.Frame>
		</FieldControl>
	);
};

const styles = StyleSheet.create(theme => ({
	box: {
		...fieldGroup(theme),
		alignSelf: "flex-start",
		maxWidth: "100%",
		variants: { ...fieldGroupVariants(theme) },
		compoundVariants: [...fieldGroupCompounds(theme)],
	},
	scroll: {
		flexGrow: 0,
		flexShrink: 1,
		borderRadius: theme.radius.full,
		overflow: "hidden",
	},
	rail: {
		alignItems: "stretch",
		gap: theme.unit[2],
		padding: theme.unit[2],
	},
	slot: {
		bottom: theme.unit[2],
		left: 0,
		position: "absolute",
		top: theme.unit[2],
	},
	indicator: {
		flex: 1,
		backgroundColor: theme.color.primary,
		borderRadius: theme.radius.full,
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
		},
	},
	segment: {
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
		minHeight: theme.unit[20],
		paddingHorizontal: theme.unit[6],
		borderRadius: theme.radius.full,
		variants: {
			...fieldGroupVariants(theme),
			chosen: { true: {}, false: {} },
		},
	},
	segmentLabel: {
		...theme.font.label.small,
		color: theme.color.text,
		variants: {
			...fieldGroupVariants(theme),
			disabled: {
				true: { color: theme.color.disabled.fg },
				false: {},
			},
			chosen: {
				true: {
					...theme.font.label.smallStrong,
					color: theme.color.onPrimary,
				},
				false: {},
			},
		},
		compoundVariants: [
			{
				chosen: true,
				invalid: true,
				styles: { color: theme.color.error.bg },
			},
			{
				chosen: true,
				disabled: true,
				styles: { color: theme.color.disabled.bg },
			},
		],
	},
}));

type SegmentedControlNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Field.Label;
	Description: typeof Field.Description;
	Error: typeof Field.Error;
	Control: typeof Rail;
}>;

/**
 * The parts of a segmented control, for picking exactly one of a few short
 * options side by side: an immediate switch of view or filter, or a compact form
 * field such as yes/no. Picking the chosen segment again keeps it; for an optional
 * choice, add an explicit "none" segment, and for a long list or long labels, use
 * `RadioGroup`.
 *
 * @example
 *   <SegmentedControl.Root
 *   	label={m.results_sort()}
 *   	copy={fieldCopy}
 *   	options={sortOrders}
 *   	value={sort}
 *   	onValueChange={setSort}>
 *   	<SegmentedControl.Label />
 *   	<SegmentedControl.Control />
 *   	<SegmentedControl.Error />
 *   </SegmentedControl.Root>
 */
export const SegmentedControl: SegmentedControlNamespace = {
	Root,
	Label: Field.Label,
	Description: Field.Description,
	Error: Field.Error,
	Control: Rail,
};
