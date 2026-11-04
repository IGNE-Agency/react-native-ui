/**
 * The id a preset gives one of its parts: the preset's own `testID` with the
 * part's suffix, or none when the preset was given none.
 *
 * @example
 *   suffixed("sign-out", "confirm"); // "sign-out-confirm"
 */
export const suffixed = (
	testID: string | undefined,
	suffix: string,
): string | undefined =>
	testID === undefined ? undefined : `${testID}-${suffix}`;
