import type { ViewStyle } from "react-native";
import {
	Easing,
	LinearTransition,
	useAnimatedStyle,
	withTiming,
	ZoomIn,
	ZoomOut,
	type EntryAnimationsValues,
	type ExitAnimationsValues,
	type LayoutAnimation,
	type SharedValue,
	type WithTimingConfig,
} from "react-native-reanimated";
import { useAnimatedVariantColor } from "react-native-unistyles/reanimated";

import type { CubicBezier, SysTheme } from "../../theme";

/** An easing token, as the four control points its curve is drawn from. */
export type EasingPoints = CubicBezier;

/** The durations and easings layer 2 publishes. */
export type Motion = SysTheme["motion"];

/** What `useAnimatedStyle` hands back for a style of this shape. */
export type AnimatedStyleOf<TStyle extends ViewStyle> =
	ReturnType<typeof useAnimatedStyle<TStyle>>;

type FillStyle = Readonly<{ backgroundColor: string }>;

type BorderStyle = Readonly<{ borderColor: string }>;

/**
 * The timing a duration token and an easing token name together.
 *
 * @example
 *   withTiming(1, timing(theme.motion.short, theme.motion.overshoot));
 */
export const timing = (
	duration: number,
	easing: EasingPoints,
): WithTimingConfig => ({
	duration,
	easing: Easing.bezier(...easing),
});

/**
 * The pop a small mark arrives with: it passes its end value and settles back,
 * which reads as appearing rather than as growing.
 *
 * @example
 *   <Animated.View entering={popIn(theme.motion)} exiting={popOut(theme.motion)} />;
 */
export const popIn = (motion: Motion): ZoomIn =>
	ZoomIn.duration(motion.short).easing(
		Easing.bezier(...motion.overshoot),
	);

/**
 * The way a small mark leaves: shorter than it arrived, and without the pop.
 *
 * @example
 *   <Animated.View exiting={popOut(theme.motion)} />;
 */
export const popOut = (motion: Motion): ZoomOut =>
	ZoomOut.duration(motion.instant).easing(
		Easing.bezier(...motion.accelerate),
	);

/**
 * The travel a node makes when its own layout moves it, for a thumb sliding
 * across its track or a mark stepping along a rail.
 *
 * @example
 *   <Animated.View layout={travel(theme.motion)} />;
 */
export const travel = (motion: Motion): LinearTransition =>
	LinearTransition.duration(motion.short).easing(
		Easing.bezier(...motion.emphasized),
	);

/**
 * The way a page steps in when its content moves sideways, as a month does: in
 * across its own width from the side `heading` names, `1` for the right and `-1`
 * for the left.
 *
 * @example
 *   <Animated.View key={month} entering={slideIn(theme.motion, heading)} />;
 */
export const slideIn = (
	motion: Motion,
	heading: SharedValue<number>,
): ((values: EntryAnimationsValues) => LayoutAnimation) => {
	const config = timing(motion.medium, motion.emphasized);
	return (values: EntryAnimationsValues) => {
		"worklet";
		return {
			initialValues: {
				transform: [
					{
						translateX: heading.get() * values.targetWidth,
					},
				],
			},
			animations: {
				transform: [{ translateX: withTiming(0, config) }],
			},
		};
	};
};

/**
 * The way a page steps out as the next one slides in: across its own width,
 * away from the side `heading` names.
 *
 * @example
 *   <Animated.View key={month} exiting={slideOut(theme.motion, heading)} />;
 */
export const slideOut = (
	motion: Motion,
	heading: SharedValue<number>,
): ((values: ExitAnimationsValues) => LayoutAnimation) => {
	const config = timing(motion.medium, motion.emphasized);
	return (values: ExitAnimationsValues) => {
		"worklet";
		return {
			initialValues: { transform: [{ translateX: 0 }] },
			animations: {
				transform: [
					{
						translateX: withTiming(
							-heading.get() * values.currentWidth,
							config,
						),
					},
				],
			},
		};
	};
};

/**
 * The fill a variant style now names, eased to. The colour stays in the variant
 * table, so nothing about it is decided in the render body.
 *
 * @example
 *   const fill = useFillTransition(styles.track, config);
 *   <Animated.View style={[styles.track, fill]} />;
 */
export const useFillTransition = (
	style: Readonly<{ backgroundColor: string }>,
	config: WithTimingConfig,
): AnimatedStyleOf<FillStyle> => {
	const color = useAnimatedVariantColor(
		style,
		"backgroundColor",
	);
	return useAnimatedStyle(() => ({
		backgroundColor: withTiming(color.get(), config),
	}));
};

/**
 * The border a variant style now names, eased to, so a frame warms to the focus
 * ring instead of snapping to it.
 *
 * @example
 *   const edge = useBorderTransition(styles.box, config);
 *   <Animated.View style={[styles.box, edge]} />;
 */
export const useBorderTransition = (
	style: Readonly<{ borderColor: string }>,
	config: WithTimingConfig,
): AnimatedStyleOf<BorderStyle> => {
	const color = useAnimatedVariantColor(
		style,
		"borderColor",
	);
	return useAnimatedStyle(() => ({
		borderColor: withTiming(color.get(), config),
	}));
};
