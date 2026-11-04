import {
	SheetHost,
	TimeZoneProvider,
} from "@maanlamp/react-native-ui";
import type { SysTheme } from "@maanlamp/react-native-ui/theme";
import type { Preview } from "@storybook/react-native";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const TIME_ZONE = "Europe/Amsterdam";

/**
 * Every story sits on the theme's page colour, so dark mode reads true, and in
 * one time zone, the way an app provides its users' zone. Its sheets are drawn
 * in a host outside that zone, the way an app mounts one at its root. A story
 * of a whole screen sets `layout: "fullscreen"` and gets it without the gutter.
 */
const preview: Preview = {
	decorators: [
		(Story, { parameters }) => (
			<SheetHost>
				<TimeZoneProvider zone={TIME_ZONE}>
					<View
						style={
							parameters["layout"] === "fullscreen"
								? styles.page
								: [styles.page, styles.gutter]
						}>
						<Story />
					</View>
				</TimeZoneProvider>
			</SheetHost>
		),
	],
};

const styles = StyleSheet.create((theme: SysTheme) => ({
	page: {
		flex: 1,
		backgroundColor: theme.color.bg,
	},
	gutter: { padding: theme.unit[8] },
}));

export default preview;
