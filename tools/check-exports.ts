/**
 * Fails when an entry of package.json's `exports` map does not list `types`
 * first. TypeScript in an Expo app resolves with `customConditions:
 * ["react-native"]` and takes the first matching condition, so a `react-native`
 * key ahead of `types` would point it at the kit's source instead of its
 * declarations.
 *
 * Also fails when a `bin` target does not exist. The release runs this before
 * `npm publish`, which drops a `bin` whose file is missing before `prepack`.
 *
 * @example
 *   bun tools/check-exports.ts
 */
type Exports = Readonly<Record<string, unknown>>;

const manifest: Readonly<{
	bin?: Readonly<Record<string, string>>;
	exports?: Exports;
}> = await Bun.file(
	new URL("../package.json", import.meta.url),
).json();

const exportsMap = manifest.exports ?? {};

/** Every conditions object in the map with the path that leads to it, nested ones included. */
const conditionsOf = (
	path: string,
	entry: unknown,
): readonly Readonly<{
	path: string;
	keys: readonly string[];
}>[] =>
	typeof entry === "object" &&
	entry !== null &&
	!Array.isArray(entry)
		? [
				{ path, keys: Object.keys(entry) },
				...Object.entries(entry).flatMap(([key, value]) =>
					conditionsOf(`${path} > ${key}`, value),
				),
			]
		: [];

const problems = Object.entries(exportsMap).flatMap(
	([subpath, entry]) =>
		conditionsOf(subpath, entry).flatMap(({ path, keys }) =>
			keys[0] === "types"
				? []
				: [
						`${path}: "types" must be the first condition (found ${keys.length === 0 ? "none" : keys.map(key => `"${key}"`).join(", ")})`,
					],
		),
);

const binProblems = (
	await Promise.all(
		Object.entries(manifest.bin ?? {}).map(
			async ([name, target]) =>
				(await Bun.file(
					new URL(`../${target}`, import.meta.url),
				).exists())
					? []
					: [`${name}: ${target} does not exist`],
		),
	)
).flat();

if (problems.length > 0) {
	console.error(
		`package.json exports:\n${problems.map(problem => `  ${problem}`).join("\n")}`,
	);
}

if (binProblems.length > 0) {
	console.error(
		`package.json bin:\n${binProblems.map(problem => `  ${problem}`).join("\n")}`,
	);
}

if (problems.length > 0 || binProblems.length > 0) {
	process.exit(1);
}

console.log(
	'package.json exports: "types" comes first in every conditional entry.',
);

console.log(
	"package.json bin: every target exists without a build.",
);
