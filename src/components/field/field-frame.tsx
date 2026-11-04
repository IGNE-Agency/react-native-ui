import type { ComponentProps, ReactNode } from "react";
import type { Pressable, ViewStyle } from "react-native";
import Animated from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";

import { AnimatedPressable } from "../../lib/motion/animated-pressable";
import {
	timing,
	useBorderTransition,
	useFillTransition,
} from "../../lib/motion/motion";

/** The box style a field's frame eases: a Unistyles style naming both its edges. */
export type FieldFrameStyle = ViewStyle &
	Readonly<{
		borderColor: string;
		backgroundColor: string;
	}>;

/** What a pressable frame takes on top of its paint: everything the press needs. */
export type PressableFrameHandlers = Omit<
	ComponentProps<typeof Pressable>,
	"style" | "children"
>;

type FieldFrameProps = Readonly<{
	style: FieldFrameStyle;
	testID?: string;
	children: ReactNode;
}>;

type PressableFrameProps = Readonly<{
	style: FieldFrameStyle;
	press: PressableFrameHandlers;
	children: ReactNode;
}>;

const useEdges = (style: FieldFrameStyle) => {
	const { theme } = useUnistyles();
	const config = timing(
		theme.motion.short,
		theme.motion.standard,
	);
	const border = useBorderTransition(style, config);
	const fill = useFillTransition(style, config);
	return { border, fill };
};

/**
 * A field's painted box, easing its border and its fill to whatever its variant
 * selection now names, so focus and invalid warm in rather than snapping.
 *
 * @example
 *   <FieldFrame style={styles.box}>{children}</FieldFrame>
 */
export const FieldFrame = ({
	style,
	testID,
	children,
}: FieldFrameProps): ReactNode => {
	const { border, fill } = useEdges(style);
	return (
		<Animated.View
			style={[style, border, fill]}
			testID={testID}>
			{children}
		</Animated.View>
	);
};

/**
 * The same painted box, pressable, so a press anywhere on it — including on its
 * own padding — reaches the field.
 *
 * @example
 *   <PressableFrame press={{ onPress: focusControl }} style={styles.box}>
 *   	{children}
 *   </PressableFrame>
 */
export const PressableFrame = ({
	style,
	press,
	children,
}: PressableFrameProps): ReactNode => {
	const { border, fill } = useEdges(style);
	return (
		<AnimatedPressable
			{...press}
			style={[style, border, fill]}>
			{children}
		</AnimatedPressable>
	);
};
