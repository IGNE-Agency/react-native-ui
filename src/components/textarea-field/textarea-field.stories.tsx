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
	COUNTER_LABEL,
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import { TextareaField } from "./textarea-field";

type TextareaFieldStoryArgs = Omit<
	ComponentProps<typeof TextareaField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Message";
const PLACEHOLDER = "What would you like to tell us?";

const ControlledTextareaField = ({
	requiredness,
	...args
}: TextareaFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<TextareaField.Root
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
	title: "Presets/TextareaField",
	render: (args, { id }) => (
		<ControlledTextareaField key={id} {...args} />
	),
	args: {
		label: LABEL,
		placeholder: PLACEHOLDER,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		readonly: false,
		pending: false,
		copy: FIELD_COPY,
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
				"maxLength",
			],
		},
	},
} satisfies Meta<TextareaFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
