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
	DECREMENT_LABEL,
	FIELD_ARG_TYPES,
	FIELD_COPY,
	INCREMENT_LABEL,
	requirednessFrom,
	STORY_LOCALE,
} from "../../lib/forms/story-copy";
import { NumberField } from "./number-field";

type NumberFieldStoryArgs = Omit<
	ComponentProps<typeof NumberField.Root>,
	"requiredness"
> &
	Readonly<{ requiredness: RequirednessVariant }>;

const LABEL = "Guests";
const MIN = 1;
const MAX = 10;
const VALUE = 2;
const STEP = 1;

const ControlledNumberField = ({
	requiredness,
	...args
}: NumberFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<NumberField.Root
			{...args}
			onValueChange={next => {
				args.onValueChange(next);
				setValue(next);
			}}
			requiredness={requirednessFrom(requiredness)}
			value={value}
		/>
	);
};

const meta = {
	render: (args, { id }) => (
		<ControlledNumberField key={id} {...args} />
	),
	args: {
		label: LABEL,
		min: MIN,
		max: MAX,
		step: STEP,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		copy: FIELD_COPY,
		locale: STORY_LOCALE,
		incrementLabel: INCREMENT_LABEL,
		decrementLabel: DECREMENT_LABEL,
		value: VALUE,
		onValueChange: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"min",
				"max",
				"step",
				"description",
				"errors",
				"requiredness",
				"disabled",
			],
		},
	},
} satisfies Meta<NumberFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
