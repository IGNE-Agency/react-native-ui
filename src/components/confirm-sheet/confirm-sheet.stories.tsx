import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import type { ToneName } from "../../lib/tone/tone";
import { Button } from "../button/button";
import { Sheet } from "../sheet/sheet";
import { ConfirmSheet } from "./confirm-sheet";

type ConfirmSheetStoryArgs = Readonly<{
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	tone: ToneName;
	answersAfter: number;
	fails: boolean;
}>;

const BEHIND =
	"The screen the sheet asks over. The button asks again.";
const ASK = "Remove the item";
const BUSY_LABEL = "Removing";

const answer = (after: number, fails: boolean) =>
	new Promise<void>((resolve, reject) => {
		setTimeout(
			() =>
				fails
					? reject(new Error("The action failed"))
					: resolve(),
			after,
		);
	});

/** Asks over a screen of its own, and settles a confirm after `answersAfter` milliseconds, rejecting it where it `fails`. */
const StoryConfirmSheet = ({
	answersAfter,
	fails,
	...copy
}: ConfirmSheetStoryArgs): ReactNode => {
	const [open, setOpen] = useState(true);
	return (
		<>
			<Sheet.Behind covered={open}>
				<View style={styles.screen}>
					<Text style={styles.body}>{BEHIND}</Text>
					<Button.Root
						tier="tonal"
						onPress={() => setOpen(true)}>
						<Button.Label>{ASK}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Behind>
			<ConfirmSheet
				{...copy}
				busyLabel={BUSY_LABEL}
				onClose={() => setOpen(false)}
				onConfirm={() => answer(answersAfter, fails)}
				open={open}
			/>
		</>
	);
};

const meta = {
	title: "Presets/ConfirmSheet",
	render: (args, { id }) => (
		<StoryConfirmSheet key={id} {...args} />
	),
	parameters: {
		layout: "fullscreen",
		controls: {
			include: [
				"title",
				"body",
				"confirmLabel",
				"cancelLabel",
				"tone",
				"answersAfter",
				"fails",
			],
		},
	},
	args: {
		title: "Remove this item?",
		body: "The item and its history are removed. This can't be undone.",
		confirmLabel: "Remove",
		cancelLabel: "Keep it",
		tone: "error",
		answersAfter: 1500,
		fails: false,
	},
	argTypes: {
		tone: {
			control: "radio",
			options: ["brand", "error", "neutral"],
		},
		answersAfter: {
			control: { type: "number", min: 0, step: 500 },
		},
	},
} satisfies Meta<ConfirmSheetStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

const styles = StyleSheet.create(theme => ({
	screen: {
		flex: 1,
		gap: theme.unit[6],
		padding: theme.unit[8],
		backgroundColor: theme.color.bg,
	},
	body: {
		...theme.font.body.medium,
		color: theme.color.text,
	},
}));
