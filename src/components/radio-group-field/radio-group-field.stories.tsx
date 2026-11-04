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
	RadioGroupField,
	type RadioGroupFieldProps,
} from "./radio-group-field";

type RadioGroupFieldStoryArgs = Omit<
	RadioGroupFieldProps<string>,
	"requiredness"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		unavailableOption: boolean;
	}>;

const LABEL = "Appearance";

const OPTIONS: readonly Option<string>[] = [
	{ value: "system", label: "Same as the device" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

const LONG: readonly Option<string>[] = [
	{
		value: "monthly",
		label:
			"Monthly, billed on the first of every month and cancellable at any time",
	},
	{
		value: "yearly",
		label:
			"Yearly, billed once in advance with two months free compared with paying monthly",
	},
];

const ControlledRadioGroupField = ({
	requiredness,
	unavailableOption,
	...args
}: RadioGroupFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<RadioGroupField
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
		<ControlledRadioGroupField key={id} {...args} />
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
} satisfies Meta<RadioGroupFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongLabels: Story = {
	args: { label: "Billing", options: LONG },
};
