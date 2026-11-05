import BottomSheet, {
	BottomSheetBackdrop,
	type BottomSheetBackdropProps,
	type BottomSheetBackgroundProps,
	BottomSheetDraggableContext,
	BottomSheetScrollableGestureContext,
	BottomSheetScrollView,
	useBottomSheetInternal,
} from "@gorhom/bottom-sheet";
import ArrowBackIcon from "@material-design-icons/svg/outlined/arrow_back.svg";
import CloseIcon from "@material-design-icons/svg/outlined/close.svg";
import {
	type ComponentRef,
	createContext,
	type ReactNode,
	type Ref,
	useContext,
	useEffect,
	useEffectEvent,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import {
	AccessibilityInfo,
	BackHandler,
	Text as NativeText,
	Pressable,
	View,
	type TextProps,
	type ViewStyle,
} from "react-native";
import {
	State,
	type GestureType,
} from "react-native-gesture-handler";
import Animated, {
	useAnimatedReaction,
	useDerivedValue,
	useReducedMotion,
	useSharedValue,
	type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";
import { scheduleOnRN } from "react-native-worklets";

import { Button } from "../button/button";
import type { LeaveGuard } from "../leave-guard/leave-guard";
import {
	useSheetLayer,
	useSheetsAbove,
} from "./sheet-host";
import {
	useReceding,
	type Recession,
} from "./sheet-recede";

export { SheetHost } from "./sheet-host";

type SheetContextValue = Readonly<{
	close: () => void;
	pulled: () => void;
	dismissable: boolean;
	covered: boolean;
	recession: SharedValue<Recession> | undefined;
	floor: number;
	fits: boolean;
}>;

const SheetContext = createContext<SheetContextValue>({
	close: () => {},
	pulled: () => {},
	dismissable: false,
	covered: false,
	recession: undefined,
	floor: 0,
	fits: false,
});

/** A snap point, as a height in points or as a share of the space the sheet may rise through. */
export type SnapPoint = number | `${number}%`;

const SLOP = 8;

const DOWN: readonly [number, number] = [-SLOP, SLOP];

const FILLS: ViewStyle = { flexGrow: 1 };

const LOWEST = 0;

const GONE = -1;

const dimOf = (dark: boolean): number =>
	dark ? 0.4 : 0.22;

const Scrim = (
	props: BottomSheetBackdropProps,
): ReactNode => {
	const { rt } = useUnistyles();
	const { close, dismissable, recession } =
		useContext(SheetContext);
	const { animatedIndex } = props;
	const shown = useDerivedValue(
		() =>
			GONE +
			(animatedIndex.get() - GONE) *
				(1 - (recession?.get().fade ?? 0)),
	);

	return (
		<BottomSheetBackdrop
			{...props}
			accessible={null}
			animatedIndex={shown}
			appearsOnIndex={LOWEST}
			disappearsOnIndex={GONE}
			opacity={dimOf(rt.themeName === "dark")}
			pressBehavior="none">
			{dismissable ? (
				<Pressable
					accessible={false}
					onPress={close}
					style={styles.fill}
				/>
			) : null}
		</BottomSheetBackdrop>
	);
};

const Pull = (): ReactNode => {
	const { theme } = useUnistyles();
	const { pulled } = useContext(SheetContext);
	const {
		animatedPosition,
		animatedDetentsState,
		animatedContentGestureState,
		animatedHandleGestureState,
	} = useBottomSheetInternal();
	const reach = theme.unit[8];
	const released = useSharedValue(0);

	useAnimatedReaction(
		() => ({
			dragging:
				animatedContentGestureState.get() ===
					State.ACTIVE ||
				animatedHandleGestureState.get() === State.ACTIVE,
			below:
				animatedPosition.get() -
				(animatedDetentsState.get().detents?.[0] ??
					Number.POSITIVE_INFINITY),
		}),
		(now, before) => {
			if (now.dragging) {
				released.set(now.below);
				return;
			}
			if (
				before?.dragging === true &&
				released.get() > reach
			) {
				scheduleOnRN(pulled);
			}
		},
	);

	return null;
};

/**
 * A way to move the sheet when it happens. An index held in state cannot express
 * "again": a sheet already resting at the stop it is handed goes nowhere, so the
 * same selection made twice moves nothing.
 */
export type SheetStops = Readonly<{
	openAt: (index: number) => void;
	close: () => void;
}>;

type RootProps = Readonly<{
	children: ReactNode;
	snapPoints: readonly [SnapPoint, ...SnapPoint[]];
	index?: number;
	stops?: Ref<SheetStops>;
	dismissable?: boolean;
	swipeable?: boolean;
	/** Whether the sheet is an overlay: it dims what is behind it and takes it out of reach. */
	modal?: boolean;
	/** Whether the sheet adds a stop at its content's height, capped at the whole screen. */
	fitsContent?: boolean;
	/** The guard a dismissable sheet hands each close a person makes to while it blocks, such as one over a form with unsaved changes. */
	guard?: LeaveGuard;
	onIndexChange?: (index: number) => void;
	testID?: string;
}>;

const Root = ({
	children,
	snapPoints,
	index = 0,
	stops,
	dismissable = false,
	swipeable = true,
	modal = false,
	fitsContent = false,
	guard,
	onIndexChange,
	testID,
}: RootProps): ReactNode => {
	const safe = useSafeAreaInsets();
	const { theme } = useUnistyles();
	const still = useReducedMotion();
	const top = Math.max(theme.unit[8], safe.top);
	const floor = Math.max(theme.unit[8], safe.bottom);
	const sheet = useRef<BottomSheet>(null);
	const shown = useSharedValue(GONE);
	const edge = useSharedValue(0);
	const pull = useDerivedValue(() => {
		const open = Math.min(
			Math.max(shown.get() - GONE, 0),
			1,
		);
		if (!modal) {
			return 0;
		}
		return still ? Math.ceil(open) : open;
	});
	const [token] = useState<object>(() => ({}));
	const above = useSheetsAbove(token);
	const covered = above.length > 0;
	const receding = useReceding(edge, above, theme.unit[5]);
	const blocking = guard?.blocking === true;
	const leave = () => sheet.current?.close();
	const close = () =>
		blocking && guard !== undefined
			? guard.hold(leave)
			: leave();
	const pulled = () => {
		if (dismissable && blocking && guard !== undefined) {
			guard.hold(leave);
		}
	};
	const onBack = useEffectEvent((): boolean => {
		if (covered) {
			return false;
		}
		close();
		return true;
	});

	useImperativeHandle(
		stops,
		() => ({
			openAt: (stop: number) =>
				sheet.current?.snapToIndex(stop),
			close: () => sheet.current?.close(),
		}),
		[],
	);

	useEffect(() => {
		if (!dismissable) {
			return undefined;
		}
		const subscription = BackHandler.addEventListener(
			"hardwareBackPress",
			() => onBack(),
		);
		return () => subscription.remove();
	}, [dismissable]);

	useSheetLayer(
		token,
		{ pull, edge },
		<Animated.View
			accessibilityElementsHidden={covered}
			accessibilityViewIsModal={modal && !covered}
			importantForAccessibility={
				covered ? "no-hide-descendants" : "auto"
			}
			onLayout={receding.measure}
			pointerEvents={covered ? "none" : "box-none"}
			style={[styles.frame, receding.frame]}
			testID={testID}>
			<SheetContext.Provider
				// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
				value={{
					close,
					pulled,
					dismissable,
					covered,
					recession: receding.recession,
					floor,
					fits: fitsContent,
				}}>
				<BottomSheet
					ref={sheet}
					index={index}
					snapPoints={[...snapPoints]}
					topInset={top}
					animatedIndex={shown}
					animatedPosition={edge}
					activeOffsetY={[...DOWN]}
					failOffsetX={[...DOWN]}
					onChange={next => onIndexChange?.(next)}
					enableDynamicSizing={fitsContent}
					enablePanDownToClose={dismissable && !blocking}
					enableContentPanningGesture={swipeable}
					enableHandlePanningGesture={swipeable}
					handleComponent={swipeable ? Handle : null}
					backdropComponent={modal ? Scrim : undefined}
					backgroundComponent={
						modal ? Background : FloatingBackground
					}>
					<Pull />
					{children}
				</BottomSheet>
			</SheetContext.Provider>
			<Animated.View
				pointerEvents="none"
				style={[styles.shade, receding.shade]}
			/>
		</Animated.View>,
	);

	return null;
};

const Handle = (): ReactNode => (
	<View style={styles.handle}>
		<View style={styles.grabBar} />
	</View>
);

const Background = ({
	style,
}: BottomSheetBackgroundProps): ReactNode => (
	<View
		pointerEvents="none"
		style={[style, styles.background]}
	/>
);

const FloatingBackground = ({
	style,
}: BottomSheetBackgroundProps): ReactNode => (
	<View
		pointerEvents="none"
		style={[style, styles.background, styles.floating]}
	/>
);

const useClose = (): (() => void) =>
	useContext(SheetContext).close;

/**
 * The drags a sheet runs around its content — its own pan and its scroll — for a
 * gesture inside it that has to claim the same axis. Empty outside a sheet.
 *
 * @example
 *   const pan = Gesture.Pan().blocksExternalGesture(...useSheetGestures());
 */
export const useSheetGestures =
	(): readonly GestureType[] => [
		...(useContext(
			BottomSheetDraggableContext,
		)?.toGestureArray() ?? []),
		...(useContext(
			BottomSheetScrollableGestureContext,
		)?.toGestureArray() ?? []),
	];

type BehindProps = Readonly<{
	children: ReactNode;
	/** Whether a modal sheet is over this content, so it is dimmed and out of reach. */
	covered: boolean;
	testID?: string;
}>;

const Behind = ({
	children,
	covered,
	testID,
}: BehindProps): ReactNode => (
	<View
		accessibilityElementsHidden={covered}
		importantForAccessibility={
			covered ? "no-hide-descendants" : "auto"
		}
		style={styles.behind}
		testID={testID}>
		{children}
	</View>
);

type ContentProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

const Content = ({
	testID,
	children,
}: ContentProps): ReactNode => {
	const { floor, fits, covered } = useContext(SheetContext);
	const ref = useRef<ComponentRef<typeof View>>(null);

	useEffect(() => {
		const node = ref.current;

		if (!covered && node !== null) {
			AccessibilityInfo.sendAccessibilityEvent(
				node,
				"focus",
			);
		}
	}, [covered]);

	return (
		<BottomSheetScrollView
			contentContainerStyle={fits ? undefined : FILLS}>
			<View
				ref={ref}
				style={[styles.content, styles.contentInset(floor)]}
				testID={testID}>
				{children}
			</View>
		</BottomSheetScrollView>
	);
};

type HeaderProps = Readonly<{
	children: ReactNode;
	/** The way back out of a step the sheet has swapped in, drawn before the title. */
	back?: Readonly<{
		label: string;
		onPress: () => void;
		testID?: string;
	}>;
	/** A control belonging to the sheet as a whole, drawn before the way out. */
	action?: ReactNode;
	closeLabel?: string;
	closeTestID?: string;
	testID?: string;
}>;

type TitleProps = Readonly<Omit<TextProps, "style">>;

const Title = (props: TitleProps): ReactNode => (
	<NativeText
		accessibilityRole="header"
		numberOfLines={1}
		ellipsizeMode="tail"
		{...props}
		style={styles.title}
	/>
);

const Header = ({
	children,
	back,
	action,
	closeLabel,
	closeTestID,
	testID,
}: HeaderProps): ReactNode => {
	const { close } = useContext(SheetContext);

	return (
		<View style={styles.header} testID={testID}>
			{back === undefined ? null : (
				<Button.Root
					tier="ghost"
					size="sm"
					tone="neutral"
					iconOnly
					label={back.label}
					onPress={back.onPress}
					testID={back.testID}>
					<Button.Icon svg={ArrowBackIcon} />
				</Button.Root>
			)}
			<View style={styles.headerTitle}>{children}</View>
			{action}
			{closeLabel === undefined ? null : (
				<Button.Root
					tier="ghost"
					size="sm"
					tone="neutral"
					iconOnly
					label={closeLabel}
					onPress={close}
					testID={closeTestID}>
					<Button.Icon svg={CloseIcon} />
				</Button.Root>
			)}
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	frame: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	},
	background: {
		backgroundColor: theme.color.surface,
		borderTopLeftRadius: theme.radius.xl,
		borderTopRightRadius: theme.radius.xl,
		borderBottomLeftRadius: theme.radius.xl,
		borderBottomRightRadius: theme.radius.xl,
	},
	floating: {
		backgroundColor: theme.color.surfaceOverlay,
		boxShadow: theme.elevation[1],
	},
	fill: { flex: 1 },
	shade: {
		position: "absolute",
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: theme.shadow.umbra,
		borderTopLeftRadius: theme.radius.xl,
		borderTopRightRadius: theme.radius.xl,
	},
	behind: { flex: 1 },
	handle: {
		alignItems: "center",
		paddingVertical: theme.unit[6],
	},
	grabBar: {
		backgroundColor: theme.color.outline,
		borderRadius: theme.radius.full,
		height: theme.unit[2],
		width: theme.unit[20],
	},
	content: {
		flexGrow: 1,
		gap: theme.unit[6],
		paddingHorizontal: theme.unit[8],
		paddingTop: theme.unit[2],
	},
	header: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[4],
		minHeight: theme.unit[22],
	},
	headerTitle: { flex: 1 },
	title: {
		...theme.font.heading.small,
		color: theme.color.text,
	},
	contentInset: (floor: number) => ({
		paddingBottom: floor,
	}),
}));

