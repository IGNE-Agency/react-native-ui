import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { PullToRefresh } from "../pull-to-refresh/pull-to-refresh";

type PullToRefreshStoryArgs = Readonly<{
	answersAfter: number;
}>;

const ROWS: readonly string[] = Array.from(
	{ length: 24 },
	(_, index) => `Row ${index + 1}`,
);

/** Answers each pull after `answersAfter` milliseconds, the way a request would. */
const StoryPullToRefresh = ({
	answersAfter,
}: PullToRefreshStoryArgs): ReactNode => {
	const [busy, setBusy] = useState(false);
	return (
		<PullToRefresh
			busy={busy}
			contentContainerStyle={styles.content}
			onRefresh={() => {
				setBusy(true);
				setTimeout(() => setBusy(false), answersAfter);
			}}>
			{ROWS.map(row => (
				<Text key={row} style={styles.row}>
					{row}
				</Text>
			))}
		</PullToRefresh>
	);
};

const meta = {
	render: args => <StoryPullToRefresh {...args} />,
	parameters: {
		layout: "fullscreen",
		controls: { include: ["answersAfter"] },
	},
	args: { answersAfter: 1500 },
	argTypes: {
		answersAfter: {
			control: { type: "number", min: 0, step: 500 },
		},
	},
} satisfies Meta<PullToRefreshStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const styles = StyleSheet.create(theme => ({
	content: {
		gap: theme.unit[8],
		padding: theme.unit[8],
	},
	row: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
}));
