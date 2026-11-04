import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { Skeleton } from "./skeleton";

const meta = {
	component: Skeleton.Root,
	args: { shape: "line" },
	argTypes: {
		shape: {
			control: "radio",
			options: ["line", "block", "circle"],
		},
		width: { control: "number" },
		height: { control: "number" },
	},
} satisfies Meta<typeof Skeleton.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
