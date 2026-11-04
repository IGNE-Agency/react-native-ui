/** A rejected submission as the form layer consumes it: form-level copy and per-field messages. */
export type SubmitErrors = Readonly<{
	form: string;
	fields: Readonly<Record<string, string>>;
}>;

/**
 * What a form can show a rejected field path at: the names its fields are
 * mounted under, the backend paths it mounts under another name, and the copy
 * naming the control behind a path, keyed by the path's first segment, for the
 * paths no field on this form holds. Where it names controls, `labelInvalid`
 * words the line a stranded path is folded into.
 */
export type SubmitErrorRouting = Readonly<{
	fields: readonly string[];
	aliases?: Readonly<Record<string, string>>;
}> &
	(
		| Readonly<{
				labels?: undefined;
				labelInvalid?: undefined;
		  }>
		| Readonly<{
				labels: Readonly<Record<string, string>>;
				/** The line a stranded path's message is folded into, such as "Email: already taken". */
				labelInvalid: (
					inputs: Readonly<{
						label: string;
						error: string;
					}>,
				) => string;
		  }>
	);

const NAME = /^[^.[]*/;

const fieldNameOf = (
	routing: SubmitErrorRouting,
	path: string,
): string | undefined => {
	const name = routing.aliases?.[path] ?? path;
	return routing.fields.includes(name) ? name : undefined;
};

const strandedLine = (
	routing: SubmitErrorRouting,
	path: string,
	message: string,
): string => {
	if (routing.labels === undefined) {
		return message;
	}
	const [head] = NAME.exec(path) ?? [];
	const label =
		head === undefined ? undefined : routing.labels[head];
	return label === undefined
		? message
		: routing.labelInvalid({ error: message, label });
};

/**
 * A rejected submission with every field path kept only where a field of that
 * name is mounted to show it, and every other path folded into the form-level
 * copy, named after its control where one is known — so a rejection reaches the
 * reader instead of being set on a field nothing renders.
 *
 * @example
 *   routeSubmitErrors(submitErrorsOf(caught, m.register_failed()), {
 *   	aliases: { passwordConfirmation: "passwordConfirm" },
 *   	fields: Object.keys(formApi.state.fieldMeta),
 *   });
 */
export const routeSubmitErrors = (
	errors: SubmitErrors,
	routing: SubmitErrorRouting,
): SubmitErrors => {
	const entries = Object.entries(errors.fields);
	const fields = entries.flatMap(([path, message]) => {
		const name = fieldNameOf(routing, path);
		return name === undefined
			? []
			: [[name, message] as const];
	});
	const stranded = entries.flatMap(([path, message]) =>
		fieldNameOf(routing, path) === undefined
			? [strandedLine(routing, path, message)]
			: [],
	);
	return {
		fields: Object.fromEntries(fields),
		form: [errors.form, ...stranded].join("\n"),
	};
};
