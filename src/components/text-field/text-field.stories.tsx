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
	CLEAR_LABEL,
	COUNTER_LABEL,
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import { TextField } from "./text-field";

type TextFieldStoryArgs = Omit<
	ComponentProps<typeof TextField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Name";
const PLACEHOLDER = "For example Anna de Vries";

const ControlledTextField = ({
	requiredness,
	...args
}: TextFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<TextField.Root
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
	render: (args, { id }) => (
		<ControlledTextField key={id} {...args} />
	),
	args: {
		label: LABEL,
		placeholder: PLACEHOLDER,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		labelHidden: false,
		copy: FIELD_COPY,
		clearLabel: CLEAR_LABEL,
		counterLabel: COUNTER_LABEL,
		value: "",
		onChangeText: () => {},
	},
	argTypes: {
		...FIELD_ARG_TYPES,
		maxLength: { control: "number" },
	},
	parameters: {
		controls: {
			include: [
				"label",
				"placeholder",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"readonly",
				"pending",
				"labelHidden",
				"maxLength",
			],
		},
	},
} satisfies Meta<TextFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
