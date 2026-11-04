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
	HIDE_PASSWORD_LABEL,
	PASSWORD_STRENGTH_COPY,
	requirednessFrom,
	SHOW_PASSWORD_LABEL,
	STORY_LOCALE,
} from "../../lib/forms/story-copy";
import { PasswordField } from "./password-field";

type PasswordFieldStoryArgs = Omit<
	ComponentProps<typeof PasswordField.Root>,
	"requiredness" | "strength"
> &
	Readonly<{
		requiredness: RequirednessVariant;
		strength: boolean;
	}>;

const LABEL = "Password";

const ControlledPasswordField = ({
	requiredness,
	strength,
	...args
}: PasswordFieldStoryArgs): ReactNode => {
	const [value, setValue] = useState(args.value);
	return (
		<PasswordField.Root
			{...args}
			autoComplete={
				strength ? "new-password" : "current-password"
			}
			onChangeText={next => {
				args.onChangeText(next);
				setValue(next);
			}}
			requiredness={requirednessFrom(requiredness)}
			strength={
				strength
					? {
							locale: STORY_LOCALE,
							copy: PASSWORD_STRENGTH_COPY,
						}
					: undefined
			}
			value={value}
		/>
	);
};

const meta = {
	title: "Presets/PasswordField",
	render: (args, { id }) => (
		<ControlledPasswordField key={id} {...args} />
	),
	args: {
		label: LABEL,
		errors: "",
		requiredness: "unstated",
		disabled: false,
		strength: false,
		copy: FIELD_COPY,
		showPasswordLabel: SHOW_PASSWORD_LABEL,
		hidePasswordLabel: HIDE_PASSWORD_LABEL,
		value: "",
		onChangeText: () => {},
	},
	argTypes: FIELD_ARG_TYPES,
	parameters: {
		controls: {
			include: [
				"label",
				"description",
				"errors",
				"requiredness",
				"disabled",
				"strength",
			],
		},
	},
} satisfies Meta<PasswordFieldStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
