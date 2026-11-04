import { useState, type ReactNode } from "react";
import {
	Pressable,
	Text as NativeText,
	type PressableProps,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { hapticTick } from "../../lib/haptics/haptics";

type Size = "sm" | "md";

type RootProps = Readonly<{
	children: ReactNode;
	size?: Size;
	disabled?: boolean;
	/** What the press does; expo-router's `<Link asChild>` around it supplies it. */
	onPress?: PressableProps["onPress"];
	testID?: string;
}>;

const Root = ({
	children,
	size = "md",
	disabled = false,
	onPress,
	testID,
}: RootProps): ReactNode => {
	const [pressed, setPressed] = useState(false);
	styles.useVariants({ size, pressed, disabled });
	return (
		<Pressable
			accessibilityRole="link"
			accessibilityState={{ disabled }}
			disabled={disabled}
			hitSlop={8}
			onPress={event => {
				hapticTick();
				onPress?.(event);
			}}
			onPressIn={() => setPressed(true)}
			onPressOut={() => setPressed(false)}
			style={styles.root}
			testID={testID}>
			<NativeText style={styles.label}>
				{children}
			</NativeText>
		</Pressable>
	);
};

const styles = StyleSheet.create(theme => ({
	root: {
		alignItems: "center",
		justifyContent: "center",
		variants: {
			size: { sm: {}, md: {} },
			pressed: { true: {}, false: {} },
			disabled: { true: {}, false: {} },
		},
	},
	label: {
		...theme.font.body.medium,
		color: theme.color.primary,
		textDecorationLine: "underline",
		variants: {
			size: {
				sm: theme.font.body.small,
				md: theme.font.body.medium,
			},
			pressed: {
				true: { color: theme.color.onPrimaryContainer },
				false: {},
			},
			disabled: {
				true: {
					color: theme.color.disabled.fg,
					textDecorationLine: "none",
				},
				false: {},
			},
		},
	},
}));

type LinkNamespace = Readonly<{ Root: typeof Root }>;

/**
 * The one link: brand-toned, underlined text that navigates rather than acts,
 * announced with the link role so a screen reader says which of the two it is.
 * A link with nowhere to go is `disabled`, which drops the underline so it does
 * not promise a destination it has not got.
 *
 * @example
 *   <ExpoLink href="/register" asChild>
 *   	<Link.Root>{m.login_register()}</Link.Root>
 *   </ExpoLink>
 */
export const Link: LinkNamespace = { Root };