type SheetNamespace = Readonly<{
	Root: typeof Root;
	Behind: typeof Behind;
	Content: typeof Content;
	Header: typeof Header;
	Title: typeof Title;
	useClose: typeof useClose;
}>;

/**
 * A bottom sheet drawn over the app, with snap points, a grab bar
 * and a title line that carries the close control when `Header` is given
 * `closeLabel`, and a back arrow before the title when it is given `back`.
 * It rises no higher than the safe area, and `Content` scrolls and ends above
 * it, each never less than a gutter.
 * It grows to the height it scrolls through, so a column shorter than the sheet
 * still reaches its floor and whatever is inside it may claim that room. A
 * dismissable sheet answers the Android back press itself, so a selection held in
 * screen state has the same way out as one held in a route. Closing animates the
 * sheet down and reports `-1` once it has gone, so a caller that clears its
 * selection on close clears it behind an empty surface.
 *
 * `fitsContent` adds a stop at the height of what `Content` holds, capped at the
 * whole screen, and `Content` then stops growing to fill the sheet.
 *
 * `Title` is a heading that clips to one line with a tail ellipsis, and the full
 * string stays the accessible name.
 *
 * `useClose` is the same close the header control uses, for a control of the
 * sheet's own that sends it away. It reads the sheet from context, so it only
 * answers in a component rendered inside `Root`.
 *
 * `modal` makes it an overlay, the shape a confirmation or an action list takes:
 * it dims the screen behind it and closes on a press of that scrim when it is
 * dismissable. A sheet that is not modal floats, on the overlay surface with the
 * first elevation. What it covers is `Behind`, which takes that
 * content out of reach of a screen reader on both platforms while the sheet is up.
 *
 * Every sheet is drawn in the `SheetHost` mounted around the app, so one
 * opened from inside another stacks over it. A sheet covered by a modal one
 * steps back with that sheet's rise: it narrows, its top edge shows above the
 * new one, it shades over, and a screen reader leaves it until it is uncovered.
 *
 * `guard` takes a `LeaveGuard`. While it blocks, the scrim, the back press, the
 * close control and `useClose` hand the close to it, and a swipe down past the
 * close threshold springs back first.
 *
 * Its own drag is vertical only, so a carousel or a rail inside `Content` keeps its
 * sideways gestures: the library's content pan claims every direction unless it is
 * told which one it owns, and it coordinates only with scrollables built from its
 * own hooks.
 *
 * @example
 * <Sheet.Behind covered={isAsking}>{page}</Sheet.Behind>
 * <Sheet.Root snapPoints={["50%", "100%"]} modal dismissable guard={guard}>
 * 	<Sheet.Content>
 * 		<Sheet.Header closeLabel={m.common_close()}>
 * 			<Sheet.Title>{m.item_actions_title()}</Sheet.Title>
 * 		</Sheet.Header>
 * 	</Sheet.Content>
 * </Sheet.Root>
 */
export const Sheet: SheetNamespace = {
	Root,
	Behind,
	Content,
	Header,
	Title,
	useClose,
};
