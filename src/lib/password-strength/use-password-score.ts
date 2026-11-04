import {
	ZxcvbnFactory,
	type OptionsDictionary,
	type Score,
	type TranslationKeys,
} from "@zxcvbn-ts/core";
import { useEffect, useMemo, useState } from "react";

const MAX_LENGTH = 128;

/** One language's dictionaries and feedback copy, as a `@zxcvbn-ts/language-*` package exports them. */
export type PasswordLanguagePack = Readonly<{
	dictionary: OptionsDictionary;
	translations: TranslationKeys;
}>;

type PackLoader = () => Promise<PasswordLanguagePack>;

/**
 * The language packs a password can be rated in, beside the kit's English and
 * Dutch, each keyed by its language subtag and loaded the first time a password
 * in that language is rated.
 *
 * @example
 *   const languages: PasswordLanguages = { de: () => import("@zxcvbn-ts/language-de") };
 */
export type PasswordLanguages = Readonly<
	Record<string, PackLoader>
>;

const english: PackLoader = () =>
	import("@zxcvbn-ts/language-en");

const BUILT_IN: PasswordLanguages = {
	en: english,
	nl: () => import("@zxcvbn-ts/language-nl-be"),
};

const checkers = new Map<string, Promise<ZxcvbnFactory>>();

const checkerFor = (
	language: string,
	load: PackLoader,
): Promise<ZxcvbnFactory> => {
	const known = checkers.get(language);

	if (known !== undefined) {
		return known;
	}

	const checker = Promise.all([
		import("@zxcvbn-ts/language-common"),
		load(),
	]).then(
		([common, pack]) =>
			new ZxcvbnFactory({
				dictionary: {
					...common.dictionary,
					...pack.dictionary,
				},
				graphs: common.adjacencyGraphs,
				maxLength: MAX_LENGTH,
				translations: pack.translations,
			}),
	);

	checkers.set(language, checker);
	return checker;
};

/** What zxcvbn makes of a password: how strong it is, and what it has to say. */
export type PasswordRating = Readonly<{
	score: Score;
	/** What is wrong with the password, where the library names something. */
	warning: string | undefined;
	/** What would make it stronger, the most telling first. */
	suggestions: readonly string[];
}>;

type Loaded = Readonly<{
	language: string;
	checker: ZxcvbnFactory;
}>;

/**
 * What zxcvbn makes of a password in the reader's own language, or `undefined`
 * for an empty one and until that language has loaded. The language of
 * `locale`, the app's locale tag, picks a pack from `languages` or the kit's
 * English and Dutch, and English serves every other.
 *
 * @example
 *   const rating = usePasswordRating(password, "nl-NL");
 */
export const usePasswordRating = (
	password: string,
	locale: string,
	languages: PasswordLanguages = {},
): PasswordRating | undefined => {
	const asked = new Intl.Locale(locale).language;
	const chosen = languages[asked] ?? BUILT_IN[asked];
	const language = chosen === undefined ? "en" : asked;
	const load = chosen ?? english;
	const [loaded, setLoaded] = useState<Loaded | undefined>(
		undefined,
	);
	const checker =
		loaded?.language === language
			? loaded.checker
			: undefined;

	useEffect(() => {
		let live = true;
		const settle = async () => {
			const next = await checkerFor(language, load);
			if (live) {
				setLoaded(current =>
					current?.checker === next
						? current
						: { language, checker: next },
				);
			}
		};
		void settle();
		return () => {
			live = false;
		};
	}, [language, load]);

	return useMemo(() => {
		if (password === "" || checker === undefined) {
			return undefined;
		}

		const { feedback, score } = checker.check(password);

		return {
			score,
			suggestions: feedback.suggestions,
			warning: feedback.warning ?? undefined,
		};
	}, [checker, password]);
};
