import type { ReactNode } from "react";
import {
	Text as NativeText,
	type TextProps,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { useLiveRegion } from "../../lib/a11y/live-region";

type RootProps = Readonly<
	Omit<
		TextProps,
		"style" | "accessibilityLiveRegion" | "children"
	> & { children: string }
>;

const Root = ({
	children,
	...props
}: RootProps): ReactNode => {
	const live = useLiveRegion(children);

	return (
		<NativeText {...live} {...props} style={styles.text}>
			{children}
		</NativeText>
	);
};

const styles = StyleSheet.create(theme => ({
	text: {
		...theme.font.body.small,
		color: theme.color.error.fg,
	},
}));

type ErrorTextNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A validation or submission message in the error role, announced when it
 * appears.
 *
 * @example
 *   <ErrorText.Root nativeID={errorId}>{m.login_failed()}</ErrorText.Root>
 */
export const ErrorText: ErrorTextNamespace = { Root };
