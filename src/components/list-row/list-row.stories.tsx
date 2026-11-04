import LogoutIcon from "@material-design-icons/svg/outlined/logout.svg";
import SettingsIcon from "@material-design-icons/svg/outlined/settings.svg";
import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import type { ComponentProps, ReactNode } from "react";

import { ListRow } from "./list-row";

type ListRowStoryArgs = Pick<
	ComponentProps<typeof ListRow.Action>,
	"label" | "tone" | "busy" | "disabled"
> &
	Readonly<{ kind: "link" | "action"; tag: string }>;

const LABEL = "Sign out";
const BUSY_LABEL = "Signing out";

const StoryListRow = ({
	kind,
	label,
	tone,
	tag,
	busy,
	disabled,
}: ListRowStoryArgs): ReactNode => {
	const shownTag = tag === "" ? undefined : tag;
	return kind === "link" ? (
		<ListRow.Link
			label={label}
			onPress={() => {}}
			svg={SettingsIcon}
			tag={shownTag}
			tone={tone}
		/>
	) : (
		<ListRow.Action
			busy={busy}
			busyLabel={BUSY_LABEL}
			disabled={disabled}
			label={label}
			onPress={() => {}}
			svg={LogoutIcon}
			tag={shownTag}
			tone={tone}
		/>
	);
};

const meta = {
	title: "Presets/ListRow",
	render: args => <StoryListRow {...args} />,
	args: {
		kind: "action",
		label: LABEL,
		tone: "neutral",
		tag: "",
		busy: false,
		disabled: false,
	},
	argTypes: {
		kind: { control: "radio", options: ["link", "action"] },
		tone: {
			control: "radio",
			options: ["neutral", "error"],
		},
		busy: {
			control: "boolean",
			if: { arg: "kind", eq: "action" },
		},
		disabled: {
			control: "boolean",
			if: { arg: "kind", eq: "action" },
		},
	},
} satisfies Meta<ListRowStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
