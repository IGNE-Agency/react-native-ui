import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
	SWITCH_OFF_LABEL,
	SWITCH_ON_LABEL,
} from "../../lib/forms/story-copy";
import {
	SwitchField,
	type SwitchFieldProps,
} from "./switch-field";

type SwitchFieldStoryArgs = Omit<
	SwitchFieldProps,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Email me a receipt";
const LONG_LABEL =
	"Email me a receipt for every order, and a monthly overview of everything I bought that month";

const ControlledSwitchField = ({
	requiredness,
	...args
}: SwitchFieldStoryArgs): ReactNode => {
	const [checked, setChecked] = useState(args.checked);
	return (
		<SwitchField.Root
			{...args}
			checked={checked}
			onCheckedChange={next => {
				args.onCheckedChange(next);
				setChecked(next);
			}}
			requiredness={requirednessFrom(requiredness)}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledSwitchField key={id} {...args} />
	),
	args: {
		label: LABEL,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		pending: false,
		copy: FIELD_COPY,
		onLabel: SWITCH_ON_LABEL,
		offLabel: SWITCH_OFF_LABEL,
		checked: false,
		onCheckedChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"pending",
			],
		},
	},
} satisfies Meta<SwitchFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongLabel: Story = {
	args: { label: LONG_LABEL, requiredness: "optional" },
};
