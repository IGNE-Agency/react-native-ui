import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Tabs, type Tab } from "./tabs";

type TabsStoryArgs = Readonly<{ overflowing: boolean }>;

const INSET = 16;

const TWO_TABS: readonly Tab[] = [
	{ value: "details", label: "Details" },
	{ value: "history", label: "History" },
];

const MANY_TABS: readonly Tab[] = [
	...TWO_TABS,
	{ value: "documents", label: "Documents" },
	{ value: "payments", label: "Payments" },
	{ value: "messages", label: "Messages" },
	{ value: "settings", label: "Settings" },
];

/** Holds the open tab, the way a screen does. */
const StoryTabs = ({
	overflowing,
}: TabsStoryArgs): ReactNode => {
	const tabs = overflowing ? MANY_TABS : TWO_TABS;
	const [value, setValue] = useState("details");
	return (
		<Tabs.Root
			inset={INSET}
			onValueChange={setValue}
			tabs={tabs}
			value={value}>
			<Tabs.Bar />
			<Tabs.Panels>
				{tabs.map(tab => (
					<Tabs.Panel key={tab.value} value={tab.value}>
						<Text style={styles.body}>
							{`The ${tab.label.toLowerCase()} of the record on screen.`}
						</Text>
					</Tabs.Panel>
				))}
			</Tabs.Panels>
		</Tabs.Root>
	);
};

const meta = {
	render: (args, { id }) => (
		<StoryTabs
			key={`${id}-${String(args.overflowing)}`}
			{...args}
		/>
	),
	parameters: { layout: "fullscreen" },
	args: { overflowing: false },
} satisfies Meta<TabsStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const styles = StyleSheet.create(theme => ({
	body: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
}));
