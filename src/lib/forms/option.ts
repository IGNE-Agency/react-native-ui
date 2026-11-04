/**
 * One choice in a control that picks from a fixed list. A disabled option stays
 * on the list and reads as unavailable, rather than going missing.
 */
export type Option<TValue extends string> = Readonly<{
	value: TValue;
	label: string;
	disabled?: boolean;
	testID?: string;
}>;

/**
 * The label a chosen value wears, or nothing when the value is not on the list.
 *
 * @example
 *   labelOfOption(orders, "distance"); // "Afstand"
 */
export const labelOfOption = <TValue extends string>(
	options: readonly Option<TValue>[],
	value: TValue | undefined,
): string | undefined =>
	options.find(option => option.value === value)?.label;

/**
 * The options a preset hands its control, each given the preset's `testID`
 * followed by its value, or the options as they are when there is no `testID`.
 *
 * @example
 *   withOptionIds(appearances, "settings-theme")[0]?.testID; // "settings-theme-light"
 */
export const withOptionIds = <TValue extends string>(
	options: readonly Option<TValue>[],
	testID: string | undefined,
): readonly Option<TValue>[] =>
	testID === undefined
		? options
		: options.map(option => ({
				...option,
				testID: `${testID}-${option.value}`,
			}));
