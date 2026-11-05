import type { ReactNode } from "react";
import { View, type DimensionValue } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Shape = "line" | "block" | "circle";

type RootProps = Readonly<{
	shape?: Shape;
	width?: DimensionValue;
	height?: DimensionValue;
	testID?: string;
}>;

const Root = ({
	shape = "line",
	width,
	height,
	testID,
}: RootProps): ReactNode => {
	styles.useVariants({ shape });
	return (
		<View
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
			style={[styles.root, styles.size(width, height)]}
			testID={testID}
		/>
	);
};

const styles = StyleSheet.create(theme => ({
	root: {
		backgroundColor: theme.color.surfaceHighest,
		variants: {
			shape: {
				line: {
					borderRadius: theme.radius.xs,
					width: "100%",
					height: theme.unit[8],
				},
				block: {
					borderRadius: theme.radius.md,
					width: "100%",
					height: theme.unit[32],
				},
				circle: {
					borderRadius: theme.radius.circle,
					width: theme.unit[28],
					height: theme.unit[28],
				},
			},
		},
	},
	size: (
		width: DimensionValue | undefined,
		height: DimensionValue | undefined,
	) => ({
		...(width === undefined ? {} : { width }),
		...(height === undefined ? {} : { height }),
	}),
}));

type SkeletonNamespace = Readonly<{ Root: typeof Root }>;

/**
 * The placeholder a wait of known shape is drawn as, sized by the caller.
 * Decoration: the wait itself is announced by whatever wraps it.
 *
 * @example
 *   <Skeleton.Root shape="line" width="60%" />
 */
export const Skeleton: SkeletonNamespace = { Root };
