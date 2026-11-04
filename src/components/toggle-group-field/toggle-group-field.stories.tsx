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
	ToggleGroupField,
	type ToggleGroupFieldProps,
} from "./toggle-group-field";

type ToggleGroupFieldStoryArgs = Omit<
	ToggleGroupFieldProps<string>,
	"requiredness"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		unavailableOption: boolean;
	}>;

const LABEL = "Connectors";

const OPTIONS: readonly Option<string>[] = [
	{ value: "type2", label: "Type 2" },
	{ value: "ccs", label: "CCS" },
	{ value: "chademo", label: "CHAdeMO" },
	{ value: "tesla", label: "Tesla" },
	{ value: "schuko", label: "Schuko" },
];

const ControlledToggleGroupField = ({
	requiredness,
	unavailableOption,
	...args
}: ToggleGroupFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<ToggleGroupField
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
		<ControlledToggleGroupField key={id} {...args} />
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
} satisfies Meta<ToggleGroupFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
