import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import {
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Button } from "../button/button";
import { Sheet } from "./sheet";

type SheetStoryArgs = Readonly<{
	dismissable: boolean;
	swipeable: boolean;
	back: boolean;
}>;

type SheetOverScreenProps = Omit<
	ComponentProps<typeof Sheet.Root>,
	"onIndexChange"
>;

const TITLE = "Delivery options";
const BODY =
	"Choose when your order arrives. You can change this until it ships.";
const BEHIND =
	"The screen the sheet belongs to. A closed sheet comes back with the button.";
const OPEN = "Show the sheet";
const CLOSE_LABEL = "Close";
const BACK_LABEL = "Back";

/**
 * The sheet over a screen of its own, which brings it back once it has been
 * closed, the way a screen holding the selection would.
 */
const SheetOverScreen = (
	props: SheetOverScreenProps,
): ReactNode => {
	const [open, setOpen] = useState(true);
	return (
		<>
			<Sheet.Behind covered={open && props.modal === true}>
				<View style={styles.screen}>
					<Text style={styles.body}>{BEHIND}</Text>
					<Button.Root
						tier="tonal"
						onPress={() => setOpen(true)}>
						<Button.Label>{OPEN}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Behind>
			{open ? (
				<Sheet.Root
					{...props}
					onIndexChange={index => {
						if (index === -1) {
							setOpen(false);
						}
					}}
				/>
			) : null}
		</>
	);
};

const StorySheet = ({
	dismissable,
	swipeable,
	back,
}: SheetStoryArgs): ReactNode => (
	<SheetOverScreen
		dismissable={dismissable}
		snapPoints={["35%", "70%"]}
		swipeable={swipeable}>
		<Sheet.Content>
			<Sheet.Header
				back={
					back
						? { label: BACK_LABEL, onPress: () => {} }
						: undefined
				}
				closeLabel={dismissable ? CLOSE_LABEL : undefined}>
				<Sheet.Title>{TITLE}</Sheet.Title>
			</Sheet.Header>
			<Text style={styles.body}>{BODY}</Text>
		</Sheet.Content>
	</SheetOverScreen>
);

const STACKED_TITLE = "Sheet";
const STACKED_BODY =
	"A sheet opened from here stacks over this one, which steps back behind it.";
const OPEN_ANOTHER = "Open another sheet";
const OPEN_FIRST = "Open the first sheet";
const STACKED_BEHIND =
	"The screen under the stack. The button opens its first sheet again.";

type StackedSheetProps = Readonly<{
	depth: number;
	onClosed: () => void;
}>;

/** A modal sheet at `depth` whose own content opens the next one. */
const StackedSheet = ({
	depth,
	onClosed,
}: StackedSheetProps): ReactNode => {
	const [next, setNext] = useState(false);
	return (
		<Sheet.Root
			dismissable
			modal
			onIndexChange={index => {
				if (index === -1) {
					onClosed();
				}
			}}
			snapPoints={["85%"]}
			testID={`stacked-sheet-${String(depth)}`}>
			<Sheet.Content>
				<Sheet.Header closeLabel={CLOSE_LABEL}>
					<Sheet.Title>{`${STACKED_TITLE} ${String(depth)}`}</Sheet.Title>
				</Sheet.Header>
				<Text style={styles.body}>{STACKED_BODY}</Text>
				<Button.Root
					tier="tonal"
					onPress={() => setNext(true)}
					testID={`stacked-sheet-${String(depth)}-open`}>
					<Button.Label>{OPEN_ANOTHER}</Button.Label>
				</Button.Root>
				{next ? (
					<StackedSheet
						depth={depth + 1}
						onClosed={() => setNext(false)}
					/>
				) : null}
			</Sheet.Content>
		</Sheet.Root>
	);
};

/** A screen whose sheet opens another from inside itself, as deep as it is asked to. */
const StoryStacked = (): ReactNode => {
	const [open, setOpen] = useState(true);
	return (
		<>
			<Sheet.Behind covered={open}>
				<View style={styles.screen}>
					<Text style={styles.body}>{STACKED_BEHIND}</Text>
					<Button.Root
						tier="tonal"
						onPress={() => setOpen(true)}>
						<Button.Label>{OPEN_FIRST}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Behind>
			{open ? (
				<StackedSheet
					depth={1}
					onClosed={() => setOpen(false)}
				/>
			) : null}
		</>
	);
};

const meta = {
	render: (args, { id }) => (
		<StorySheet
			key={`${id}-${String(args.dismissable)}-${String(args.swipeable)}-${String(args.back)}`}
			{...args}
		/>
	),
	parameters: {
		layout: "fullscreen",
		controls: {
			include: ["dismissable", "swipeable", "back"],
		},
	},
	args: {
		dismissable: false,
		swipeable: true,
		back: false,
	},
} satisfies Meta<SheetStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Stacked: Story = {
	render: (_args, { id }) => <StoryStacked key={id} />,
	parameters: { controls: { include: [] } },
};

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
