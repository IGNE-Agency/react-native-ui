import { useState } from "react";
import type {
	LayoutChangeEvent,
	ViewStyle,
} from "react-native";
import {
	useAnimatedStyle,
	useDerivedValue,
	type SharedValue,
} from "react-native-reanimated";

import type { AnimatedStyleOf } from "../../lib/motion/motion";
import type { SheetMotion } from "./sheet-host";

const RECEDE = 0.05;

type Upper = Readonly<{
	edge: number;
	depth: number;
	pull: number;
}>;

const OPEN: Upper = {
	edge: Number.POSITIVE_INFINITY,
	depth: 0,
	pull: 0,
};

const under = (
	upper: Upper,
	resting: number,
	pull: number,
	peek: number,
): Upper => {
	"worklet";
	return {
		edge:
			resting +
			(Math.min(resting, upper.edge - peek) - resting) *
				upper.pull,
		depth: upper.depth + upper.pull,
		pull,
	};
};

/** How far a sheet has stepped back under the sheets above it. */
export type Recession = Readonly<{
	/** How many sheets cover it, each counted by how far it has risen. */
	depth: number;
	/** How far its top edge has moved up to show above the sheet over it. */
	shift: number;
	/** How far the sheet directly over it has risen, from 0 to 1. */
	fade: number;
}>;

/** A sheet's recession, and the styles that draw it. */
export type Receding = Readonly<{
	recession: SharedValue<Recession>;
	/** The sheet's frame, narrowed about its top edge and moved up. */
	frame: AnimatedStyleOf<ViewStyle>;
	/** The shade laid over the sheet, from its top edge down. */
	shade: AnimatedStyleOf<ViewStyle>;
	/** Takes the frame's height, which the narrowing is drawn about. */
	measure: (event: LayoutChangeEvent) => void;
}>;

/**
 * How a sheet steps back while others cover it: it narrows by a twentieth for
 * each sheet over it, rises until its top edge shows `peek` above the next, and
 * shades over, all following how far those sheets have risen.
 *
 * @example
 *   const receding = useReceding(edge, above, theme.unit[6]);
 *   <Animated.View onLayout={receding.measure} style={[styles.frame, receding.frame]} />
 */
export const useReceding = (
	edge: SharedValue<number>,
	above: readonly SheetMotion[],
	peek: number,
): Receding => {
	const [height, setHeight] = useState(0);
	const downward = [...above].reverse();

	const recession = useDerivedValue((): Recession => {
		const upper = downward.reduce(
			(lower, motion) =>
				under(
					lower,
					motion.edge.get(),
					motion.pull.get(),
					peek,
				),
			OPEN,
		);
		const own = under(upper, edge.get(), 0, peek);
		return {
			depth: own.depth,
			shift: own.edge - edge.get(),
			fade: upper.pull,
		};
	});

	const frame = useAnimatedStyle(() => {
		const { depth, shift } = recession.get();
		const scale = 1 - RECEDE * depth;
		return {
			transform: [
				{
					translateY:
						(edge.get() - height / 2) * (1 - scale) + shift,
				},
				{ scale },
			],
		};
	});

	const shade = useAnimatedStyle(() => ({
		top: edge.get(),
		opacity: Math.min(recession.get().depth, 1),
	}));

	return {
		recession,
		frame,
		shade,
		measure: event =>
			setHeight(event.nativeEvent.layout.height),
	};
};
