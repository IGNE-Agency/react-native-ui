import type { FC, ReactNode } from "react";
import { Text as NativeText, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { useLiveRegion } from "../../lib/a11y/live-region";
import {
	TONES,
	tonePaint,
	type ToneName,
} from "../../lib/tone/tone";
import { Button } from "../button/button";
import { Icon } from "../icon/icon";
import { Spinner } from "../spinner/spinner";

type RootProps = Readonly<{
	/** What the message is announced as when it appears or changes. Without it, it is not announced. */
	announcement?: string;
	/** Whether it stands for a wait under way, announced as one progress indicator named by `announcement`. */
	busy?: boolean;
	testID?: string;
	children: ReactNode;
}>;

type IconProps = Readonly<{
	svg: FC<SvgProps>;
	tone?: ToneName;
	testID?: string;
}>;

type SpinnerProps = Readonly<{ testID?: string }>;

type TextProps = Readonly<{
	testID?: string;
	children: string;
}>;

type ActionProps = Readonly<{
	onPress: () => void;
	testID?: string;
	children: string;
}>;

const Root = ({
	announcement,
	busy = false,
	testID,
	children,
}: RootProps): ReactNode => {
	const live = useLiveRegion(announcement);

	return (
		<View
			{...(announcement === undefined ? undefined : live)}
			accessible={busy}
			accessibilityLabel={busy ? announcement : undefined}
			accessibilityRole={busy ? "progressbar" : undefined}
			accessibilityState={busy ? { busy } : undefined}
			style={styles.root}
			testID={testID}>
			{children}
		</View>
	);
};

const StatusIcon = ({
	svg,
	tone = "neutral",
	testID,
}: IconProps): ReactNode => {
	const { theme } = useUnistyles();
	styles.useVariants({ tone });

	return (
		<View style={styles.badge} testID={testID}>
			<Icon.Root
				color={tonePaint(theme.color, tone).fg}
				svg={svg}
				size="lg"
			/>
		</View>
	);
};

const StatusSpinner = ({
	testID,
}: SpinnerProps): ReactNode => (
	<Spinner.Indicator testID={testID} />
);

const Title = ({
	testID,
	children,
}: TextProps): ReactNode => (
	<NativeText
		accessibilityRole="header"
		style={styles.title}
		testID={testID}>
		{children}
	</NativeText>
);

const Body = ({
	testID,
	children,
}: TextProps): ReactNode => (
	<NativeText style={styles.body} testID={testID}>
		{children}
	</NativeText>
);

const Action = ({
	onPress,
	testID,
	children,
}: ActionProps): ReactNode => (
	<Button.Root
		onPress={onPress}
		size="md"
		testID={testID}
		tier="solid"
		tone="brand">
		<Button.Label>{children}</Button.Label>
	</Button.Root>
);

const styles = StyleSheet.create(theme => ({
	root: {
		alignItems: "center",
		gap: theme.unit[6],
	},
	badge: {
		alignItems: "center",
		borderRadius: theme.radius.full,
		height: theme.unit[32],
		justifyContent: "center",
		width: theme.unit[32],
		variants: {
			tone: {
				brand: {},
				success: {},
				info: {},
				warning: {},
				error: {},
				neutral: {},
			},
		},
		compoundVariants: TONES.map(tone => ({
			tone,
			styles: {
				backgroundColor: tonePaint(theme.color, tone).bg,
			},
		})),
	},
	title: {
		...theme.font.heading.medium,
		color: theme.color.text,
	},
	body: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
}));

type StatusMessageNamespace = Readonly<{
	Root: typeof Root;
	Icon: typeof StatusIcon;
	Spinner: typeof StatusSpinner;
	Title: typeof Title;
	Body: typeof Body;
	Action: typeof Action;
}>;

/**
 * The message a view shows in place of its content, as parts: an icon on a
 * tinted disc or a spinner, a title, a body and an action. Where it sits is the
 * caller's.
 *
 * @example
 *   <StatusMessage.Root>
 *   	<StatusMessage.Icon svg={InboxIcon} />
 *   	<StatusMessage.Title>{m.home_empty_title()}</StatusMessage.Title>
 *   	<StatusMessage.Body>{m.home_empty_body()}</StatusMessage.Body>
 *   </StatusMessage.Root>
 */
export const StatusMessage: StatusMessageNamespace = {
	Root,
	Icon: StatusIcon,
	Spinner: StatusSpinner,
	Title,
	Body,
	Action,
};
