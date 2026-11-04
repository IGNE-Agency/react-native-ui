import {
	BlurTargetView,
	BlurView,
	type BlurTint,
} from "expo-blur";
import {
	createContext,
	useContext,
	useRef,
	type ComponentRef,
	type ReactNode,
	type RefObject,
} from "react";
import { View, type ViewStyle } from "react-native";
import Animated, {
	Easing,
	FadeIn,
	FadeOut,
	useAnimatedStyle,
	withTiming,
} from "react-native-reanimated";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import {
	timing,
	type Motion,
} from "../../lib/motion/motion";
import {
	useBusyPhase,
	type BusyPhase,
	type BusyPhaseOptions,
} from "../../lib/wait/use-busy-phase";
import { Button } from "../button/button";
import { Spinner } from "../spinner/spinner";

type StaleContextValue = Readonly<{
	phase: BusyPhase;
	content: RefObject<ComponentRef<typeof View> | null>;
}>;

type RootProps = BusyPhaseOptions &
	Readonly<{ testID?: string; children: ReactNode }>;

type ContentProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type DimProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type OverlayProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type MessageProps = Readonly<{
	testID?: string;
	children: string;
}>;

type RetryProps = Readonly<{
	onRetry: () => void;
	testID?: string;
	children: string;
}>;

const DIMMED = 0.55;

const VEIL = 0.75;

const BLUR_INTENSITY = 40;

const COVERS: ViewStyle = {
	position: "absolute",
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
};

const StaleContext = createContext<
	StaleContextValue | undefined
>(undefined);

const useStale = (): StaleContextValue => {
	const value = useContext(StaleContext);
	if (!value) {
		throw new Error(
			"Stale parts must be rendered inside Stale.Root",
		);
	}
	return value;
};

const isOverlaid = (phase: BusyPhase): boolean =>
	phase === "slow" || phase === "stuck";

const frostOf = (dark: boolean): BlurTint =>
	dark ? "dark" : "light";

const fadeIn = (motion: Motion): FadeIn =>
	FadeIn.duration(motion.short).easing(
		Easing.bezier(...motion.standard),
	);

const fadeOut = (motion: Motion): FadeOut =>
	FadeOut.duration(motion.instant).easing(
		Easing.bezier(...motion.accelerate),
	);

const Root = ({
	testID,
	children,
	...options
}: RootProps): ReactNode => {
	const phase = useBusyPhase(options);
	const content = useRef<ComponentRef<typeof View>>(null);

	return (
		<StaleContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{ phase, content }}>
			<View testID={testID}>{children}</View>
		</StaleContext.Provider>
	);
};

const Content = ({
	testID,
	children,
}: ContentProps): ReactNode => {
	const { phase, content } = useStale();
	const busy = phase !== "fresh";
	const overlaid = isOverlaid(phase);

	return (
		<BlurTargetView ref={content}>
			<View
				accessibilityElementsHidden={overlaid}
				accessibilityState={busy ? { busy } : undefined}
				importantForAccessibility={
					overlaid ? "no-hide-descendants" : "auto"
				}
				pointerEvents={busy ? "none" : "auto"}
				testID={testID}>
				{children}
			</View>
		</BlurTargetView>
	);
};

const Dim = ({ testID, children }: DimProps): ReactNode => {
	const { phase } = useStale();
	const { theme } = useUnistyles();
	const busy = phase !== "fresh";
	const settle = timing(
		theme.motion.short,
		theme.motion.standard,
	);
	const dim = useAnimatedStyle(() => ({
		opacity: withTiming(busy ? DIMMED : 1, settle),
	}));

	return (
		<Animated.View style={dim} testID={testID}>
			{children}
		</Animated.View>
	);
};

const Overlay = ({
	testID,
	children,
}: OverlayProps): ReactNode => {
	const { phase, content } = useStale();
	const { theme, rt } = useUnistyles();

	if (!isOverlaid(phase)) {
		return null;
	}

	return (
		<Animated.View
			entering={fadeIn(theme.motion)}
			exiting={fadeOut(theme.motion)}
			style={styles.overlay}
			testID={testID}>
			<View style={styles.frost}>
				<BlurView
					blurMethod="dimezisBlurViewSdk31Plus"
					blurTarget={content}
					intensity={BLUR_INTENSITY}
					tint={frostOf(rt.themeName === "dark")}
					style={COVERS}
				/>
				<View style={styles.veil} />
			</View>
			{children}
		</Animated.View>
	);
};

const Message = ({
	testID,
	children,
}: MessageProps): ReactNode => (
	<Spinner.Root label={children} testID={testID}>
		<Spinner.Indicator />
		<Spinner.Label>{children}</Spinner.Label>
	</Spinner.Root>
);

const Retry = ({
	onRetry,
	testID,
	children,
}: RetryProps): ReactNode => {
	const { phase } = useStale();
	const { theme } = useUnistyles();

	if (phase !== "stuck") {
		return null;
	}

	return (
		<Animated.View
			entering={fadeIn(theme.motion)}
			exiting={fadeOut(theme.motion)}>
			<Button.Root
				onPress={onRetry}
				testID={testID}
				tier="tonal">
				<Button.Label>{children}</Button.Label>
			</Button.Root>
		</Animated.View>
	);
};

const styles = StyleSheet.create(theme => ({
	overlay: {
		alignItems: "center",
		bottom: 0,
		gap: theme.unit[6],
		justifyContent: "center",
		left: 0,
		padding: theme.unit[8],
		position: "absolute",
		right: 0,
		top: 0,
	},
	frost: {
		borderRadius: theme.radius.lg,
		bottom: 0,
		left: 0,
		overflow: "hidden",
		position: "absolute",
		right: 0,
		top: 0,
	},
	veil: {
		backgroundColor: theme.color.surface,
		opacity: VEIL,
		bottom: 0,
		left: 0,
		position: "absolute",
		right: 0,
		top: 0,
	},
}));

type StaleNamespace = Readonly<{
	Root: typeof Root;
	Content: typeof Content;
	Dim: typeof Dim;
	Overlay: typeof Overlay;
	Message: typeof Message;
	Retry: typeof Retry;
}>;

/**
 * Content kept on screen while a fresh copy is out, as parts. `Root` times the
 * wait; `Content` is busy and out of reach while it lasts; `Dim`, `Overlay`,
 * `Message` and `Retry` draw its late, slow and stuck phases. `Overlay` sits
 * beside `Content`, never inside it.
 *
 * @example
 *   <Stale.Root busy={query.isFetching}>
 *   	<Stale.Content>
 *   		<Stale.Dim>{list}</Stale.Dim>
 *   	</Stale.Content>
 *   	<Stale.Overlay>
 *   		<Stale.Message>{m.items_updating_slow()}</Stale.Message>
 *   		<Stale.Retry onRetry={query.refetch}>{m.common_retry()}</Stale.Retry>
 *   	</Stale.Overlay>
 *   </Stale.Root>
 */
export const Stale: StaleNamespace = {
	Root,
	Content,
	Dim,
	Overlay,
	Message,
	Retry,
};
