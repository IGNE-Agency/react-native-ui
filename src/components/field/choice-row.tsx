import type { ReactNode } from "react";
import { Text as NativeText, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type ChoiceRowProps = Readonly<{
	label: string;
	disabled: boolean;
	children: ReactNode;
}>;

/**
 * One row of a vertical choice list: the indicator it is given, then the
 * option's label, drawn for the eye alone because the pressable around it
 * carries the name.
 *
 * @example
 *   <ChoiceRow label={option.label} disabled={unavailable}>
 *   	<Checkbox.Box checked={checked} disabled={unavailable} />
 *   </ChoiceRow>;
 */
export const ChoiceRow = ({
	label,
	disabled,
	children,
}: ChoiceRowProps): ReactNode => (
	<View style={styles.row}>
		{children}
		<View aria-hidden style={styles.label}>
			<NativeText
				style={[
					styles.text,
					disabled ? styles.muted : null,
				]}>
				{label}
			</NativeText>
		</View>
	</View>
);

const styles = StyleSheet.create(theme => ({
	row: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[6],
		minHeight: theme.unit[22],
		paddingVertical: theme.unit[4],
	},
	label: { flex: 1 },
	text: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
	muted: { color: theme.color.disabled.fg },
}));
