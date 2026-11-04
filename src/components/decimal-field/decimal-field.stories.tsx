import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import {
	useState,
	type ComponentProps,
	type ReactNode,
} from "react";

import type { RequirednessVariant } from "../../lib/forms/field-state";
import {
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import { DecimalField } from "./decimal-field";

type DecimalFieldStoryArgs = Omit<
	ComponentProps<typeof DecimalField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Weight in kilograms";
const UNIT = "kg";
const PLACEHOLDER = "0.0";

const ControlledDecimalField = ({
	requiredness,
	...args
}: DecimalFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<DecimalField.Root
			{...args}
			onChangeText={next => {
				args.onChangeText(next);
				setValue(next);
			}}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	title: "Presets/DecimalField",
	render: (args, { id }) => (
		<ControlledDecimalField key={id} {...args} />
	),
	args: {
		label: LABEL,
		placeholder: PLACEHOLDER,
		unit: UNIT,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		copy: FIELD_COPY,
		value: "",
		onChangeText: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"placeholder",
				"unit",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
				"pending",
			],
		},
	},
} satisfies Meta<DecimalFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
