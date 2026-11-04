import {
	createContext,
	useContext,
	useLayoutEffect,
	useState,
	type ReactNode,
} from "react";
import {
	Text as NativeText,
	PixelRatio,
	Platform,
	View,
} from "react-native";
import {
	Gesture,
	GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
	cancelAnimation,
	Extrapolation,
	interpolate,
	ReduceMotion,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withDecay,
	withSpring,
	type SharedValue,
	type WithSpringConfig,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";
import { scheduleOnRN } from "react-native-worklets";

import { hapticTick } from "../../lib/haptics/haptics";
import {
	tonePaint,
	type ToneName,
} from "../../lib/tone/tone";
import { useSheetGestures } from "../sheet/sheet";

/** A short text drawn inline after a row's label, in a tone when it is given one. */
export type WheelAnnotation = Readonly<{
	text: string;
	tone?: ToneName;
}>;

/** One row of a wheel: what it shows, its inline annotations, and a `detail` only the screen reader says. */
export type WheelItem = Readonly<{
	key: string;
	label: string;
	annotations?: readonly WheelAnnotation[];
	detail?: string;
	testID?: string;
}>;

/** What a `Wheel.Root` takes: the rows, the chosen row's key, and the words of the adjustable node. */
export type WheelProps = Readonly<{
	items: readonly WheelItem[];
	value: string;
	onChange: (key: string) => void;
	accessibilityLabel: string;
	/** The name Android gives the step to the next row, such as "Next". */
	incrementLabel: string;
	/** The name Android gives the step to the previous row, such as "Previous". */
	decrementLabel: string;
}>;

type RootProps = WheelProps &
	Readonly<{ testID?: string; children: ReactNode }>;

type BandProps = Readonly<{ testID?: string }>;

type DrumPartProps = Readonly<{
	/** What shows past the first row when the drum is pulled beyond it. */
	before?: string;
	/** What shows past the last row when the drum is pulled beyond it. */
	after?: string;
	testID?: string;
	/** Draws one row's content. Without it, each is the row's label and annotations. */
	children?: (item: WheelItem) => ReactNode;
}>;

type RowPartProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type RowLabelProps = Readonly<{
	testID?: string;
	children: string;
}>;

type RowTextProps = Readonly<{
	tone?: ToneName;
	testID?: string;
	children: string;
}>;

type WheelContextValue = Readonly<{
	items: readonly WheelItem[];
	anchor: number;
	high: number;
	low: number;
	height: number;
	offset: SharedValue<number>;
	pan: ReturnType<typeof Gesture.Pan>;
}>;

const WheelContext = createContext<
	WheelContextValue | undefined
>(undefined);

const useWheel = (): WheelContextValue => {
	const value = useContext(WheelContext);
	if (value === undefined) {
		throw new Error(
			"Wheel parts must be rendered inside Wheel.Root",
		);
	}
	return value;
};

type Direction = 1 | -1;

const VISIBLE_ROWS = 5;

const CENTRE_ROW = Math.floor(VISIBLE_ROWS / 2);

const FADED_AT = CENTRE_ROW + 1;

const TILT_PER_ROW = 20;

const DEPTH_IN_ROWS = 6;

const PULL_RESISTANCE = 0.55;

const OVERSHOOT_ROWS = 0.75;

const EDGE_STIFFNESS = 600;

const EDGE_SPRING = {
	stiffness: EDGE_STIFFNESS,
	damping: 2 * Math.sqrt(EDGE_STIFFNESS),
	mass: 1,
} as const;

const EDGE_REACH = Math.sqrt(EDGE_STIFFNESS) * Math.E;

const WINDOW_STEP_ROWS = 3;

const WINDOW_REACH_ROWS = 20;

const DECELERATION = 0.998;

const UPRIGHT_SLOP = 4;

const SIDEWAYS_SLOP = 8;

const resist = (over: number, room: number): number => {
	"worklet";
	return (
		(1 - 1 / ((over * PULL_RESISTANCE) / room + 1)) * room
	);
};

const held = (
	asked: number,
	low: number,
	high: number,
	room: number,
): number => {
	"worklet";
	if (asked < low) {
		return low - resist(low - asked, room);
	}
	if (asked > high) {
		return high + resist(asked - high, room);
	}
	return asked;
};

const nearestRow = (
	at: number,
	count: number,
): number | undefined => {
	"worklet";
	return count === 0
		? undefined
		: Math.min(count - 1, Math.max(0, Math.round(at)));
};

const TILT_RADIANS = (TILT_PER_ROW * Math.PI) / 180;

const DRUM_RADIUS_IN_ROWS =
	1 / (2 * Math.sin(TILT_RADIANS / 2));

const drum = (distance: number, height: number) => {
	"worklet";
	const reach = Math.max(
		-FADED_AT,
		Math.min(FADED_AT, distance),
	);
	const depth =
		DRUM_RADIUS_IN_ROWS *
		(1 - Math.cos(reach * TILT_RADIANS));
	const recede = DEPTH_IN_ROWS / (DEPTH_IN_ROWS + depth);
	return {
		opacity: interpolate(
			Math.abs(distance),
			[0, FADED_AT],
			[1, 0],
			Extrapolation.CLAMP,
		),
		transform: [
			{ perspective: height * DEPTH_IN_ROWS },
			{ translateY: distance * height },
			{ scale: recede },
			{ rotateX: `${-reach * TILT_PER_ROW}deg` },
		],
	};
};

const spokenOf = (
	item: WheelItem | undefined,
): string | undefined => {
	if (item === undefined) {
		return undefined;
	}
	return [
		item.label,
		...(item.annotations ?? []).map(
			annotation => annotation.text,
		),
		item.detail,
	]
		.filter(part => part !== undefined)
		.join(", ");
};

const isMounted = (
	index: number,
	centre: number,
	anchor: number,
): boolean =>
	Math.abs(index - centre) <= WINDOW_REACH_ROWS ||
	Math.abs(index - anchor) <= FADED_AT;

const RowLabel = ({
	testID,
	children,
}: RowLabelProps): ReactNode => (
	<NativeText style={styles.label} testID={testID}>
		{children}
	</NativeText>
);

const RowText = ({
	tone,
	testID,
	children,
}: RowTextProps): ReactNode => (
	<View style={styles.annotation} testID={testID}>
		<NativeText
			numberOfLines={1}
			style={[
				styles.caption,
				tone === undefined ? null : styles.toned(tone),
			]}>
			· {children}
		</NativeText>
	</View>
);

const Row = ({
	testID,
	children,
}: RowPartProps): ReactNode => (
	<View style={styles.rowContent} testID={testID}>
		{children}
	</View>
);

const DefaultRow = ({
	item,
}: Readonly<{ item: WheelItem }>): ReactNode => (
	<Row testID={item.testID}>
		<RowLabel>{item.label}</RowLabel>
		{(item.annotations ?? []).map(annotation => (
			<RowText key={annotation.text} tone={annotation.tone}>
				{annotation.text}
			</RowText>
		))}
	</Row>
);

type CellProps = Readonly<{
	index: number;
	offset: SharedValue<number>;
	height: number;
	children: ReactNode;
}>;

const Cell = ({
	index,
	offset,
	height,
	children,
}: CellProps): ReactNode => {
	const place = useAnimatedStyle(() =>
		drum(index - offset.get() / height, height),
	);
	return (
		<Animated.View style={[styles.cell(height), place]}>
			{children}
		</Animated.View>
	);
};

type RowsProps = Readonly<{
	items: readonly WheelItem[];
	anchor: number;
	offset: SharedValue<number>;
	height: number;
	render: (item: WheelItem) => ReactNode;
}>;

const Rows = ({
	items,
	anchor,
	offset,
	height,
	render,
}: RowsProps): ReactNode => {
	const [centre, setCentre] = useState(anchor);
	const reported = useSharedValue(anchor);

	useAnimatedReaction(
		() => Math.round(offset.get() / height),
		row => {
			if (
				Math.abs(row - reported.get()) >= WINDOW_STEP_ROWS
			) {
				reported.set(row);
				scheduleOnRN(setCentre, row);
			}
		},
	);

	return (
		<>
			{items.map((item, index) =>
				isMounted(index, centre, anchor) ? (
					<Cell
						height={height}
						index={index}
						// oxlint-disable-next-line react/no-array-index-key -- a row is its position on the drum
						key={index}
						offset={offset}>
						{render(item)}
					</Cell>
				) : null,
			)}
		</>
	);
};

type EdgeProps = Readonly<{
	text: string;
	index: number;
	limit: number;
	side: Direction;
	offset: SharedValue<number>;
	height: number;
}>;

const Edge = ({
	text,
	index,
	limit,
	side,
	offset,
	height,
}: EdgeProps): ReactNode => {
	const place = useAnimatedStyle(() => {
		const shown = interpolate(
			side * (offset.get() - limit),
			[0, height / 2],
			[0, 1],
			Extrapolation.CLAMP,
		);
		const at = drum(index - offset.get() / height, height);
		return { ...at, opacity: at.opacity * shown };
	});
	return (
		<Animated.View style={[styles.cell(height), place]}>
			<Row>
				<NativeText
					numberOfLines={1}
					style={styles.caption}>
					{text}
				</NativeText>
			</Row>
		</Animated.View>
	);
};

type DrumProps = Readonly<{
	items: readonly WheelItem[];
	value: string;
	onChange: (key: string) => void;
	height: number;
	room: number;
}>;

const useDrum = ({
	items,
	value,
	onChange,
	height,
	room,
}: DrumProps) => {
	const { theme } = useUnistyles();
	const count = items.length;
	const sheetGestures = useSheetGestures();
	const found = items.findIndex(item => item.key === value);
	const anchor = Math.max(0, found);
	const low = 0;
	const high = Math.max(0, count - 1) * height;
	const offset = useSharedValue(anchor * height);
	const start = useSharedValue(0);
	const moving = useSharedValue(false);
	const [settles, setSettles] = useState(0);
	const spring: WithSpringConfig = {
		duration: theme.motion.medium,
		dampingRatio: 1,
		reduceMotion: ReduceMotion.System,
	};

	useLayoutEffect(() => {
		moving.set(false);
		offset.set(anchor * height);
		// oxlint-disable-next-line react/exhaustive-effect-dependencies -- `settles` re-seats the drum after every commit, even one onto the value it already shows
	}, [anchor, height, moving, offset, settles]);

	useAnimatedReaction(
		() => Math.round(offset.get() / height),
		(row, previous) => {
			if (
				previous !== null &&
				row !== previous &&
				moving.get() &&
				row >= 0 &&
				row < count
			) {
				scheduleOnRN(hapticTick);
			}
		},
	);

	const commit = (index: number) => {
		const item = items[index];
		if (item === undefined || item.key === value) {
			return;
		}
		onChange(item.key);
		setSettles(settled => settled + 1);
	};

	const step = (direction: Direction) => {
		const item = items[anchor + direction];
		if (item !== undefined) {
			onChange(item.key);
		}
	};

	const land = () => {
		"worklet";
		const stop = nearestRow(offset.get() / height, count);
		if (stop === undefined) {
			moving.set(false);
			return;
		}
		offset.set(
			withSpring(stop * height, spring, finished => {
				if (finished === true) {
					moving.set(false);
					scheduleOnRN(commit, stop);
				}
			}),
		);
	};

	const bounce = (side: Direction, speed: number) => {
		"worklet";
		offset.set(
			withSpring(
				side === 1 ? high : low,
				{
					...EDGE_SPRING,
					velocity:
						side *
						Math.min(
							Math.abs(speed),
							height * OVERSHOOT_ROWS * EDGE_REACH,
						),
					reduceMotion: ReduceMotion.System,
				},
				finished => {
					if (finished === true) {
						land();
					}
				},
			),
		);
	};

	const release = (velocity: number) => {
		"worklet";
		if (offset.get() < low || offset.get() > high) {
			land();
			return;
		}
		offset.set(
			withDecay(
				{
					velocity,
					deceleration: DECELERATION,
					clamp: [low, high],
					reduceMotion: ReduceMotion.System,
				},
				finished => {
					if (finished !== true) {
						return;
					}
					if (velocity > 0 && offset.get() >= high) {
						bounce(1, velocity);
						return;
					}
					if (velocity < 0 && offset.get() <= low) {
						bounce(-1, velocity);
						return;
					}
					land();
				},
			),
		);
	};

	// oxlint-disable-next-line react/capitalized-calls -- RNGH's gesture builder, not a component
	const pan = Gesture.Pan()
		.activeOffsetY([-UPRIGHT_SLOP, UPRIGHT_SLOP])
		.failOffsetX([-SIDEWAYS_SLOP, SIDEWAYS_SLOP])
		.blocksExternalGesture(...sheetGestures)
		.onBegin(() => {
			cancelAnimation(offset);
		})
		.onStart(event => {
			start.set(offset.get() + event.translationY);
			moving.set(true);
		})
		.onUpdate(event => {
			offset.set(
				held(
					start.get() - event.translationY,
					low,
					high,
					room,
				),
			);
		})
		.onFinalize(event => {
			release(moving.get() ? -event.velocityY : 0);
		});

	return { anchor, high, low, offset, pan, step };
};

const Root = ({
	items,
	value,
	onChange,
	accessibilityLabel,
	incrementLabel,
	decrementLabel,
	testID,
	children,
}: RootProps): ReactNode => {
	const { theme } = useUnistyles();
	const height = PixelRatio.roundToNearestPixel(
		theme.unit[22],
	);
	const room = height * VISIBLE_ROWS;
	const { anchor, high, low, offset, pan, step } = useDrum({
		items,
		value,
		onChange,
		height,
		room,
	});

	return (
		<WheelContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{
				items,
				anchor,
				high,
				low,
				height,
				offset,
				pan,
			}}>
			<View
				accessibilityActions={Platform.select({
					android: [
						{
							name: "increment",
							label: incrementLabel,
						},
						{
							name: "decrement",
							label: decrementLabel,
						},
					],
					default: undefined,
				})}
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="adjustable"
				accessibilityValue={{
					text: spokenOf(items[anchor]),
				}}
				accessible
				onAccessibilityAction={event => {
					if (
						event.nativeEvent.actionName === "increment"
					) {
						step(1);
					}
					if (
						event.nativeEvent.actionName === "decrement"
					) {
						step(-1);
					}
				}}
				style={styles.root(room)}
				testID={testID}>
				{children}
			</View>
		</WheelContext.Provider>
	);
};

