import type { ReactNode } from "react";
import {
	ActivityIndicator,
	Text as NativeText,
	View,
} from "react-native";
import {
	StyleSheet,
	withUnistyles,
} from "react-native-unistyles";

import { useLiveRegion } from "../../lib/a11y/live-region";

type RootProps = Readonly<{
	/** What the wait is announced as, such as "Loading". */
	label: string;
	testID?: string;
	children: ReactNode;
}>;

type IndicatorProps = Readonly<{
	size?: "sm" | "md";
	/** What the indicator is announced as when it stands alone. Without one it is decoration. */
	label?: string;
	testID?: string;
}>;

type LabelProps = Readonly<{
	testID?: string;
	children: string;
}>;

const ThemedIndicator = withUnistyles(
	ActivityIndicator,
	theme => ({ color: theme.color.textMuted }),
);

const Root = ({
	label,
	testID,
	children,
}: RootProps): ReactNode => {
	const live = useLiveRegion(label);

	return (
		<View
			{...live}
			accessible
			accessibilityLabel={label}
			accessibilityRole="progressbar"
			style={styles.root}
			testID={testID}>
			{children}
		</View>
	);
};

const Indicator = ({
	size = "md",
	label,
	testID,
}: IndicatorProps): ReactNode => (
	<ThemedIndicator
		size={size === "sm" ? "small" : "large"}
		accessible={label !== undefined}
		accessibilityRole={label ? "progressbar" : undefined}
		accessibilityLabel={label}
		accessibilityElementsHidden={label === undefined}
		importantForAccessibility={
			label === undefined ? "no-hide-descendants" : "yes"
		}
		testID={testID}
	/>
);

const Label = ({
	testID,
	children,
}: LabelProps): ReactNode => (
	<NativeText style={styles.label} testID={testID}>
		{children}
	</NativeText>
);

const styles = StyleSheet.create(theme => ({
	root: {
		alignItems: "center",
		gap: theme.unit[4],
	},
	label: {
		...theme.font.body.medium,
		color: theme.color.textMuted,
	},
}));

type SpinnerNamespace = Readonly<{
	Root: typeof Root;
	Indicator: typeof Indicator;
	Label: typeof Label;
}>;

/**
 * The indeterminate wait indicator, as parts. `Indicator` stands alone in a
 * button or a tile; `Root` groups it with its `Label` as one progress
 * indicator, announced as `label` when it appears.
 *
 * @example
 *   <Spinner.Root label={m.items_loading()}>
 *   	<Spinner.Indicator />
 *   	<Spinner.Label>{m.items_loading()}</Spinner.Label>
 *   </Spinner.Root>
 */
export const Spinner: SpinnerNamespace = {
	Root,
	Indicator,
	Label,
};
