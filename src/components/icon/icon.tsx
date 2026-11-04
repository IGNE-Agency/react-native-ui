import type { FC, ReactNode } from "react";
import type { SvgProps } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";

type IconSize = "xs" | "sm" | "md" | "lg";

type RootProps = Readonly<{
	svg: FC<SvgProps>;
	size?: IconSize;
	color?: string;
	label?: string;
	testID?: string;
}>;

const Root = ({
	svg: Svg,
	size = "md",
	color,
	label,
	testID,
}: RootProps): ReactNode => {
	const { theme } = useUnistyles();
	const side = {
		xs: theme.unit[4],
		sm: theme.unit[8],
		md: theme.unit[10],
		lg: theme.unit[12],
	}[size];
	return (
		<Svg
			width={side}
			height={side}
			testID={testID}
			fill={color ?? theme.color.text}
			accessible={label !== undefined}
			accessibilityRole={label ? "image" : undefined}
			accessibilityLabel={label}
			accessibilityElementsHidden={label === undefined}
			importantForAccessibility={
				label === undefined ? "no-hide-descendants" : "yes"
			}
		/>
	);
};

type IconNamespace = Readonly<{ Root: typeof Root }>;

/**
 * A glyph from the outlined Material set, sized from the length scale and
 * coloured by a role the caller reads. Without a `label` it is decoration and
 * hidden from a screen reader.
 *
 * @example
 *   <Icon.Root svg={SearchIcon} size="sm" />
 */
export const Icon: IconNamespace = { Root };
