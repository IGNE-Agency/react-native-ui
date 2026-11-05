import {
	createContext,
	useContext,
	useState,
	type FC,
	type ReactNode,
} from "react";
import {
	Pressable,
	Text as NativeText,
	View,
	type PressableProps,
} from "react-native";
import type { SvgProps } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { hapticTick } from "../../lib/haptics/haptics";
import { StateLayer } from "../../lib/state-layer/state-layer";
import {
	TONES,
	tonePaint,
	type ToneName,
} from "../../lib/tone/tone";
import type { SysTheme } from "../../theme";
import { Icon } from "../icon/icon";
import { Spinner } from "../spinner/spinner";

type Tier = "solid" | "tonal" | "ghost";

type Size = "sm" | "md" | "lg";

type Tone = ToneName;

type ButtonContextValue = Readonly<{
	tier: Tier;
	size: Size;
	tone: Tone;
	disabled: boolean;
	busy: boolean;
}>;

type RootProps = Readonly<{
	tier?: Tier;
	size?: Size;
	tone?: Tone;
	disabled?: boolean;
	/** Shows a spinner in place of the content, which keeps its room, and blocks presses until it clears. */
	busy?: boolean;
	/** What the button is announced as while `busy`, such as "Signing in". */
	busyLabel?: string;
	inlay?: boolean;
	/** `link` for a button that navigates; expo-router's `<Link asChild>` sets it, with `onPress`. */
	role?: "button" | "link";
	onPress?: PressableProps["onPress"];
	hitSlop?: PressableProps["hitSlop"];
	testID?: string;
	children: ReactNode;
}> &
	(
		| Readonly<{ iconOnly?: false; label?: undefined }>
		| Readonly<{ iconOnly: true; label: string }>
	);

type LabelProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type IconProps = Readonly<{
	svg: FC<SvgProps>;
	testID?: string;
}>;

const ButtonContext = createContext<
	ButtonContextValue | undefined
>(undefined);

const useButtonContext = (): ButtonContextValue => {
	const value = useContext(ButtonContext);
	if (!value) {
		throw new Error(
			"Button parts must be rendered inside Button.Root",
		);
	}
	return value;
};

const inkOf = (
	color: SysTheme["color"],
	tier: Tier,
	tone: Tone,
	disabled: boolean,
): string => {
	if (disabled) {
		return color.disabled.fg;
	}
	const paint = tonePaint(color, tone);
	return tier === "solid" ? paint.onSolid : paint.fg;
};

const useInk = (): string => {
	const { tier, tone, disabled } = useButtonContext();
	const { theme } = useUnistyles();
	return inkOf(theme.color, tier, tone, disabled);
};

const Root = ({
	tier = "solid",
	size = "md",
	tone = "brand",
	disabled = false,
	busy = false,
	busyLabel,
	iconOnly = false,
	inlay = false,
	label,
	role = "button",
	onPress,
	hitSlop,
	testID,
	children,
}: RootProps): ReactNode => {
	const [pressed, setPressed] = useState(false);
	const { theme } = useUnistyles();
	const blocked = disabled || busy;
	const name =
		busy && busyLabel !== undefined ? busyLabel : label;
	styles.useVariants({
		tier,
		size,
		tone,
		disabled: blocked,
		iconOnly,
		inlay,
	});
	return (
		<ButtonContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{ tier, size, tone, disabled: blocked, busy }}>
			<Pressable
				accessibilityRole={role}
				accessibilityLabel={name}
				accessibilityState={{
					disabled: blocked,
					busy: busy && name !== undefined,
				}}
				disabled={blocked}
				hitSlop={
					hitSlop ??
					(size === "sm" ? theme.unit[2] : undefined)
				}
				onPress={event => {
					hapticTick();
					onPress?.(event);
				}}
				onPressIn={() => setPressed(true)}
				onPressOut={() => setPressed(false)}
				style={styles.root}
				testID={testID}>
				<StateLayer
					color={inkOf(theme.color, tier, tone, blocked)}
					pressed={pressed}
				/>
				{children}
				{busy ? (
					<View pointerEvents="none" style={styles.busy}>
						<Spinner.Indicator size="sm" />
					</View>
				) : null}
			</Pressable>
		</ButtonContext.Provider>
	);
};

const Label = ({
	testID,
	children,
}: LabelProps): ReactNode => {
	const { tier, size, tone, disabled, busy } =
		useButtonContext();
	styles.useVariants({ tier, size, tone, disabled, busy });
	return (
		<NativeText style={styles.label} testID={testID}>
			{children}
		</NativeText>
	);
};

