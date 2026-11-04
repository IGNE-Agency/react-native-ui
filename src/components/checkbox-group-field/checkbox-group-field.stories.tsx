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
	CheckboxGroupField,
	type CheckboxGroupFieldProps,
} from "./checkbox-group-field";

type CheckboxGroupFieldStoryArgs = Omit<
	CheckboxGroupFieldProps<string>,
	"requiredness"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		unavailableOption: boolean;
	}>;

const LABEL = "Facilities";

const OPTIONS: readonly Option<string>[] = [
	{ value: "parking", label: "Parking" },
	{ value: "wifi", label: "Wi-Fi" },
	{ value: "breakfast", label: "Breakfast" },
	{ value: "pool", label: "Swimming pool" },
];

const LONG: readonly Option<string>[] = [
	{
		value: "parking",
		label:
			"Parking on site, with a charging point for electric cars at no extra cost",
	},
	{
		value: "breakfast",
		label:
			"Breakfast served in the room or downstairs, with vegetarian and gluten-free choices",
	},
];

const ControlledCheckboxGroupField = ({
	requiredness,
	unavailableOption,
	...args
}: CheckboxGroupFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<CheckboxGroupField
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
		<ControlledCheckboxGroupField key={id} {...args} />
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
		value: [],
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
} satisfies Meta<CheckboxGroupFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongLabels: Story = {
	args: { options: LONG },
};
