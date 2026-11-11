# CLAUDE.md

You are working in a published TypeScript + React Native component kit, `@igne-agency/react-native-ui`. Apps compile its source with their own Babel, so every change ships to every app that upgrades. Make safe, minimal, maintainable changes that fit the existing architecture.

**Primary rule**: before changing code, read the surrounding files and follow the patterns already present. Prefer the pattern used closest to the code you are editing.

---

## Stack

| Concern         | Tool                                                       |
| --------------- | ---------------------------------------------------------- |
| Package manager | `bun`                                                      |
| Platform        | Expo SDK 58 (React Native 0.88, React 19.3), peer packages |
| Styling         | `react-native-unistyles` 3                                 |
| UI primitives   | `@rn-primitives/*`, `@gorhom/bottom-sheet`                 |
| Icons           | `@material-design-icons/svg` through `react-native-svg`    |
| Forms           | `@tanstack/react-form` via `src/lib/forms/app-form.tsx`    |
| Tokens          | DTCG 2025.10 in `tokens/`, built by Terrazzo 2             |
| Native module   | `FieldAccessibility` (`ios/`, `android/`)                  |

---

## Packaging

The kit ships source, not built JavaScript. Metro resolves `src/` through the `react-native` export condition, and TypeScript resolves `build/*.d.ts` through `types`. The only built artifacts are the declarations, the Terrazzo plugin, which Node loads, and `react-native-ui-tokens` (`src/terrazzo/build-tokens.ts`), the `bin` an app builds its tokens with instead of `tz build`, which loads any `vite.config.*` in the project and runs its plugins.

- `types` comes first in every `exports` entry. `bun run check:exports` asserts it.
- Relative imports only. There is no `@/` alias: in the consuming app's Babel, `@/` means the app's `src`.
- `isolatedDeclarations` is on. Every exported value carries a type the declaration emitter can read without inference. Annotate component return types, and type namespace objects explicitly.
- The kit has no copy of its own, no storage keys and no API client. Every string a component shows or announces comes in through a prop named for what it says (`busyLabel`, `showPasswordLabel`).
- A dependency an app also needs at runtime (React, Expo modules, Unistyles, Reanimated, gorhom) is a peer dependency. Only packages no app imports itself are `dependencies`.

---

## Verification

Before finishing any task:

```
bun fix     # Format and apply every auto-fixable lint
bun check   # Format check, lint and type-check, all through oxc
```

They are not green until they are silent. `bun run tokens` must have run first, because `src/theme/default.gen.ts` is generated.

Never bypass hooks or suggest `--no-verify`.

How something looks is checked on a device, in the example app's Storybook, by the person who has one. Never build a headless browser, a proxy render or any other stand-in to judge type, colour, spacing or motion. It costs a great deal and proves little, because the platform's own rasteriser is what is being judged. Say what changed and ask.

---

## UI primitives — prefer prebuilt over hand-rolled

Never rebuild a widget that is a solved problem, such as a text field, switch, checkbox, radio group, dialog or popover. Reach for these in order: the platform's own control, then a package that does it properly (`@rn-primitives/*`, Expo's native controls), and only then our own. Small teams without dedicated a11y engineers can't reliably reproduce the interaction and accessibility work those packages encode. `rn-primitives` also ships `useAccessibilityFocus`, `useRestoreAccessibilityFocus` and Android `BackHandler` wiring, so focus restoration on close is not ours to write.

A custom widget is fine where it gives a better experience than any of those, as long as its accessibility is implemented properly with what the platform provides: role, name, state, value and the role's actions.

- **The wheel picker.** No primitive offers one, so `Wheel` is one `adjustable` node: increment and decrement step to the neighbouring row, the value text carries the row's label, annotations and detail, and the rows are hidden from the screen reader.
- **The numeric stepper.** One `adjustable` node carrying the value; on iOS its buttons are the platform's own stepper.

A role stood up by hand for a widget a primitive or the platform already provides is a bug.

---

## Styling

- Three token layers, and a component reads only the second and third:
  - **Layer 1** `tokens/ref.tokens.json`: the ramps (`green`, `blue`, `orange`, `red`, `neutral`, each 0 white to 1000 black) and the type scale.
  - **Layer 2** `tokens/sys.tokens.json` and `tokens/dark.tokens.json`: role names, per theme. A component reads them as `theme.color.*`, `theme.unit[n]`, `theme.font.*` and the rest of `SysTheme` in `src/theme/sys.ts`.
  - **Layer 3** a component's own Unistyles `variants` / `compoundVariants`.