const ButtonIcon = ({
	svg,
	testID,
}: IconProps): ReactNode => {
	const { size, busy } = useButtonContext();
	const color = useInk();
	styles.useVariants({ busy });
	return (
		<View style={styles.glyph} testID={testID}>
			<Icon.Root svg={svg} size={size} color={color} />
		</View>
	);
};

const styles = StyleSheet.create(theme => ({
	root: {
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
		borderRadius: theme.radius.full,
		backgroundColor: "transparent",
		overflow: "hidden",
		variants: {
			tier: {
				solid: {},
				tonal: {},
				ghost: {},
			},
			tone: {
				brand: {},
				error: {},
				warning: {},
				info: {},
				neutral: {},
			},
			size: {
				sm: {
					minHeight: theme.unit[20],
					paddingHorizontal: theme.unit[6],
					gap: theme.unit[4],
				},
				md: {
					minHeight: theme.unit[24],
					paddingHorizontal: theme.unit[10],
					gap: theme.unit[4],
				},
				lg: {
					minHeight: theme.unit[28],
					paddingHorizontal: theme.unit[12],
					gap: theme.unit[6],
				},
			},
			iconOnly: {
				true: { paddingHorizontal: 0 },
				false: {},
			},
			inlay: {
				true: { flex: 1, minHeight: 0 },
				false: {},
			},
			disabled: { true: {}, false: {} },
		},
		compoundVariants: [
			...TONES.map(tone => ({
				tier: "tonal",
				tone,
				styles: {
					backgroundColor: tonePaint(theme.color, tone).bg,
				},
			})),
			...TONES.map(tone => ({
				tier: "solid",
				tone,
				styles: {
					backgroundColor: tonePaint(theme.color, tone)
						.solid,
				},
			})),
			{
				iconOnly: true,
				size: "sm",
				styles: { width: theme.unit[20] },
			},
			{
				iconOnly: true,
				size: "md",
				styles: { width: theme.unit[24] },
			},
			{
				iconOnly: true,
				size: "lg",
				styles: { width: theme.unit[28] },
			},
			{
				inlay: true,
				styles: { width: "auto" },
			},
			{
				disabled: true,
				styles: {
					backgroundColor: theme.color.disabled.bg,
				},
			},
			{
				disabled: true,
				tier: "ghost",
				styles: { backgroundColor: "transparent" },
			},
		],
	},
	label: {
		...theme.font.label.medium,
		color: theme.color.text,
		variants: {
			tier: { solid: {}, tonal: {}, ghost: {} },
			tone: {
				brand: {},
				success: {},
				info: {},
				warning: {},
				error: {},
				neutral: {},
			},
			size: {
				sm: theme.font.label.small,
				md: theme.font.label.medium,
				lg: theme.font.label.large,
			},
			disabled: { true: {}, false: {} },
			busy: { true: { opacity: 0 }, false: {} },
		},
		compoundVariants: [
			...TONES.map(tone => ({
				tone,
				styles: { color: tonePaint(theme.color, tone).fg },
			})),
			...TONES.map(tone => ({
				tier: "solid",
				tone,
				styles: {
					color: tonePaint(theme.color, tone).onSolid,
				},
			})),
			{
				disabled: true,
				styles: { color: theme.color.disabled.fg },
			},
		],
	},
	glyph: {
		variants: {
			busy: { true: { opacity: 0 }, false: {} },
		},
	},
	busy: {
		...StyleSheet.absoluteFillObject,
		alignItems: "center",
		justifyContent: "center",
	},
}));

type ButtonNamespace = Readonly<{
	Root: typeof Root;
	Label: typeof Label;
	Icon: typeof ButtonIcon;
}>;

/**
 * The one button: three tiers, three sizes and a tone, with an icon-only form
 * that requires the label it announces. `inlay` fills a field inlay's slot, and
 * `busy` draws a spinner inside the button in place of its content. Inside an
 * expo-router `<Link asChild>` it navigates and is announced as a link.
 *
 * @example
 *   <Button.Root tier="solid" tone="brand" onPress={submit}>
 *   	<Button.Icon svg={CheckIcon} />
 *   	<Button.Label>{m.login_submit()}</Button.Label>
 *   </Button.Root>
 */
export const Button: ButtonNamespace = {
	Root,
	Label,
	Icon: ButtonIcon,
};
