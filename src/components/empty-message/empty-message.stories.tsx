import InboxIcon from "@material-design-icons/svg/outlined/inbox.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ReactNode } from "react";

import { EmptyMessage } from "./empty-message";

type EmptyMessageStoryArgs = Readonly<{
	title: string;
	body: string;
	icon: boolean;
	action: boolean;
}>;

const ACTION = "Add an item";

const StoryEmptyMessage = ({
	title,
	body,
	icon,
	action,
}: EmptyMessageStoryArgs): ReactNode => (
	<EmptyMessage
		action={
			action
				? { label: ACTION, onPress: () => {} }
				: undefined
		}
		body={body === "" ? undefined : body}
		icon={icon ? InboxIcon : undefined}
		title={title}
	/>
);

const meta = {
	title: "Presets/EmptyMessage",
	render: args => <StoryEmptyMessage {...args} />,
	args: {
		title: "Nothing here yet",
		body: "Items you add show up in this list.",
		icon: true,
		action: false,
	},
	parameters: {
		controls: {
			include: ["title", "body", "icon", "action"],
		},
	},
} satisfies Meta<EmptyMessageStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
