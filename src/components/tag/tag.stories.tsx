import ScheduleIcon from "@material-design-icons/svg/outlined/schedule.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ReactNode } from "react";

import { Tag } from "./tag";

type TagStoryArgs = Readonly<{
	label: string;
	icon: boolean;
}>;

const LABEL = "45 minutes";

const StoryTag = ({
	label,
	icon,
}: TagStoryArgs): ReactNode => (
	<Tag.Root>
		{icon ? <Tag.Icon svg={ScheduleIcon} /> : null}
		<Tag.Label>{label}</Tag.Label>
	</Tag.Root>
);

const meta = {
	render: args => <StoryTag {...args} />,
	args: { label: LABEL, icon: false },
} satisfies Meta<TagStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
