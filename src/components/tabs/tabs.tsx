import * as TabsPrimitive from "@rn-primitives/tabs";
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
	Pressable,
	ScrollView,
	View,
	type LayoutRectangle,
} from "react-native";
import {
	Gesture,
	GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
	runOnJS,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
	withTiming,
	type SharedValue,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { hapticTick } from "../../lib/haptics/haptics";
import { timing } from "../../lib/motion/motion";
import { StateLayer } from "../../lib/state-layer/state-layer";

/**
 * One tab in a bar, and the panel it opens. A tab is a view of the record on
 * screen rather than a value, so it carries a name and nothing else.
 */
export type Tab = Readonly<{
	value: string;
	label: string;
	testID?: string;
}>;

type Span = Readonly<{ x: number; width: number }>;

const NONE = -1;

const SIDEWAYS = 12;

const UPRIGHT = 8;

const COMMITS_PAST = 0.3;

const FLUNG_PAST = 0.6;

type Travel = Readonly<{
	tabs: readonly Tab[];
	/** Where the ink rests, as a fractional index, so a drag moves it a part of a tab. */
	ink: SharedValue<number>;
	/** How far the panels are dragged from the open one, in panel widths. */
	pan: SharedValue<number>;
	/** The tab being dragged towards, which is mounted for as long as it is. */
	toward: SharedValue<number>;
	mounted: readonly string[];
	/** How far the tabs hold their own content from the edges. */
	inset: number;
	/** Takes a released drag to the tab it landed on, or back to the one it left. */
	settle: (index: number) => void;
}>;

const TravelContext = createContext<Travel | undefined>(
	undefined,
);

const useTravel = (): Travel => {
	const value = useContext(TravelContext);

	if (value === undefined) {
		throw new Error(
			"Tabs parts must be rendered inside Tabs.Root",
		);
	}

	return value;
};

type RootProps = Readonly<{
	tabs: readonly Tab[];
	value: string;
	onValueChange: (value: string) => void;
	/**
	 * How far the tabs hold their own content from the edges. Nothing above them
	 * pays it, so the rail and the panels span the whole width they are given.
	 */
	inset?: number;
	testID?: string;
	children: ReactNode;
}>;

type BarProps = Readonly<{ testID?: string }>;

type PanelsProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type PanelProps = Readonly<{
	value: string;
	testID?: string;
	children: ReactNode;
}>;

type ItemProps = Readonly<{
	tab: Tab;
	current: boolean;
	onMeasure: (value: string, span: Span) => void;
}>;

type InkProps = Readonly<{
	spans: Readonly<Record<string, Span>>;
}>;

const indexOf = (
	tabs: readonly Tab[],
	value: string,
): number => tabs.findIndex(tab => tab.value === value);

const Root = ({
	tabs,
	value,
	onValueChange,
	inset = 0,
	testID,
	children,
}: RootProps): ReactNode => {
	const { theme } = useUnistyles();
	const open = Math.max(0, indexOf(tabs, value));
	const ink = useSharedValue(open);
	const aimed = useRef(open);
	const pan = useSharedValue(0);
	const toward = useSharedValue(NONE);
	const [beside, setBeside] = useState(NONE);
	const slide = timing(
		theme.motion.short,
		theme.motion.emphasized,
	);

	useEffect(() => {
		if (aimed.current !== open) {
			aimed.current = open;
			ink.set(open);
		}
	}, [ink, open]);

	useAnimatedReaction(
		() => toward.get(),
		(next, previous) => {
			if (previous !== null && next !== previous) {
				runOnJS(setBeside)(next);
			}
		},
	);

	const reached = beside === NONE ? open : beside;
	const mounted = tabs
		.slice(
			Math.min(open, reached),
			Math.max(open, reached) + 1,
		)
		.map(tab => tab.value);

	const settle = (next: number) => {
		const landed = tabs[next];

		if (landed === undefined) {
			return;
		}

		const kept =
			next === open
				? open + (pan.get() > 0 ? 1 : NONE)
				: open;

		toward.set(kept);
		setBeside(kept);
		pan.set(pan.get() + (open - next));
		pan.set(
			withTiming(0, slide, finished => {
				if (finished === true) {
					toward.set(NONE);
				}
			}),
		);
		aimed.current = next;
		ink.set(withTiming(next, slide));

		if (landed.value !== value) {
			hapticTick();
			onValueChange(landed.value);
		}
	};

	const tapped = (next: string) => {
		const to = indexOf(tabs, next);

		if (to >= 0) {
			settle(to);
		}
	};

	return (
		<TabsPrimitive.Root
			asChild
			onValueChange={tapped}
			value={value}>
			<View style={styles.root} testID={testID}>
				<TravelContext.Provider
					// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
					value={{
						ink,
						inset,
						mounted,
						pan,
						settle,
						tabs,
						toward,
					}}>
					{children}
				</TravelContext.Provider>
			</View>
		</TabsPrimitive.Root>
	);
};

const Ink = ({ spans }: InkProps): ReactNode => {
	const { ink, tabs } = useTravel();

	const travel = useAnimatedStyle(() => {
		const at = ink.get();
		const low = Math.floor(at);
		const from = spans[tabs[low]?.value ?? ""];
		const to = spans[tabs[Math.ceil(at)]?.value ?? ""];

		if (from === undefined || to === undefined) {
			const only = from ?? to;

			return only === undefined
				? { transform: [{ translateX: 0 }], width: 0 }
				: {
						transform: [{ translateX: only.x }],
						width: only.width,
					};
		}

		const share = at - low;

		return {
			transform: [
				{ translateX: from.x + (to.x - from.x) * share },
			],
			width: from.width + (to.width - from.width) * share,
		};
	});

	return (
		<Animated.View
			pointerEvents="none"
			style={[styles.ink, travel]}
		/>
	);
};

const Item = ({
	tab,
	current,
	onMeasure,
}: ItemProps): ReactNode => {
	const [pressed, setPressed] = useState(false);
	const { theme } = useUnistyles();
	styles.useVariants({ current });
	const measure = (layout: LayoutRectangle) =>
		onMeasure(tab.value, {
			width: layout.width,
			x: layout.x,
		});
	return (
		<TabsPrimitive.Trigger
			accessibilityLabel={tab.label}
			asChild
			value={tab.value}>
			<Pressable
				onLayout={event =>
					measure(event.nativeEvent.layout)
				}
				onPressIn={() => setPressed(true)}
				onPressOut={() => setPressed(false)}
				style={styles.item}
				testID={tab.testID}>
				<StateLayer
					color={
						current
							? theme.color.text
							: theme.color.textMuted
					}
					pressed={pressed}
				/>
				<NativeText
					aria-hidden
					numberOfLines={1}
					style={styles.itemLabel}>
					{tab.label}
				</NativeText>
			</Pressable>
		</TabsPrimitive.Trigger>
	);
};

const Bar = ({ testID }: BarProps): ReactNode => {
	const { inset, tabs } = useTravel();
	const { value } = TabsPrimitive.useRootContext();
	const [spans, setSpans] = useState<
		Readonly<Record<string, Span>>
	>({});
	return (
		<TabsPrimitive.List asChild>
			<ScrollView
				contentContainerStyle={styles.rail(inset)}
				horizontal
				showsHorizontalScrollIndicator={false}
				style={styles.scroll}
				testID={testID}>
				{tabs.map(tab => (
					<Item
						current={tab.value === value}
						key={tab.value}
						onMeasure={(measured, span) =>
							setSpans(previous =>
								previous[measured]?.x === span.x &&
								previous[measured]?.width === span.width
									? previous
									: { ...previous, [measured]: span },
							)
						}
						tab={tab}
					/>
				))}
				<Ink spans={spans} />
			</ScrollView>
		</TabsPrimitive.List>
	);
};

const Panels = ({
	testID,
	children,
}: PanelsProps): ReactNode => {
	const { pan, ink, tabs, toward, settle } = useTravel();
	const { value } = TabsPrimitive.useRootContext();
	const open = Math.max(0, indexOf(tabs, value));
	const last = tabs.length - 1;
	const room = useSharedValue(0);

	// oxlint-disable-next-line react/capitalized-calls -- RNGH's gesture builder, not a component
	const swipe = Gesture.Pan()
		.activeOffsetX([-SIDEWAYS, SIDEWAYS])
		.failOffsetY([-UPRIGHT, UPRIGHT])
		.onUpdate(event => {
			if (room.get() <= 0) {
				return;
			}
			const asked = -event.translationX / room.get();
			const reach = Math.max(-1, Math.min(1, asked));
			const held = Math.max(
				-open,
				Math.min(last - open, reach),
			);

			pan.set(held);
			ink.set(open + held);
			toward.set(
				held === 0 ? NONE : open + (held > 0 ? 1 : NONE),
			);
		})
		.onEnd(event => {
			const held = pan.get();

			if (held === 0) {
				return;
			}

			const fling =
				room.get() <= 0 ? 0 : -event.velocityX / room.get();
			const step = held > 0 ? 1 : NONE;
			const goes =
				Math.abs(held) > COMMITS_PAST ||
				(Math.abs(fling) > FLUNG_PAST &&
					Math.sign(fling) === step);

			runOnJS(settle)(
				goes
					? Math.max(0, Math.min(last, open + step))
					: open,
			);
		});

	const travel = useAnimatedStyle(() => ({
		transform: [
			{ translateX: -(open + pan.get()) * room.get() },
		],
	}));

	return (
		<GestureDetector gesture={swipe}>
			<View
				onLayout={event => {
					room.set(event.nativeEvent.layout.width);
				}}
				style={styles.viewport}
				testID={testID}>
				<Animated.View style={[styles.row, travel]}>
					{children}
				</Animated.View>
			</View>
		</GestureDetector>
	);
};

const Panel = ({
	value,
	testID,
	children,
}: PanelProps): ReactNode => {
	const { mounted, inset } = useTravel();
	const open =
		TabsPrimitive.useRootContext().value === value;

	return (
		<View style={styles.slot(inset)} testID={testID}>
			{mounted.includes(value) ? (
				<TabsPrimitive.Content
					aria-hidden={!open}
					asChild
					forceMount
					value={value}>
					<View
						accessibilityElementsHidden={!open}
						importantForAccessibility={
							open ? "auto" : "no-hide-descendants"
						}
						style={styles.panel}>
						{children}
					</View>
				</TabsPrimitive.Content>
			) : null}
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	root: { flexGrow: 1, gap: theme.unit[6] },
	scroll: { flexGrow: 0 },
	rail: (inset: number) => ({
		alignItems: "stretch",
		borderBottomColor: theme.color.border,
		borderBottomWidth: StyleSheet.hairlineWidth,
		flexGrow: 1,
		paddingHorizontal: inset,
		position: "relative",
	}),
	ink: {
		backgroundColor: theme.color.primary,
		borderRadius: theme.radius.full,
		bottom: 0,
		height: theme.unit[2],
		left: 0,
		position: "absolute",
	},
	viewport: { flexGrow: 1, overflow: "hidden" },
	row: {
		alignItems: "stretch",
		flexDirection: "row",
		flexGrow: 1,
		width: "100%",
	},
	slot: (inset: number) => ({
		flexBasis: "100%",
		flexGrow: 0,
		flexShrink: 0,
		paddingHorizontal: inset,
	}),
	panel: { flexGrow: 1, gap: theme.unit[6] },
	item: {
		alignItems: "center",
		borderRadius: theme.radius.sm,
		flexShrink: 0,
		justifyContent: "center",
		minHeight: theme.unit[22],
		overflow: "hidden",
		paddingHorizontal: theme.unit[8],
		variants: {
			current: { true: {}, false: {} },
		},
	},
	itemLabel: {
		...theme.font.label.medium,
		color: theme.color.textMuted,
		variants: {
			current: {
				true: { color: theme.color.text },
				false: {},
			},
		},
	},
}));

