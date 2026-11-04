import {
	createContext,
	forwardRef,
	useContext,
	useRef,
	useState,
	type ComponentProps,
	type ComponentRef,
	type ReactNode,
} from "react";
import type {
	HostInstance,
	ScrollViewProps,
	ViewStyle,
} from "react-native";
import {
	GestureDetector,
	type GestureType,
	type LegacyComposedGesture,
} from "react-native-gesture-handler";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Animated, {
	useReducedMotion,
} from "react-native-reanimated";
import { useUnistyles } from "react-native-unistyles";

type SharedGesture = GestureType | LegacyComposedGesture;

/** What a `ScrollArea.Root` takes: the scroll view's own styling and scroll events, and a gesture to share its touches. */
export type ScrollAreaProps = Readonly<
	Pick<
		ScrollViewProps,
		| "contentContainerStyle"
		| "onScroll"
		| "scrollEventThrottle"
		| "showsVerticalScrollIndicator"
		| "style"
		| "testID"
	>
> &
	Readonly<{
		/** A gesture that shares the scroll view's touches, such as a pull, attached to the scroll view itself. */
		gesture?: SharedGesture;
		children: ReactNode;
	}>;

type ScrollViewComponent = NonNullable<
	ComponentProps<
		typeof KeyboardAwareScrollView
	>["ScrollViewComponent"]
>;

const FILLS: ViewStyle = { flex: 1 };

const ClearanceContext = createContext<
	(clearance: number) => void
>(() => {});

/**
 * The way a focused field asks the scroll area it sits in for room under its
 * control, in points, and gives it back with `0`.
 *
 * @example
 *   const clear = useFieldClearance();
 */
export const useFieldClearance = (): ((
	clearance: number,
) => void) => useContext(ClearanceContext);

const RevealContext = createContext<
	(node: HostInstance) => void
>(() => {});

/**
 * The way a field asks the scroll area it sits in to bring one of its nodes to
 * the middle of the view, for a control that raises no keyboard to do it.
 *
 * @example
 *   const reveal = useScrollIntoView();
 *   reveal(node);
 */
export const useScrollIntoView = (): ((
	node: HostInstance,
) => void) => useContext(RevealContext);

const GestureContext = createContext<
	SharedGesture | undefined
>(undefined);

const DetectedScrollView: ScrollViewComponent = forwardRef<
	Animated.ScrollView,
	ComponentProps<typeof Animated.ScrollView>
>((props, ref) => {
	const gesture = useContext(GestureContext);
	const view = <Animated.ScrollView ref={ref} {...props} />;

	return gesture === undefined ? (
		view
	) : (
		<GestureDetector gesture={gesture}>
			{view}
		</GestureDetector>
	);
});

const Root = ({
	children,
	gesture,
	style,
	...scroll
}: ScrollAreaProps): ReactNode => {
	const { theme } = useUnistyles();
	const [clearance, setClearance] = useState(0);
	const view =
		useRef<ComponentRef<typeof KeyboardAwareScrollView>>(
			null,
		);
	const viewport = useRef(0);
	const still = useReducedMotion();
	const reveal = (node: HostInstance) => {
		const current = view.current;
		const content = current?.getInnerViewRef();
		if (
			current === null ||
			content === undefined ||
			content === null
		) {
			return;
		}
		node.measureLayout(content, (_x, y, _width, height) => {
			current.scrollTo({
				y: Math.max(
					0,
					y + height / 2 - viewport.current / 2,
				),
				animated: !still,
			});
		});
	};
	return (
		<GestureContext.Provider value={gesture}>
			<KeyboardAwareScrollView
				{...scroll}
				ScrollViewComponent={DetectedScrollView}
				bottomOffset={theme.unit[8] + clearance}
				keyboardDismissMode="on-drag"
				keyboardShouldPersistTaps="handled"
				onLayout={event => {
					viewport.current =
						event.nativeEvent.layout.height;
				}}
				ref={view}
				style={[FILLS, style]}>
				<ClearanceContext.Provider value={setClearance}>
					<RevealContext.Provider
						// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
						value={reveal}>
						{children}
					</RevealContext.Provider>
				</ClearanceContext.Provider>
			</KeyboardAwareScrollView>
		</GestureContext.Provider>
	);
};

type ScrollAreaNamespace = Readonly<{
	Root: typeof Root;
}>;

/**
 * The scrolling column fields sit in: it scrolls a focused field clear of the
 * keyboard, with the room the field asks for through `useFieldClearance`, and
 * brings a control into view through `useScrollIntoView`. Its padding, gap and
 * background are the app's, and a `gesture` is attached to the scroll view
 * itself.
 *
 * @example
 *   <ScrollArea.Root contentContainerStyle={styles.form}>
 *   	{fields}
 *   </ScrollArea.Root>
 */
export const ScrollArea: ScrollAreaNamespace = { Root };
