import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type StateLayerProps = Readonly<{
	color: string;
	pressed: boolean;
}>;

/**
 * The wash a pressed control wears: its own ink laid over its fill at the
 * pressed state's opacity. Render it first inside a host that clips to its
 * corners.
 *
 * @example
 *   <Pressable style={styles.row}>
 *   	<StateLayer color={theme.color.text} pressed={pressed} />
 *   	{children}
 *   </Pressable>;
 */
export const StateLayer = ({
	color,
	pressed,
}: StateLayerProps): ReactNode =>
	pressed ? (
		<View
			pointerEvents="none"
			style={styles.layer(color)}
		/>
	) : null;

const styles = StyleSheet.create(theme => ({
	layer: (color: string) => ({
		...StyleSheet.absoluteFillObject,
		backgroundColor: color,
		opacity: theme.state.pressed,
	}),
}));
