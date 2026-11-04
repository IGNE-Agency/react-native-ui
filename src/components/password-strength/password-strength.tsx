import CheckIcon from "@material-design-icons/svg/outlined/check.svg";
import * as ProgressPrimitive from "@rn-primitives/progress";
import type { ReactNode } from "react";
import { Text as NativeText, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	withDelay,
	withTiming,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import {
	popIn,
	popOut,
	timing,
	useFillTransition,
} from "../../lib/motion/motion";
import type { PasswordRating } from "../../lib/password-strength/use-password-score";
import { Icon } from "../icon/icon";

/**
 * The words a strength meter is announced and captioned with: its own name, what
 * it reads with nothing typed, and one word for each rating from lowest to
 * highest.
 *
 * @example
 *   const strengthCopy: PasswordStrengthCopy = {
 *   	label: m.password_strength_label(),
 *   	none: m.password_strength_none(),
 *   	veryWeak: m.password_strength_very_weak(),
 *   	weak: m.password_strength_weak(),
 *   	fair: m.password_strength_fair(),
 *   	strong: m.password_strength_strong(),
 *   	veryStrong: m.password_strength_very_strong(),
 *   };
 */
export type PasswordStrengthCopy = Readonly<{
	/** What the meter is announced as, such as "Password strength". */
	label: string;
	/** What the meter reads while the password is empty. */
	none: string;
	veryWeak: string;
	weak: string;
	fair: string;
	strong: string;
	veryStrong: string;
}>;

const RATINGS = [
	"veryWeak",
	"weak",
	"fair",
	"strong",
	"veryStrong",
] as const;

const SEGMENTS = [0, 1, 2, 3, 4] as const;

type SegmentProps = Readonly<{
	best: boolean;
	filled: boolean;
	/** Where the segment sits in the run, which is what it waits its turn by. */
	index: number;
}>;

type RootProps = Readonly<{
	rating?: PasswordRating;
	copy: PasswordStrengthCopy;
	testID?: string;
}>;

const Mark = (): ReactNode => {
	const { theme } = useUnistyles();
	return (
		<Animated.View
			entering={popIn(theme.motion)}
			exiting={popOut(theme.motion)}>
			<Icon.Root
				color={theme.color.primary}
				size="sm"
				svg={CheckIcon}
			/>
		</Animated.View>
	);
};

const Segment = ({
	best,
	filled,
	index,
}: SegmentProps): ReactNode => {
	const { theme } = useUnistyles();
	styles.useVariants({ best });
	const config = timing(
		theme.motion.short,
		theme.motion.emphasized,
	);
	const step = theme.motion.short / SEGMENTS.length;
	const turn = filled ? index : SEGMENTS.length - 1 - index;
	const fill = useFillTransition(styles.fill, config);
	const grow = useAnimatedStyle(() => ({
		transform: [
			{
				scaleX: withDelay(
					turn * step,
					withTiming(filled ? 1 : 0, config),
				),
			},
		],
	}));

	return (
		<View style={styles.segment}>
			<Animated.View style={[styles.fill, fill, grow]} />
		</View>
	);
};

const Root = ({
	rating,
	copy,
	testID,
}: RootProps): ReactNode => {
	const filled =
		rating === undefined ? 0 : rating.score + 1;
	const best = filled === SEGMENTS.length;
	const reason = rating?.warning ?? rating?.suggestions[0];
	const message =
		reason ??
		(rating === undefined
			? undefined
			: copy[RATINGS[rating.score]]);

	return (
		<View style={styles.meter} testID={testID}>
			<View style={styles.stage}>
				<ProgressPrimitive.Root
					accessibilityLabel={copy.label}
					asChild
					getValueLabel={() =>
						rating === undefined
							? copy.none
							: copy[RATINGS[rating.score]]
					}
					max={SEGMENTS.length}
					value={filled}>
					<View style={styles.track}>
						{SEGMENTS.map(index => (
							<Segment
								best={best}
								filled={filled > index}
								index={index}
								key={index}
							/>
						))}
					</View>
				</ProgressPrimitive.Root>
			</View>
			{message === undefined ? null : (
				<View style={styles.message}>
					{best ? <Mark /> : null}
					<NativeText
						aria-hidden={reason === undefined}
						style={styles.messageText}>
						{message}
					</NativeText>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	meter: { gap: theme.unit[2], overflow: "visible" },
	stage: {
		justifyContent: "center",
		overflow: "visible",
	},
	track: {
		flexDirection: "row",
		gap: theme.unit[2],
	},
	message: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[2],
	},
	messageText: {
		...theme.font.body.small,
		color: theme.color.textMuted,
	},
	segment: {
		backgroundColor: theme.color.surfaceHighest,
		borderRadius: theme.radius.full,
		flex: 1,
		height: theme.unit[4],
		overflow: "hidden",
	},
	fill: {
		borderRadius: theme.radius.full,
		bottom: 0,
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
		transformOrigin: "left",
		backgroundColor: theme.color.outline,
		variants: {
			best: {
				true: {
					backgroundColor: theme.color.primary,
				},
				false: {
					backgroundColor: theme.color.outline,
				},
			},
		},
	},
}));

type PasswordStrengthNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * A meter for how strong a password is: one segment per rating zxcvbn gives, so
 * its lowest lights one and only its highest fills the bar. Segments take their
 * turn left to right as it rises and give it back right to left as it falls.
 * Under the bar stands whatever the library has to say about the password, or
 * the rating in words where it has nothing. Only a full bar is coloured, and it
 * is met with a check mark.
 *
 * @example
 *   <PasswordStrength.Root rating={rating} copy={strengthCopy} />
 */
export const PasswordStrength: PasswordStrengthNamespace = {
	Root,
};
