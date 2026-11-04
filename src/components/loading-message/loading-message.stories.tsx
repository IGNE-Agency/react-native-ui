import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { LoadingMessage } from "./loading-message";

const meta = {
	title: "Presets/LoadingMessage",
	component: LoadingMessage,
	args: { title: "Loading the items" },
	parameters: { controls: { include: ["title"] } },
} satisfies Meta<typeof LoadingMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
