import type { FC, ReactNode } from "react";
import { Text as NativeText, View } from "react-native";
import type { SvgProps } from "react-native-svg";
import {
	StyleSheet,
	useUnistyles,
} from "react-native-unistyles";

import { Icon } from "../icon/icon";

type RootProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

type IconProps = Readonly<{
	svg: FC<SvgProps>;
	testID?: string;
}>;

type LabelProps = Readonly<{
	testID?: string;
	children: ReactNode;
}>;

const Root = ({
	testID,
	children,
}: RootProps): ReactNode => (
	<View style={styles.root} testID={testID}>
		{children}
	</View>
);

const TagIcon = ({ svg, testID }: IconProps): ReactNode => {
	const { theme } = useUnistyles();
	return (
		<Icon.Root
			svg={svg}
			size="sm"
			color={theme.color.neutral.fg}
			testID={testID}
		/>
	);
};

const Label = ({
	testID,
	children,
}: LabelProps): ReactNode => (
	<NativeText
		numberOfLines={1}
		style={styles.label}
		testID={testID}>
		{children}
	</NativeText>
);

const styles = StyleSheet.create(theme => ({
	root: {
		alignItems: "center",
		flexDirection: "row",
		gap: theme.unit[2],
		minHeight: theme.unit[12],
		paddingHorizontal: theme.unit[4],
		borderRadius: theme.radius.full,
		backgroundColor: theme.color.neutral.bg,
	},
	label: {
		...theme.font.label.small,
		color: theme.color.neutral.fg,
	},
}));

type TagNamespace = Readonly<{
	Root: typeof Root;
	Icon: typeof TagIcon;
	Label: typeof Label;
}>;

/**
 * A static fact as a tinted pill: an optional glyph and a short label, with no
 * outline.
 *
 * @example
 *   <Tag.Root>
 *   	<Tag.Icon svg={ScheduleIcon} />
 *   	<Tag.Label>{m.item_duration({ minutes })}</Tag.Label>
 *   </Tag.Root>
 */
export const Tag: TagNamespace = {
	Root,
	Icon: TagIcon,
	Label,
};