const Band = ({ testID }: BandProps): ReactNode => {
	const { height } = useWheel();
	return (
		<View
			pointerEvents="none"
			style={styles.band(height)}
			testID={testID}
		/>
	);
};

const Drum = ({
	before,
	after,
	testID,
	children,
}: DrumPartProps): ReactNode => {
	const { items, anchor, high, low, height, offset, pan } =
		useWheel();
	return (
		<GestureDetector gesture={pan}>
			<View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={styles.drum}
				testID={testID}>
				{before === undefined ? null : (
					<Edge
						height={height}
						index={-1}
						limit={low}
						offset={offset}
						side={-1}
						text={before}
					/>
				)}
				<Rows
					anchor={anchor}
					height={height}
					items={items}
					offset={offset}
					render={
						children ?? (item => <DefaultRow item={item} />)
					}
				/>
				{after === undefined ? null : (
					<Edge
						height={height}
						index={items.length}
						limit={high}
						offset={offset}
						side={1}
						text={after}
					/>
				)}
			</View>
		</GestureDetector>
	);
};

const styles = StyleSheet.create(theme => ({
	root: (room: number) => ({
		height: room,
		overflow: "hidden",
	}),
	band: (height: number) => ({
		position: "absolute",
		top: height * CENTRE_ROW,
		left: 0,
		right: 0,
		height,
		borderRadius: theme.radius.md,
		backgroundColor: theme.color.surfaceHighest,
	}),
	drum: { flex: 1 },
	cell: (height: number) => ({
		position: "absolute",
		top: height * CENTRE_ROW,
		left: 0,
		right: 0,
		height,
	}),
	rowContent: {
		alignItems: "center",
		flex: 1,
		flexDirection: "row",
		gap: theme.unit[2],
		paddingHorizontal: theme.unit[6],
	},
	label: {
		...theme.font.label.medium,
		color: theme.color.text,
	},
	annotation: { flexShrink: 1 },
	caption: {
		...theme.font.body.small,
		color: theme.color.textMuted,
	},
	toned: (tone: ToneName) => ({
		color: tonePaint(theme.color, tone).fg,
	}),
}));

type WheelNamespace = Readonly<{
	Root: typeof Root;
	Band: typeof Band;
	Drum: typeof Drum;
	Row: typeof Row;
	RowLabel: typeof RowLabel;
	RowText: typeof RowText;
}>;

/**
 * A drum of values that settles on any of its rows, as parts. `Root` is the one
 * adjustable node a screen reader steps through; `Band` marks the centre row,
 * and `Drum` turns the rows, each drawn as a `Row` of its `RowLabel` and
 * `RowText` annotations unless it is given its own.
 *
 * @example
 *   <Wheel.Root
 *   	items={items}
 *   	value={key}
 *   	onChange={setKey}
 *   	accessibilityLabel={m.start_time()}
 *   	incrementLabel={m.wheel_increment()}
 *   	decrementLabel={m.wheel_decrement()}>
 *   	<Wheel.Band />
 *   	<Wheel.Drum />
 *   </Wheel.Root>
 */
export const Wheel: WheelNamespace = {
	Root,
	Band,
	Drum,
	Row,
	RowLabel,
	RowText,
};
