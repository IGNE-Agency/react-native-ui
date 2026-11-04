// The `immutable` lint plugin, loaded by `.oxlintrc.json` via `jsPlugins`.
// Plain JS, because oxlint does not export its plugin types for consumers.

const isReadonlyWrapper = node =>
	node.type === "TSTypeReference" &&
	node.typeName.type === "Identifier" &&
	node.typeName.name === "Readonly";

const hasMutableProperty = node =>
	node.members.some(
		member =>
			member.type === "TSPropertySignature" &&
			!member.readonly,
	);

/**
 * Collects the object types within a declared type that hold at least one
 * mutable property, walking what a type is composed of: unions, intersections,
 * parentheses, array elements and the type arguments of a reference.
 *
 * `covered` tracks an enclosing `Readonly<…>`. It applies to that type's own
 * properties and no deeper, because `Readonly` is shallow: the inner literal of
 * `Readonly<{ a: { b: string } }>` stays mutable and is still reported.
 */
const collectMutableLiterals = (node, found, covered) => {
	if (!node) {
		return found;
	}
	switch (node.type) {
		case "TSTypeLiteral":
			if (!covered && hasMutableProperty(node)) {
				found.push(node);
			}
			for (const member of node.members) {
				if (member.type === "TSPropertySignature") {
					collectMutableLiterals(
						member.typeAnnotation?.typeAnnotation,
						found,
						false,
					);
				}
			}
			return found;
		case "TSUnionType":
		case "TSIntersectionType":
			for (const part of node.types) {
				collectMutableLiterals(part, found, covered);
			}
			return found;
		case "TSParenthesizedType":
			return collectMutableLiterals(
				node.typeAnnotation,
				found,
				covered,
			);
		case "TSArrayType":
			return collectMutableLiterals(
				node.elementType,
				found,
				false,
			);
		case "TSTypeReference": {
			const wraps = isReadonlyWrapper(node);
			for (const argument of node.typeArguments?.params ??
				[]) {
				collectMutableLiterals(argument, found, wraps);
			}
			return found;
		}
		default:
			return found;
	}
};

const requireReadonly = {
	meta: {
		type: "problem",
		fixable: "code",
		docs: {
			description:
				"Require a declared object type to be immutable by wrapping it in `Readonly<…>`. Opt out per line with `// oxlint-disable-next-line immutable/require-readonly`.",
		},
	},
	create(context) {
		return {
			TSTypeAliasDeclaration(node) {
				const literals = collectMutableLiterals(
					node.typeAnnotation,
					[],
					false,
				);
				for (const literal of literals) {
					context.report({
						node: literal,
						message:
							"Object type is mutable. Wrap it in `Readonly<…>`.",
						fix: fixer => [
							fixer.insertTextBefore(literal, "Readonly<"),
							fixer.insertTextAfter(literal, ">"),
						],
					});
				}
			},
		};
	},
};

export default {
	meta: { name: "immutable" },
	rules: { "require-readonly": requireReadonly },
};
