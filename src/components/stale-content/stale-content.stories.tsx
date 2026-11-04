import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { StaleContent } from "./stale-content";

type StaleContentStoryArgs = Readonly<{
	busy: boolean;
	slowLabel: string;
	retryLabel: string;
}>;

const ROWS: readonly string[] = [
	"First row of the kept content",
	"Second row of the kept content",
	"Third row of the kept content",
	"Fourth row of the kept content",
	"Fifth row of the kept content",
];

const StoryStaleContent = ({
	busy,
	slowLabel,
	retryLabel,
}: StaleContentStoryArgs): ReactNode => (
	<StaleContent
		busy={busy}
		retry={{ label: retryLabel, onPress: () => {} }}
		slowLabel={slowLabel}>
		<View style={styles.rows}>
			{ROWS.map(row => (
				<Text key={row} style={styles.row}>
					{row}
				</Text>
			))}
		</View>
	</StaleContent>
);

const meta = {
	title: "Presets/StaleContent",
	render: args => <StoryStaleContent {...args} />,
	args: {
		busy: false,
		slowLabel: "Still updating…",
		retryLabel: "Try again",
	},
	parameters: {
		controls: {
			include: ["busy", "slowLabel", "retryLabel"],
		},
	},
} satisfies Meta<StaleContentStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const styles = StyleSheet.create(theme => ({
	rows: { gap: theme.unit[6] },
	row: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
}));
