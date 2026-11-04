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
} from "../../lib/forms/story-copy";
import {
	CheckboxField,
	type CheckboxFieldProps,
} from "./checkbox-field";

type CheckboxFieldStoryArgs = Omit<
	CheckboxFieldProps,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "I agree to the terms";
const LONG_LABEL =
	"I agree to the terms of service and the privacy statement, and to receiving the order confirmation by email";

const ControlledCheckboxField = ({
	requiredness,
	...args
}: CheckboxFieldStoryArgs): ReactNode => {
	const [checked, setChecked] = useState(args.checked);
	return (
		<CheckboxField.Root
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
		<ControlledCheckboxField key={id} {...args} />
	),
	args: {
		label: LABEL,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		copy: FIELD_COPY,
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
			],
		},
	},
} satisfies Meta<CheckboxFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongLabel: Story = {
	args: { label: LONG_LABEL, requiredness: "required" },
};
