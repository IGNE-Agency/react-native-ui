import {
	isStandardSchemaValidator,
	makePathArray,
	type StandardSchemaV1,
	type StandardSchemaV1Issue,
} from "@tanstack/react-form";

/** Whether a field's value may be left out, as the caller states it. */
export type Requiredness = "required" | "optional";

/** Requiredness as a variant selection, with nothing stated a value of its own. */
export type RequirednessVariant = Requiredness | "unstated";

/**
 * What a field knows about itself. Every member is optional, so a caller states
 * only what it can observe.
 */
export type FieldState = Readonly<{
	disabled?: boolean;
	readonly?: boolean;
	requiredness?: Requiredness;
	invalid?: boolean;
	valid?: boolean;
	dirty?: boolean;
	touched?: boolean;
	filled?: boolean;
	focused?: boolean;
	pending?: boolean;
}>;

/**
 * The words a field's name takes on where the platform carries no
 * requiredness flag of its own. Each is handed the field's label, so a
 * project's message function can be passed as is.
 *
 * @example
 *   const copy: SpokenLabelCopy = {
 *   	labelOptional: ({ label }) => `${label}, optional`,
 *   	labelRequired: ({ label }) => `${label}, required`,
 *   };
 */
export type SpokenLabelCopy = Readonly<{
	/** The name an optional field announces, such as "Email, optional". */
	labelOptional: (
		inputs: Readonly<{ label: string }>,
	) => string;
	/** The name a required field announces, such as "Email, required". */
	labelRequired: (
		inputs: Readonly<{ label: string }>,
	) => string;
}>;

/** A field's state with every member settled, ready for `useVariants`. */
export type FieldVariants = Readonly<
	Omit<Required<FieldState>, "requiredness"> & {
		requiredness: RequirednessVariant;
	}
>;

/**
 * A field's state as a complete variant selection. Every key is present on
 * every call: on native an absent compound-variant condition counts as
 * satisfied and an `undefined` value is dropped from the selection, so one
 * missing key makes a compound apply unconditionally.
 *
 * @example
 *   styles.useVariants(fieldVariants({ invalid: true, focused }));
 */
export const fieldVariants = (
	state: FieldState,
): FieldVariants => ({
	disabled: state.disabled ?? false,
	readonly: state.readonly ?? false,
	requiredness: state.requiredness ?? "unstated",
	invalid: state.invalid ?? false,
	valid: state.valid ?? false,
	dirty: state.dirty ?? false,
	touched: state.touched ?? false,
	filled: state.filled ?? false,
	focused: state.focused ?? false,
	pending: state.pending ?? false,
});

const SYNC_VALIDATORS: ReadonlySet<string> = new Set([
	"onChange",
	"onBlur",
	"onSubmit",
	"onDynamic",
]);

const schemasOf = (
	validators: unknown,
): readonly StandardSchemaV1[] =>
	typeof validators === "object" && validators !== null
		? Object.entries(validators).flatMap(
				([key, validator]: readonly [string, unknown]) =>
					SYNC_VALIDATORS.has(key) &&
					isStandardSchemaValidator(validator)
						? [validator]
						: [],
			)
		: [];

const issuesOf = (
	schema: StandardSchemaV1,
	values: unknown,
): readonly StandardSchemaV1Issue[] | undefined => {
	const result = schema["~standard"].validate(values);
	return result instanceof Promise
		? undefined
		: (result.issues ?? []);
};

const settledIssuesOf = (
	validators: unknown,
	values: unknown,
): readonly (readonly StandardSchemaV1Issue[])[] =>
	schemasOf(validators).flatMap(schema => {
		const issues = issuesOf(schema, values);
		return issues === undefined ? [] : [issues];
	});

const startsAt = (
	issue: StandardSchemaV1Issue,
	name: string,
): boolean => {
	const path = (issue.path ?? []).map(segment =>
		String(
			typeof segment === "object" ? segment.key : segment,
		),
	);
	return makePathArray(name).every(
		(segment, index) => path[index] === String(segment),
	);
};

/**
 * Whether every field but one already satisfies the schema the form validates
 * with, so the named field is all the form still waits on. A form with no
 * synchronous Standard Schema waits on nothing.
 *
 * @example
 *   valuesCompleteExcept({ onDynamic: loginSchema }, values, "password");
 */
export const valuesCompleteExcept = (
	validators: unknown,
	values: unknown,
	name: string,
): boolean =>
	settledIssuesOf(validators, values).every(issues =>
		issues.every(issue => startsAt(issue, name)),
	);

/**
 * The label a field announces. Requiredness travels natively where the platform
 * carries it, and falls back to words rather than to punctuation a reader hears
 * as nothing.
 *
 * @example
 *   spokenLabelFor("Email", "required", true, copy); // "Email"
 */
export const spokenLabelFor = (
	label: string,
	requiredness: RequirednessVariant,
	nativeStateAvailable: boolean,
	copy: SpokenLabelCopy,
): string => {
	if (nativeStateAvailable || requiredness === "unstated") {
		return label;
	}
	return requiredness === "optional"
		? copy.labelOptional({ label })
		: copy.labelRequired({ label });
};
