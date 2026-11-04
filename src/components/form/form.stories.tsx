import type {
	Meta,
	StoryObj,
} from "@storybook/react-native";
import { revalidateLogic } from "@tanstack/react-form";
import type { ReactNode } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import * as z from "zod";

import { useAppForm } from "../../lib/forms/app-form";
import {
	FIELD_COPY,
	SWITCH_OFF_LABEL,
	SWITCH_ON_LABEL,
} from "../../lib/forms/story-copy";
import { Button } from "../button/button";
import { Form } from "./form";

type FormStoryArgs = Readonly<{
	answersAfter: number;
	rejects: boolean;
}>;

const EMAIL_LABEL = "Email";
const NICKNAME_LABEL = "Nickname";
const TERMS_LABEL = "I agree to the terms";
const NEWSLETTER_LABEL = "Send me the newsletter";
const SUBMIT_LABEL = "Sign up";
const BUSY_LABEL = "Signing up";
const REJECTED = "That address already has an account.";

const schema = z.object({
	email: z
		.string()
		.trim()
		.min(1, "Enter your email address.")
		.pipe(
			z.email("Enter an address like name@example.com."),
		),
	nickname: z.string().optional(),
	terms: z
		.boolean()
		.refine(
			accepted => accepted,
			"Accept the terms to sign up.",
		),
	newsletter: z.boolean().optional(),
});

const EMPTY: z.input<typeof schema> = {
	email: "",
	nickname: "",
	terms: false,
	newsletter: false,
};

/** A sign-up form with required and optional fields, stacked and inline, whose submit answers after `answersAfter` milliseconds, with a form-level error when `rejects` is set. */
const StoryForm = ({
	answersAfter,
	rejects,
}: FormStoryArgs): ReactNode => {
	const form = useAppForm({
		defaultValues: EMPTY,
		validationLogic: revalidateLogic(),
		validators: {
			onDynamic: schema,
			onSubmitAsync: () =>
				new Promise<string | undefined>(resolve => {
					setTimeout(
						() => resolve(rejects ? REJECTED : undefined),
						answersAfter,
					);
				}),
		},
	});
	return (
		<Form.Root form={form}>
			<View style={styles.form}>
				<form.AppField name="email">
					{field => (
						<field.EmailField
							copy={FIELD_COPY}
							label={EMAIL_LABEL}
							requiredness="required"
							testID="form-email"
						/>
					)}
				</form.AppField>
				<form.AppField name="nickname">
					{field => (
						<field.TextField
							copy={FIELD_COPY}
							label={NICKNAME_LABEL}
							onSubmit={() => void form.handleSubmit()}
							requiredness="optional"
							testID="form-nickname"
						/>
					)}
				</form.AppField>
				<form.AppField name="terms">
					{field => (
						<field.CheckboxField
							copy={FIELD_COPY}
							label={TERMS_LABEL}
							requiredness="required"
							testID="form-terms"
						/>
					)}
				</form.AppField>
				<form.AppField name="newsletter">
					{field => (
						<field.SwitchField
							copy={FIELD_COPY}
							label={NEWSLETTER_LABEL}
							offLabel={SWITCH_OFF_LABEL}
							onLabel={SWITCH_ON_LABEL}
							requiredness="optional"
							testID="form-newsletter"
						/>
					)}
				</form.AppField>
				<Form.Errors testID="form-errors" />
				<Form.Submit
					busyLabel={BUSY_LABEL}
					testID="form-submit">
					<Button.Label>{SUBMIT_LABEL}</Button.Label>
				</Form.Submit>
			</View>
		</Form.Root>
	);
};

const styles = StyleSheet.create(theme => ({
	form: { gap: theme.unit[8] },
}));

const meta = {
	render: (args, { id }) => (
		<StoryForm key={id} {...args} />
	),
	args: { answersAfter: 1500, rejects: false },
	argTypes: {
		answersAfter: {
			control: {
				type: "range",
				min: 0,
				max: 6000,
				step: 50,
			},
		},
	},
	parameters: {
		controls: { include: ["answersAfter", "rejects"] },
	},
} satisfies Meta<FormStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const QuickAnswer: Story = {
	args: { answersAfter: 80 },
};

export const Rejected: Story = {
	args: { rejects: true },
};
