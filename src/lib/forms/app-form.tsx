import { createFormHook } from "@tanstack/react-form";

import { TSFCheckboxField } from "../../components/checkbox-field/tsf-checkbox-field";
import { TSFCheckboxGroupField } from "../../components/checkbox-group-field/tsf-checkbox-group-field";
import { TSFDateField } from "../../components/date-field/tsf-date-field";
import { TSFDecimalField } from "../../components/decimal-field/tsf-decimal-field";
import { TSFEmailField } from "../../components/email-field/tsf-email-field";
import { TSFFileField } from "../../components/file-field/tsf-file-field";
import { TSFNumberField } from "../../components/number-field/tsf-number-field";
import { TSFOtpField } from "../../components/otp-field/tsf-otp-field";
import { TSFPasswordField } from "../../components/password-field/tsf-password-field";
import { TSFPhotoField } from "../../components/photo-field/tsf-photo-field";
import { TSFRadioGroupField } from "../../components/radio-group-field/tsf-radio-group-field";
import { TSFRatingField } from "../../components/rating-field/tsf-rating-field";
import { TSFSegmentedControlField } from "../../components/segmented-control-field/tsf-segmented-control-field";
import { TSFSwitchField } from "../../components/switch-field/tsf-switch-field";
import { TSFTextField } from "../../components/text-field/tsf-text-field";
import { TSFTextareaField } from "../../components/textarea-field/tsf-textarea-field";
import { TSFTimeField } from "../../components/time-field/tsf-time-field";
import { TSFToggleGroupField } from "../../components/toggle-group-field/tsf-toggle-group-field";
import { fieldContext, formContext } from "./context";
import { useFailedSubmitFocus } from "./failed-submit";

export { useFieldContext, useFormContext } from "./context";

type FieldComponents = Readonly<{
	CheckboxField: typeof TSFCheckboxField;
	CheckboxGroupField: typeof TSFCheckboxGroupField;
	DateField: typeof TSFDateField;
	DecimalField: typeof TSFDecimalField;
	EmailField: typeof TSFEmailField;
	FileField: typeof TSFFileField;
	NumberField: typeof TSFNumberField;
	OtpField: typeof TSFOtpField;
	PasswordField: typeof TSFPasswordField;
	PhotoField: typeof TSFPhotoField;
	RadioGroupField: typeof TSFRadioGroupField;
	RatingField: typeof TSFRatingField;
	SegmentedControlField: typeof TSFSegmentedControlField;
	SwitchField: typeof TSFSwitchField;
	TextField: typeof TSFTextField;
	TextareaField: typeof TSFTextareaField;
	TimeField: typeof TSFTimeField;
	ToggleGroupField: typeof TSFToggleGroupField;
}>;

const formComponents = {};

type FormComponents = typeof formComponents;

type AppFormHook = ReturnType<
	typeof createFormHook<FieldComponents, FormComponents>
>;

const hook: AppFormHook = createFormHook<
	FieldComponents,
	FormComponents
>({
	fieldContext,
	formContext,
	fieldComponents: {
		CheckboxField: TSFCheckboxField,
		CheckboxGroupField: TSFCheckboxGroupField,
		DateField: TSFDateField,
		DecimalField: TSFDecimalField,
		EmailField: TSFEmailField,
		FileField: TSFFileField,
		NumberField: TSFNumberField,
		OtpField: TSFOtpField,
		PasswordField: TSFPasswordField,
		PhotoField: TSFPhotoField,
		RadioGroupField: TSFRadioGroupField,
		RatingField: TSFRatingField,
		SegmentedControlField: TSFSegmentedControlField,
		SwitchField: TSFSwitchField,
		TextField: TSFTextField,
		TextareaField: TSFTextareaField,
		TimeField: TSFTimeField,
		ToggleGroupField: TSFToggleGroupField,
	},
	formComponents,
});

/**
 * The kit's form hook: every field reaches its control through `form.AppField`
 * and takes its errors from the Standard Schema the form validates with. A
 * failed submit focuses the first invalid field on screen.
 *
 * @example
 *   const form = useAppForm({
 *   	defaultValues: { email: "", password: "" },
 *   	validationLogic: revalidateLogic(),
 *   	validators: { onDynamic: loginSchema },
 *   });
 *   <Form.Root form={form}>
 *   	<form.AppField name="email">
 *   		{field => (
 *   			<field.EmailField copy={fieldCopy} label={m.login_email()} requiredness="required" />
 *   		)}
 *   	</form.AppField>
 *   	<Form.Errors />
 *   	<Form.Submit busyLabel={m.common_busy()}>
 *   		<Button.Label>{m.login_submit()}</Button.Label>
 *   	</Form.Submit>
 *   </Form.Root>;
 */
export const useAppForm: AppFormHook["useAppForm"] =
	options => {
		const form = hook.useAppForm(options);
		useFailedSubmitFocus(form);
		return form;
	};

/** Splits a form into typed pieces that share the parent's `useAppForm` instance. */
export const withForm: AppFormHook["withForm"] =
	hook.withForm;
