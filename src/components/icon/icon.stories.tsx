import StarIcon from "@material-design-icons/svg/outlined/star.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";

import { Icon } from "./icon";

const meta = {
	component: Icon.Root,
	args: { svg: StarIcon, size: "md" },
	argTypes: {
		size: {
			control: "radio",
			options: ["xs", "sm", "md", "lg"],
		},
		label: { control: "text" },
	},
	parameters: {
		controls: { include: ["size", "label"] },
	},
} satisfies Meta<typeof Icon.Root>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
