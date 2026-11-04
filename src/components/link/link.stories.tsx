import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { Link } from "./link";

const LABEL = "Forgot your password?";

const meta = {
	component: Link.Root,
	args: {
		children: LABEL,
		size: "md",
		disabled: false,
		onPress: () => {},
	},
	argTypes: {
		children: { control: "text" },
		size: { control: "radio", options: ["sm", "md"] },
	},
	parameters: {
		controls: { include: ["children", "size", "disabled"] },
	},
} satisfies Meta<typeof Link.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