- The token files take phase2-declarations' vocabulary, as the web kit `@igne-agency/react-web-ui` does, and hold the same values as its files. A change to one is made in both.
- `SysTheme` mirrors the `sys` group one to one. A new role is added in both places, and `src/terrazzo/` maps it without changes.
- A pressed control never gets a colour of its own: `StateLayer` in `src/lib/state-layer/` lays its own ink over its fill at `theme.state.pressed`. A component that takes a `tone` reads it through `tonePaint` in `src/lib/tone/`.
- Spread a `FontRole` as it is and never hard-code a font family. An absent `fontFamily` means the system font.
- Every styled node lives in the kit's own files under `src/`, which the app's Unistyles plugin processes through `autoProcessPaths`. Never hand a style to a library part: pass `asChild` and render our own styled element as its child. An undetected style dependency fails silently by not updating.
- Reanimated shared values are read and written with `.get()` / `.set()`, including inside worklets. The React Compiler rules flag `.value`.

---

## Generated files

- Generated files are gitignored, listed by **named path** under the "generated files" heading in `.gitignore`. Never use a `*.gen.*` glob.
- `src/theme/default.gen.ts` is generated by `bun run tokens` and is gitignored, but it is published, because `prepack` builds it.
- Do not edit generated files.
- Add new generated files or folders to the gitignore, under the right comment heading.
- Gitignored files that aren't under the generated-files heading are not necessarily generated, so this rule doesn't cover them.

---

## TypeScript

- No `any`
- No casts. Help the compiler infer correctness through runtime logic. If a third-party type makes this impossible, cast with a comment explaining why, as a last resort only.
- No non-null assertions. Prefer type guards and narrowing.
- No duplicate type definitions. Reuse the exported types from `src/theme`, the hooks or shared modules.
- Declared object types are `Readonly<…>`. The `immutable/require-readonly` lint rule enforces it.
- Add JSDoc to util functions you create, with at least one example. Add docs to existing util functions you edit that are missing them. Keep types in TypeScript.

---

## React

- Extract into subcomponents or hooks when a component exceeds ~150–200 LOC
- No global state for local UI concerns
- No `useEffect` for logic that can run during render, in event handlers, or as derived/memoized values
- No `useMemo` / `useCallback` unless solving a real referential stability or performance problem
- The React Compiler memoizes elements on their props. An object that mutates behind a stable reference, such as a library store, therefore signals nothing when it changes. Pass the state it holds alongside it.
- No hardcoded user-facing copy. It comes in through props.

---

## Directory layout

```
src/components/   one folder per component: <name>/<name>.tsx
src/lib/          shared plumbing: a11y, forms, haptics, motion, wait, dates
src/theme/        SysTheme, registerTheme, the default theme
src/terrazzo/     the Terrazzo plugin and the react-native-ui-tokens command, built to build/terrazzo/
src/expo-router/  the expo-router adapters, their own entry point over an optional peer
tokens/           DTCG token files and the kit's resolver
ios/, android/    the FieldAccessibility native module
example/          the Expo app that runs Storybook
tools/            build- and design-time scripts
```

`src/index.ts` re-exports every component folder whole. A new folder is added there.

A component is one file exporting one compound namespace object. Parts that need no styling pass through untouched.

No component assigns a `testID` of its own: a part takes its own `testID` and puts it on the host it renders, and a preset takes one `testID` and gives its parts fixed suffixes of it, each named in that prop's doc comment.

A form control is the exception: three files in three tiers.

- `src/components/<raw-name>/<raw-name>.tsx` holds the raw parts, exported as namespace `<RawName>`. Raw text-like controls are named `*Input` (`text-input.tsx` / `TextInput`, `NumberInput`, `OtpInput`, `DateInput`, `TimeInput`), and so are `FileInput` and `RatingInput`. The kit keeps these plain names even where a library exports the same one, and a kit file that imports that export aliases it as `<Lib><Name>`: `TextInput as RNTextInput`, `type TextInputProps as RNTextInputProps`, `OtpInput as RNOtpInput`.
- `src/components/<control>-field/<control>-field.tsx` is the shorthand over the parts.
- `src/components/<control>-field/tsf-<control>-field.tsx` is the TanStack Form bridge, registered in `src/lib/forms/app-form.tsx`.

Presets (email, textarea, password) get tiers 2 and 3 only, and reuse the text control's raw tier, `TextInput`.

---

## Scope

- Change only what is necessary for the requested outcome
- Do not refactor files you are not already modifying
- Do not add dependencies unless clearly necessary. Prefer what is already in `package.json`. A new runtime dependency is one every app inherits.
- No comments. Not for rationale, edge cases, warnings or spec quirks — if it needs explaining, the name is wrong.
- Doc comments on exported symbols only: short, correct, one example. Keep them general and brief; say what the symbol is, not why it was built that way. No prose, no rationale, no design history. One or two sentences.
