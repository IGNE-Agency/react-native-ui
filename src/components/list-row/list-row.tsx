import ChevronRightIcon from "@material-design-icons/svg/outlined/chevron_right.svg";
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
import { suffixed } from "../../lib/test-id/test-id";
import { Icon } from "../icon/icon";
import { Spinner } from "../spinner/spinner";

type Tone = "neutral" | "error";

type RootProps = Readonly<{
	/** A `link` goes somewhere; a `button` does something here. */
	role: "link" | "button";
	tone?: Tone;
	disabled?: boolean;
	/** Whether the row's action is under way: it blocks presses and its icon becomes a spinner. */
	busy?: boolean;
	/** What a `button` row is announced as, where its label alone does not say it. */
	accessibilityLabel?: string;
	/** What the press does; expo-router's `<Link asChild>` around a `link` row supplies it. */
	onPress?: PressableProps["onPress"];
	testID?: string;
	children: ReactNode;
}>;

type IconProps = Readonly<{
	svg: FC<SvgProps>;
	testID?: string;
}>;

type TextProps = Readonly<{
	testID?: string;
	children: string;
}>;

type ChevronProps = Readonly<{ testID?: string }>;

type RowProps = Readonly<{
	svg: FC<SvgProps>;
	label: string;
	tone?: Tone;
	/** A word set beside the label, for a row that is not part of the product. */
	tag?: string;
	/** What the press does; expo-router's `<Link asChild>` around a `Link` row supplies it. */
	onPress?: PressableProps["onPress"];
	/** `testID` goes on the row and `${testID}-tag` on its tag. */
	testID?: string;
}>;

type ActionProps = Omit<RowProps, "onPress"> &
	Readonly<{
		onPress: NonNullable<PressableProps["onPress"]>;
		busy?: boolean;
		/** What the row is announced as while `busy`, such as "Signing out". */
		busyLabel?: string;
		disabled?: boolean;
	}>;

type RowContextValue = Readonly<{
	tone: Tone;
	disabled: boolean;
	busy: boolean;
}>;

const RowContext = createContext<RowContextValue>({
	tone: "neutral",
	disabled: false,
	busy: false,
});

const Root = ({
	role,
	tone = "neutral",
	disabled = false,
	busy = false,
	accessibilityLabel,
	onPress,
	testID,
	children,
}: RootProps): ReactNode => {
	const [pressed, setPressed] = useState(false);
	const { theme } = useUnistyles();
	const blocked = disabled || busy;
	const button = role === "button";

	return (
		<RowContext.Provider
			// oxlint-disable-next-line react/jsx-no-constructed-context-values -- the React Compiler memoises it
			value={{ tone, disabled, busy }}>
			<Pressable
				accessibilityLabel={
					button ? accessibilityLabel : undefined
				}
				accessibilityRole={role}
				accessibilityState={
					button ? { disabled: blocked, busy } : undefined
				}
				disabled={blocked}
				hitSlop={{
					left: theme.unit[4],
					right: theme.unit[4],
				}}
				onPress={event => {
					hapticTick();
					onPress?.(event);
				}}
				onPressIn={() => setPressed(true)}
				onPressOut={() => setPressed(false)}
				style={styles.row}
				testID={testID}>
				{pressed ? (
					<View
						style={styles.press(
							tone === "error"
								? theme.color.error.fg
								: theme.color.text,
						)}
					/>
				) : null}
				{children}
			</Pressable>
		</RowContext.Provider>
	);
};

const RowIcon = ({ svg, testID }: IconProps): ReactNode => {
	const { tone, disabled, busy } = useContext(RowContext);
	const { theme } = useUnistyles();

	if (busy) {
		return <Spinner.Indicator size="sm" testID={testID} />;
	}

	if (disabled) {
		return (
			<Icon.Root
				svg={svg}
				size="md"
				color={theme.color.disabled.fg}
				testID={testID}
			/>
		);
	}

	return (
		<Icon.Root
			svg={svg}
			size="md"
			color={
				tone === "error"
					? theme.color.error.fg
					: theme.color.text
			}
			testID={testID}
		/>
	);
};

