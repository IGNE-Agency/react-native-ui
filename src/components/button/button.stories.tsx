import AddIcon from "@material-design-icons/svg/outlined/add.svg";
import CheckIcon from "@material-design-icons/svg/outlined/check.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ComponentProps, ReactNode } from "react";

import { Button } from "./button";

type ButtonContent =
	| "label"
	| "icon and label"
	| "icon only";

type ButtonStoryArgs = Pick<
	ComponentProps<typeof Button.Root>,
	| "tier"
	| "tone"
	| "size"
	| "disabled"
	| "busy"
	| "busyLabel"
> &
	Readonly<{ label: string; content: ButtonContent }>;

const LABEL = "Save changes";
const BUSY_LABEL = "Saving your changes";

const StoryButton = ({
	label,
	content,
	...button
}: ButtonStoryArgs): ReactNode =>
	content === "icon only" ? (
		<Button.Root
			{...button}
			iconOnly
			label={label}
			onPress={() => {}}>
			<Button.Icon svg={AddIcon} />
		</Button.Root>
	) : (
		<Button.Root {...button} onPress={() => {}}>
			{content === "icon and label" ? (
				<Button.Icon svg={CheckIcon} />
			) : null}
			<Button.Label>{label}</Button.Label>
		</Button.Root>
	);

const meta = {
	render: args => <StoryButton {...args} />,
	args: {
		label: LABEL,
		content: "label",
		tier: "solid",
		tone: "brand",
		size: "md",
		disabled: false,
		busy: false,
		busyLabel: BUSY_LABEL,
	},
	argTypes: {
		content: {
			control: "radio",
			options: ["label", "icon and label", "icon only"],
		},
		tier: {
			control: "radio",
			options: ["solid", "tonal", "ghost"],
		},
		tone: {
			control: "select",
			options: [
				"brand",
				"success",
				"info",
				"warning",
				"error",
				"neutral",
			],
		},
		size: { control: "radio", options: ["sm", "md", "lg"] },
	},
	parameters: {
		controls: {
			include: [
				"label",
				"content",
				"tier",
				"tone",
				"size",
				"disabled",
				"busy",
			],
		},
	},
} satisfies Meta<ButtonStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
