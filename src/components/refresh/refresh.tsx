import {
	createContext,
	useContext,
	useState,
	type ReactNode,
} from "react";
import { View } from "react-native";
import {
	Gesture,
	GestureDetector,
	type LegacyComposedGesture,
} from "react-native-gesture-handler";
import Animated, {
	createAnimatedComponent,
	runOnJS,
	useAnimatedProps,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { hapticTick } from "../../lib/haptics/haptics";
import { timing } from "../../lib/motion/motion";
import { useBusyPhase } from "../../lib/wait/use-busy-phase";
import { Spinner } from "../spinner/spinner";

const UPRIGHT = 12;

const SIDEWAYS = 24;

/** How far the finger travels for one point of pull, so the pull drags behind it. */
const RESISTANCE = 2;

/** How far the indicator is pulled down before letting go asks for a refresh. */
const COMMITS_AT = 56;

/** How far the indicator can be pulled, so a long drag stops growing it. */
const STOPS_AT = 88;

/** How long the spinner holds once the pull is released, so a fast answer still reads. */
const HOLDS_FOR = 600;

const RING = 20;

const STROKE = 2;

const RADIUS = (RING - STROKE) / 2;

const ROUND = 2 * Math.PI * RADIUS;

const AnimatedCircle = createAnimatedComponent(Circle);

type Stage = "idle" | "asked" | "held";

/** The pull, spread onto the scrollable it belongs to and handed to `Refresh.Root`. */
export type Pull = Readonly<{
	gesture: LegacyComposedGesture;
	/** Whether the pull is holding the indicator open, waiting for fresh rows. */
	busy: boolean;
	/** How far the indicator is drawn down, in points. */
	travel: SharedValue<number>;
	scroll: Readonly<{
		onScroll: (event: {
			nativeEvent: { contentOffset: { y: number } };
		}) => void;
		scrollEventThrottle: number;
	}>;
}>;

type RootProps = Readonly<{
	pull: Pull;
	testID?: string;
	children: ReactNode;
}>;

type IndicatorProps = Readonly<{ testID?: string }>;

type DetectorProps = Readonly<{ children: ReactNode }>;

/**
 * The pull a scrolled column of fetched content answers with a fresh request.
 * It arms only for a drag that starts with the column already at its top, so
 * scrolling back up to it never pulls. It drags behind the finger, and asks for
 * the refresh once on release — the tick every other gesture that registers
 * gives back. Until then the indicator fills a ring by how far the pull has
 * come, because nothing is happening yet; it spins only once something is.
 *
 * @example
 *   const pull = useRefresh({ busy: list.isRefreshing, onRefresh: list.retry });
 */
export const useRefresh = ({
	busy,
	onRefresh,
}: Readonly<{
	busy: boolean;
	onRefresh: () => void;
}>): Pull => {
	const { theme } = useUnistyles();
	const travel = useSharedValue(0);
	const atTop = useSharedValue(true);
	const armed = useSharedValue(false);
	const [stage, setStage] = useState<Stage>("idle");
	const phase = useBusyPhase({
		busy: busy || stage === "asked",
		busyAfter: 0,
		busyMinDuration: HOLDS_FOR,
	});
	const holding = phase !== "fresh";
	const settle = timing(
		theme.motion.short,
		theme.motion.standard,
	);

	if (stage === "asked" && holding) {
		setStage("held");
	}

	if (stage === "held" && !holding) {
		setStage("idle");
		travel.set(withTiming(0, settle));
	}

	const commit = () => {
		hapticTick();
		setStage("asked");
		onRefresh();
	};

	// oxlint-disable-next-line react/capitalized-calls -- RNGH's gesture builder, not a component
	const pan = Gesture.Pan()
		.activeOffsetY(UPRIGHT)
		.failOffsetX([-SIDEWAYS, SIDEWAYS])
		.onBegin(() => {
			armed.set(atTop.get());
		})
		.onUpdate(event => {
			if (!armed.get() || event.translationY <= 0) {
				return;
			}
			travel.set(
				Math.min(STOPS_AT, event.translationY / RESISTANCE),
			);
		})
		.onEnd(() => {
			if (travel.get() >= COMMITS_AT) {
				travel.set(withTiming(COMMITS_AT, settle));
				runOnJS(commit)();
				return;
			}
			travel.set(withTiming(0, settle));
		});

	return {
		busy: stage === "asked" || holding,
		// oxlint-disable-next-line react/capitalized-calls -- RNGH's gesture builder, not a component
		gesture: Gesture.Simultaneous(pan, Gesture.Native()),
		scroll: {
			onScroll: event => {
				atTop.set(event.nativeEvent.contentOffset.y <= 0);
			},
			scrollEventThrottle: 16,
		},
		travel,
	};
};

const Progress = ({
	travel,
}: Readonly<{
	travel: SharedValue<number>;
}>): ReactNode => {
	const { theme } = useUnistyles();
	const arc = useAnimatedProps(() => ({
		strokeDashoffset:
			ROUND * (1 - Math.min(1, travel.get() / COMMITS_AT)),
	}));

	return (
		<Svg height={RING} width={RING}>
			<Circle
				cx={RING / 2}
				cy={RING / 2}
				fill="none"
				r={RADIUS}
				stroke={theme.color.border}
				strokeWidth={STROKE}
			/>
			<AnimatedCircle
				animatedProps={arc}
				cx={RING / 2}
				cy={RING / 2}
				fill="none"
				r={RADIUS}
				stroke={theme.color.textMuted}
				strokeDasharray={ROUND}
				strokeLinecap="round"
				strokeWidth={STROKE}
				transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
			/>
		</Svg>
	);
};

const PullContext = createContext<Pull | undefined>(
	undefined,
);

const usePull = (): Pull => {
	const pull = useContext(PullContext);
	if (pull === undefined) {
		throw new Error(
			"Refresh parts must be rendered inside Refresh.Root",
		);
	}
	return pull;
};

const Root = ({
	pull,
	testID,
	children,
}: RootProps): ReactNode => (
	<PullContext.Provider value={pull}>
		<View style={styles.frame} testID={testID}>
			{children}
		</View>
	</PullContext.Provider>
);

const Indicator = ({
	testID,
}: IndicatorProps): ReactNode => {
	const { busy, travel } = usePull();
	const indicator = useAnimatedStyle(() => {
		const reached = Math.min(1, travel.get() / COMMITS_AT);

		return {
			opacity: reached,
			transform: [
				{ translateY: travel.get() },
				{ scale: reached },
			],
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.indicator, indicator]}
			testID={testID}>
			<View style={styles.badge}>
				{busy ? (
					<Spinner.Indicator size="sm" />
				) : (
					<Progress travel={travel} />
				)}
			</View>
		</Animated.View>
	);
};

const Detector = ({
	children,
}: DetectorProps): ReactNode => {
	const pull = usePull();

	return (
		<GestureDetector gesture={pull.gesture}>
			{children}
		</GestureDetector>
	);
};

const styles = StyleSheet.create(theme => ({
	frame: { flex: 1 },
	indicator: {
		alignItems: "center",
		left: 0,
		position: "absolute",
		right: 0,
		top: -theme.unit[20],
		zIndex: 1,
	},
	badge: {
		alignItems: "center",
		backgroundColor: theme.color.surfaceOverlay,
		borderRadius: theme.radius.full,
		boxShadow: theme.elevation[1],
		height: theme.unit[20],
		justifyContent: "center",
		width: theme.unit[20],
	},
}));

type RefreshNamespace = Readonly<{
	Root: typeof Root;
	Indicator: typeof Indicator;
	Detector: typeof Detector;
}>;

/**
 * A pull-to-refresh, as parts: `Root` holds the pull from `useRefresh`,
 * `Indicator` is drawn above the scrollable, and `Detector` attaches the pull
 * to a scrollable that must be its direct child.
 *
 * @example
 *   <Refresh.Root pull={pull}>
 *   	<Refresh.Indicator />
 *   	<Refresh.Detector>
 *   		<ScrollView {...pull.scroll}>{rows}</ScrollView>
 *   	</Refresh.Detector>
 *   </Refresh.Root>
 */
export const Refresh: RefreshNamespace = {
	Root,
	Indicator,
	Detector,
};
