import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { useState, type ReactNode } from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import type { Option } from "../../lib/forms/option";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
	withLastUnavailable,
} from "../../lib/forms/story-copy";
import {
	SegmentedControlField,
	type SegmentedControlFieldProps,
} from "./segmented-control-field";

type SegmentedControlFieldStoryArgs = Omit<
	SegmentedControlFieldProps<string>,
	"requiredness"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		unavailableOption: boolean;
	}>;

const LABEL = "Pets allowed";

const OPTIONS: readonly Option<string>[] = [
	{ value: "yes", label: "Yes" },
	{ value: "no", label: "No" },
];

const MANY: readonly Option<string>[] = [
	{ value: "mon", label: "Mon" },
	{ value: "tue", label: "Tue" },
	{ value: "wed", label: "Wed" },
	{ value: "thu", label: "Thu" },
	{ value: "fri", label: "Fri" },
	{ value: "sat", label: "Sat" },
	{ value: "sun", label: "Sun" },
];

const ControlledSegmentedControlField = ({
	requiredness,
	unavailableOption,
	...args
}: SegmentedControlFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<SegmentedControlField
			{...args}
			onValueChange={next => {
				args.onValueChange(next);
				setValue(next);
			}}
			options={withLastUnavailable(
				args.options,
				unavailableOption,
			)}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledSegmentedControlField key={id} {...args} />
	),
	args: {
		label: LABEL,
		unavailableOption: false,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		copy: FIELD_COPY,
		options: OPTIONS,
		value: undefined,
		onValueChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"unavailableOption",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
			],
		},
	},
} satisfies Meta<SegmentedControlFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ManyOptions: Story = {
	args: { label: "Day", options: MANY },
};
