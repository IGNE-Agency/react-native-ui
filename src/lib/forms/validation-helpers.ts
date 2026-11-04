const linesOf = (errors: unknown): readonly string[] => {
	if (Array.isArray(errors)) {
		const bag: readonly unknown[] = errors;
		return bag.flatMap(linesOf);
	}
	if (typeof errors === "string") {
		return errors === "" ? [] : [errors];
	}
	if (
		typeof errors === "object" &&
		errors !== null &&
		"message" in errors &&
		typeof errors.message === "string"
	) {
		return linesOf(errors.message);
	}
	return [];
};

/**
 * Errors of any shape as the lines a field or form shows, each once: strings as
 * they are, anything with a string `message`, such as a Standard Schema issue,
 * as that message, and lists flattened. Anything else is dropped.
 *
 * @example
 *   normalizeFieldErrors(["Too short", { message: "Not an address" }]); // ["Too short", "Not an address"]
 */
export const normalizeFieldErrors = (
	errors: unknown,
): readonly string[] => [...new Set(linesOf(errors))];
