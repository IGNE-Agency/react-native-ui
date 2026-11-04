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
	FIELD_ARG_TYPES,
	FIELD_COPY,
	requirednessFrom,
} from "../../lib/forms/story-copy";
import { EmailField } from "./email-field";

type EmailFieldStoryArgs = Omit<
	ComponentProps<typeof EmailField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Email";
const PLACEHOLDER = "name@example.com";

const ControlledEmailField = ({
	requiredness,
	...args
}: EmailFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<EmailField.Root
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
	title: "Presets/EmailField",
	render: (args, { id }) => (
		<ControlledEmailField key={id} {...args} />
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
		clearLabel: CLEAR_LABEL,
		value: "",
		onChangeText: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
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
			],
		},
	},
} satisfies Meta<EmailFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