const Label = ({
	testID,
	children,
}: TextProps): ReactNode => {
	const { tone, disabled } = useContext(RowContext);

	return (
		<View style={styles.line} testID={testID}>
			<NativeText
				numberOfLines={1}
				style={[
					styles.label,
					tone === "error" ? styles.labelError : null,
					disabled ? styles.labelDisabled : null,
				]}>
				{children}
			</NativeText>
		</View>
	);
};

const Tag = ({
	testID,
	children,
}: TextProps): ReactNode => (
	<View style={styles.tag} testID={testID}>
		<NativeText style={styles.tagText}>
			{children.toLocaleUpperCase()}
		</NativeText>
	</View>
);

const Chevron = ({ testID }: ChevronProps): ReactNode => {
	const { disabled } = useContext(RowContext);
	const { theme } = useUnistyles();

	return (
		<Icon.Root
			svg={ChevronRightIcon}
			size="md"
			color={
				disabled
					? theme.color.disabled.fg
					: theme.color.textMuted
			}
			testID={testID}
		/>
	);
};

const Link = ({
	svg,
	label,
	tone = "neutral",
	tag,
	onPress,
	testID,
}: RowProps): ReactNode => (
	<Root
		onPress={onPress}
		role="link"
		testID={testID}
		tone={tone}>
		<RowIcon svg={svg} />
		<Label>{label}</Label>
		{tag === undefined ? null : (
			<Tag testID={suffixed(testID, "tag")}>{tag}</Tag>
		)}
		<Chevron />
	</Root>
);

const Action = ({
	svg,
	label,
	tone = "neutral",
	tag,
	busy = false,
	busyLabel,
	disabled = false,
	onPress,
	testID,
}: ActionProps): ReactNode => {
	const name =
		busy && busyLabel !== undefined ? busyLabel : label;

	return (
		<Root
			accessibilityLabel={
				tag === undefined ? name : `${name}, ${tag}`
			}
			busy={busy}
			disabled={disabled}
			onPress={onPress}
			role="button"
			testID={testID}
			tone={tone}>
			<RowIcon svg={svg} />
			<Label>{label}</Label>
			{tag === undefined ? null : (
				<Tag testID={suffixed(testID, "tag")}>{tag}</Tag>
			)}
		</Root>
	);
};

const styles = StyleSheet.create(theme => ({
	line: { flex: 1 },
	label: {
		...theme.font.label.medium,
		color: theme.color.text,
	},
	labelError: { color: theme.color.error.fg },
	labelDisabled: { color: theme.color.disabled.fg },
	tagText: {
		...theme.font.label.smallStrong,
		color: theme.color.error.fg,
	},
	tag: {
		backgroundColor: theme.color.error.bg,
		borderRadius: theme.radius.sm,
		paddingHorizontal: theme.unit[4],
	},
	row: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[6],
		minHeight: theme.unit[28],
	},
	press: (ink: string) => ({
		position: "absolute",
		top: 0,
		right: -theme.unit[4],
		bottom: 0,
		left: -theme.unit[4],
		borderRadius: theme.radius.sm,
		backgroundColor: ink,
		opacity: theme.state.pressed,
	}),
}));

type ListRowNamespace = Readonly<{
	Root: typeof Root;
	Icon: typeof RowIcon;
	Label: typeof Label;
	Tag: typeof Tag;
	Chevron: typeof Chevron;
	Link: typeof Link;
	Action: typeof Action;
}>;

/**
 * A row in a list of destinations and actions, as parts: `Root` is the
 * pressable row, announced as a link or a button, and `Icon`, `Label`, `Tag` and
 * `Chevron` sit in it. It sets no inset of its own, and its press shows a little
 * past its edges. `Link` and `Action` are the two rows assembled; `Action`
 * shows a spinner in place of its icon while it is `busy`.
 *
 * @example
 * <Link href="/settings" asChild>
 * 	<ListRow.Link svg={SettingsIcon} label={m.settings_title()} />
 * </Link>
 */
export const ListRow: ListRowNamespace = {
	Root,
	Icon: RowIcon,
	Label,
	Tag,
	Chevron,
	Link,
	Action,
};