type TabsNamespace = Readonly<{
	Root: typeof Root;
	Bar: typeof Bar;
	Panels: typeof Panels;
	Panel: typeof Panel;
}>;

/**
 * One set of panels behind a bar of tabs, with an ink bar resting on the bar's
 * baseline under whichever tab is open. `Bar` spans the width it is given and
 * scrolls along its own axis once the tabs outrun it.
 *
 * The tabs span the whole width they are given and hold their own content at
 * `inset`, so a page must not pad around them. A panel then travels in from the
 * edge of what the reader can see rather than out of a box clipped short of it,
 * and two panels are parted by a gap rather than meeting flush.
 *
 * `Panels` is a swipeable row: a sideways drag moves the open panel and brings
 * its neighbour in beside it, and the ink follows the drag rather than waiting
 * for it to be let go of. A tap travels the same way a released drag does, so a
 * tab two along slides past the one between rather than cutting to it. Only the
 * panels between where the row is and where it is going are mounted, so a panel's
 * work does not start until it is reached. The drag activates sideways and fails
 * upright, so a drawer's own drag and a scroll each keep their axis.
 *
 * The panels take whatever height they are given and never less than what is
 * mounted in them, so a column shorter than the space left over still fills it
 * and the drag can be started anywhere under the bar rather than on the content
 * alone. Giving them that space is the caller's part: a scrolled parent has to
 * let its content grow to the height it scrolls through. A panel can instead
 * hold its own scroll view, which keeps the bar in place above it.
 *
 * @example
 *   <Tabs.Root tabs={tabs} value={tab} onValueChange={setTab}>
 *   	<Tabs.Bar />
 *   	<Tabs.Panels>
 *   		<Tabs.Panel value="details">{facts}</Tabs.Panel>
 *   	</Tabs.Panels>
 *   </Tabs.Root>
 */
export const Tabs: TabsNamespace = {
	Root,
	Bar,
	Panels,
	Panel,
};
