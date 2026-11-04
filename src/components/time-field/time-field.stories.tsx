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
	TIME_PLACEHOLDER_MINUTES,
	TIME_PLACEHOLDER_SECONDS,
} from "../../lib/forms/story-copy";
import {
	TimeField,
	type TimeFieldProps,
} from "./time-field";

type TimeFieldStoryArgs = Omit<
	TimeFieldProps,
	"requiredness" | "placeholder"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Starts at";

const ControlledTimeField = ({
	requiredness,
	...args
}: TimeFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<TimeField
			{...args}
			onValueChange={next => {
				args.onValueChange(next);
				setValue(next);
			}}
			placeholder={
				args.precision === "seconds"
					? TIME_PLACEHOLDER_SECONDS
					: TIME_PLACEHOLDER_MINUTES
			}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledTimeField
			key={`${id}-${args.precision}`}
			{...args}
		/>
	),
	args: {
		label: LABEL,
		precision: "minutes",
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		copy: FIELD_COPY,
		value: undefined,
		onValueChange: () => {},
	},
	argTypes: {
		...FIELD_ARG_TYPES,
		precision: {
			control: "radio",
			options: ["minutes", "seconds"],
		},
	},
	parameters: {
		controls: {
			include: [
				"label",
				"precision",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
				"pending",
			],
		},
	},
} satisfies Meta<TimeFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
