import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { LoadingIndicator } from "./loading-indicator";

const meta = {
	title: "Presets/LoadingIndicator",
	component: LoadingIndicator,
	args: { label: "Loading", size: "md", immediate: false },
	argTypes: {
		size: { control: "radio", options: ["sm", "md"] },
	},
	parameters: {
		controls: { include: ["label", "size", "immediate"] },
	},
} satisfies Meta<typeof LoadingIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
