import ErrorIcon from "@material-design-icons/svg/outlined/error_outline.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ReactNode } from "react";

import { ErrorMessage } from "./error-message";

type ErrorMessageStoryArgs = Readonly<{
	title: string;
	body: string;
	icon: boolean;
	retry: boolean;
}>;

const RETRY = "Try again";

const StoryErrorMessage = ({
	title,
	body,
	icon,
	retry,
}: ErrorMessageStoryArgs): ReactNode => (
	<ErrorMessage
		body={body === "" ? undefined : body}
		icon={icon ? ErrorIcon : undefined}
		retry={
			retry
				? { label: RETRY, onPress: () => {} }
				: undefined
		}
		title={title}
	/>
);

const meta = {
	title: "Presets/ErrorMessage",
	render: args => <StoryErrorMessage {...args} />,
	args: {
		title: "Something went wrong",
		body: "The items could not be loaded.",
		icon: true,
		retry: true,
	},
	parameters: {
		controls: {
			include: ["title", "body", "icon", "retry"],
		},
	},
} satisfies Meta<ErrorMessageStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
