import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { Avatar } from "./avatar";

const NAME = "Ada Lovelace";

const meta = {
	component: Avatar.Root,
	args: { name: NAME },
	argTypes: { name: { control: "text" } },
} satisfies Meta<typeof Avatar.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
