import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { useAppForm } from "../../lib/forms/app-form";
import { FIELD_COPY } from "../../lib/forms/story-copy";
import { Button } from "../button/button";
import { Form } from "../form/form";
import { Sheet, type SheetStops } from "../sheet/sheet";
import {
	LeaveGuardSheet,
	useLeaveGuard,
} from "./leave-guard";

type LeaveGuardStoryArgs = Readonly<{
	title: string;
	body: string;
	confirmLabel: string;
	cancelLabel: string;
	dirty: boolean;
}>;

const ON_SCREEN = "The guarded screen.";
const LEAVE = "Leave the screen";
const LEFT = "The screen was left.";
const RETURN = "Go back to it";

/** The guarded screen, whose Leave button stands in for a router's back and is held while it is `dirty`. */
const GuardedScreen = ({
	dirty,
	onLeave,
	...copy
}: LeaveGuardStoryArgs &
	Readonly<{ onLeave: () => void }>): ReactNode => {
	const guard = useLeaveGuard(dirty);

	return (
		<>
			<Sheet.Behind covered={guard.asking}>
				<View style={styles.screen}>
					<Text style={styles.body}>{ON_SCREEN}</Text>
					<Button.Root
						tier="tonal"
						onPress={() =>
							guard.blocking
								? guard.hold(onLeave)
								: onLeave()
						}>
						<Button.Label>{LEAVE}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Behind>
			<LeaveGuardSheet {...copy} guard={guard} />
		</>
	);
};

/** The guarded screen, or the place it was left for with a way back to a fresh one. */
const StoryLeaveGuard = (
	args: LeaveGuardStoryArgs,
): ReactNode => {
	const [left, setLeft] = useState(false);

	return left ? (
		<View style={styles.screen}>
			<Text style={styles.body}>{LEFT}</Text>
			<Button.Root
				tier="tonal"
				onPress={() => setLeft(false)}>
				<Button.Label>{RETURN}</Button.Label>
			</Button.Root>
		</View>
	) : (
		<GuardedScreen
			{...args}
			onLeave={() => setLeft(true)}
		/>
	);
};

type SheetCopy = Omit<LeaveGuardStoryArgs, "dirty">;

const NO_NOTE = "No note yet.";
const EDIT = "Edit the note";
const SHEET_TITLE = "Note";
const NOTE_LABEL = "Your note";
const CLOSE_LABEL = "Close";
const SAVE = "Save";
const SAVING = "Saving";

/**
 * A note edited in a guarded sheet over a screen. Typing makes it unsaved, and
 * the close control, the back press, the scrim and a swipe down then ask
 * through the guard's sheet, stacked over the note's. Closing discards it.
 */
const StoryGuardedSheet = (copy: SheetCopy): ReactNode => {
	const [open, setOpen] = useState(true);
	const [note, setNote] = useState("");
	const stops = useRef<SheetStops>(null);
	const form = useAppForm({
		defaultValues: { note },
		onSubmit: ({ value, formApi }) => {
			setNote(value.note);
			formApi.reset(value);
			stops.current?.close();
		},
	});
	const guard = useLeaveGuard();

	return (
		<>
			<Sheet.Behind covered={open}>
				<View style={styles.screen}>
					<Text style={styles.body}>
						{note === "" ? NO_NOTE : note}
					</Text>
					<Button.Root
						tier="tonal"
						onPress={() => setOpen(true)}
						testID="note-edit">
						<Button.Label>{EDIT}</Button.Label>
					</Button.Root>
				</View>
			</Sheet.Behind>
			{open ? (
				<Form.Root form={form}>
					<Sheet.Root
						dismissable
						guard={guard}
						modal
						onIndexChange={index => {
							if (index === -1) {
								form.reset();
								setOpen(false);
							}
						}}
						snapPoints={["85%"]}
						stops={stops}
						testID="note-sheet">
						<Sheet.Content>
							<Sheet.Header
								closeLabel={CLOSE_LABEL}
								closeTestID="note-sheet-close">
								<Sheet.Title>{SHEET_TITLE}</Sheet.Title>
							</Sheet.Header>
							<form.AppField name="note">
								{field => (
									<field.TextField
										copy={FIELD_COPY}
										label={NOTE_LABEL}
										requiredness="optional"
										testID="note-field"
									/>
								)}
							</form.AppField>
							<Form.Submit
								busyLabel={SAVING}
								testID="note-save">
								<Button.Label>{SAVE}</Button.Label>
							</Form.Submit>
						</Sheet.Content>
					</Sheet.Root>
				</Form.Root>
			) : null}
			<LeaveGuardSheet
				{...copy}
				guard={guard}
				testID="note-leave"
			/>
		</>
	);
};

const meta = {
	title: "Presets/LeaveGuardSheet",
	render: (args, { id }) => (
		<StoryLeaveGuard key={id} {...args} />
	),
	parameters: {
		layout: "fullscreen",
		controls: {
			include: [
				"title",
				"body",
				"confirmLabel",
				"cancelLabel",
				"dirty",
			],
		},
	},
	args: {
		title: "Discard your changes?",
		body: "You changed this form and haven't saved it.",
		confirmLabel: "Discard changes",
		cancelLabel: "Keep editing",
		dirty: true,
	},
} satisfies Meta<LeaveGuardStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InASheet: Story = {
	render: (
		{ title, body, confirmLabel, cancelLabel },
		{ id },
	) => (
		<StoryGuardedSheet
			key={id}
			body={body}
			cancelLabel={cancelLabel}
			confirmLabel={confirmLabel}
			title={title}
		/>
	),
	parameters: {
		controls: {
			include: [
				"title",
				"body",
				"confirmLabel",
				"cancelLabel",
			],
		},
	},
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
