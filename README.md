# @maanlamp/react-native-ui

IGNE's React Native component kit. It holds primitives: single widgets whose interaction, accessibility or platform behaviour an app would otherwise solve again, exported as parts, with a preset over the parts where one composition is right nearly everywhere. That covers every form control in three tiers with a TanStack Form bridge, the feedback set and a bottom sheet. Layout for a whole view, navigation and anything that arranges several widgets belong to the app. Theming runs on DTCG tokens through Unistyles 3.

The kit ships TypeScript source. Your app's Babel compiles it like app code, with the React Compiler and the Unistyles plugin, and TypeScript reads the declarations in `build/`. You never type-check the kit's internals.

## Install

```sh
bunx expo install @maanlamp/react-native-ui
```

Then install the peer dependencies your app doesn't have yet. `expo install` picks the versions that match your SDK:

```sh
bunx expo install react-native-unistyles react-native-reanimated react-native-worklets \
  react-native-gesture-handler react-native-svg react-native-safe-area-context \
  react-native-keyboard-controller @gorhom/bottom-sheet @tanstack/react-form \
  expo-blur @expo/ui expo-document-picker expo-image-picker expo-haptics \
  temporal-polyfill
```

### Patch gorhom

`Sheet` needs a patched `@gorhom/bottom-sheet`. The patch exports `BottomSheetScrollableGestureContext`, which the kit's scroll-in-sheet handling reads, and stops the sheet from adding a `Dimensions` listener on every layout state. Bun applies patches only in the root project, so the kit can't carry it for you. Copy `patches/@gorhom%2Fbottom-sheet@5.2.14.patch` from this package into your app and register it:

```json
"patchedDependencies": {
	"@gorhom/bottom-sheet@5.2.14": "patches/@gorhom%2Fbottom-sheet@5.2.14.patch"
}
```

Without it, the kit's `Sheet` doesn't type-check against gorhom. When you move gorhom to a newer version, re-cut the patch with `bun patch @gorhom/bottom-sheet`. IGNE's React Native template already carries it.

### Requirements

The kit needs Expo SDK 58 or newer and React Native 0.88. It runs on a development build only, because Unistyles, gorhom and the kit's own `FieldAccessibility` module all ship native code. Expo autolinking finds that module in `node_modules` by itself. In a binary built without it, fields still work, with plain accessibility.

Hermes has no `Intl.Locale`, and the date fields and the password strength meter use it. Install the polyfill once, before the app renders:

```js
import "@formatjs/intl-getcanonicallocales/polyfill.js";
import "@formatjs/intl-locale/polyfill.js";
```

## Set up your app

### Babel

Both plugins skip `node_modules` by default, so name the kit explicitly:

```js
// babel.config.js
const path = require("node:path");

// Compare paths with forward slashes only, whichever separator Babel hands over.
const slashed = file => file.replaceAll("\\", "/");
const appSource = `${slashed(path.join(__dirname, "src"))}/`;
const kitSource = "/@maanlamp/react-native-ui/";

module.exports = function (api) {
	api.cache(true);
	return {
		presets: [
			["babel-preset-expo", { reactCompiler: false }],
		],
		plugins: [
			[
				"react-native-unistyles/plugin",
				{
					root: "src",
					autoProcessPaths: ["@maanlamp/react-native-ui"],
				},
			],
			[
				"babel-plugin-react-compiler",
				{
					target: "19",
					sources: filename =>
						slashed(filename).startsWith(appSource) ||
						slashed(filename).includes(kitSource),
				},
			],
		],
	};
};
```

If Unistyles misses the kit, its styles stop following a theme switch, and nothing logs an error. Check it by toggling dark mode with a kit `Button` on screen.

### Metro

Icons are SVG modules, so Metro needs `react-native-svg-transformer`:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.transformer.babelTransformerPath =
	require.resolve("react-native-svg-transformer/expo");
config.resolver.assetExts =
	config.resolver.assetExts.filter(ext => ext !== "svg");
config.resolver.sourceExts = [
	...config.resolver.sourceExts,
	"svg",
];

module.exports = config;
```

### Time zone

The calendar's "today" and the time field's instants are read in the zone your app names, never the device's. Wrap the app in `TimeZoneProvider` with an IANA zone, such as the one your API stores for the user; a kit part that needs it throws without one:

```tsx
import { TimeZoneProvider } from "@maanlamp/react-native-ui";

<TimeZoneProvider zone={user.timeZone}>
	{app}
</TimeZoneProvider>;
```

`useTimeZone()` returns that zone, for your own date code.

### Sheets

Every kit sheet (`Sheet`, `ConfirmSheet`, `LeaveGuardSheet`) is drawn in one `SheetHost`, so a sheet opened from inside another one stacks over it instead of being clipped to it. Mount it once around the app, inside the gesture, safe-area and keyboard providers and the providers your sheets' content reads; a `Sheet.Root` throws without one:

```tsx
import { SheetHost } from "@maanlamp/react-native-ui";

<SheetHost>{app}</SheetHost>;
```

A sheet's content renders in the host, so it reads the contexts above the host. The kit carries its own across from where the sheet is declared: the time zone and the form and field contexts. Provide a context of your own that sits lower than the host again inside the sheet's content.

### Tree shaking

Importing from `@maanlamp/react-native-ui` pulls in every component until Metro's tree shaking drops the ones you never use. Expo ships it behind two flags, set for release bundles only, for example in each `eas.json` build profile's `env` and wherever you bundle a local release:

```sh
EXPO_UNSTABLE_METRO_OPTIMIZE_GRAPH=1 EXPO_UNSTABLE_TREE_SHAKING=1
```

The kit's `sideEffects` names `theme/default` as its only module with side effects, so its bare import survives.

## Theme

### Zero configuration

Import the kit's default theme once, before the first render, for example at the top of `index.js`:

```ts
import "@maanlamp/react-native-ui/theme/default";
```

This registers neutral light and dark themes with Unistyles, follows the system appearance, and uses the system font.

### Your own tokens

The kit's tokens live in `tokens/` in three layers:

- `ref.tokens.json`: the ramps, `green`, `blue`, `orange`, `red` and `neutral`, each in 25 OKLCH steps from 0 white to 1000 black, and the type scale.
- `sys.tokens.json`: the roles components read: colour, state-layer opacities, the focus ring, type, the `unit` spacing scale, radius, elevation and motion. Every token says what it is for in its `$description`.
- `dark.tokens.json`: the dark overrides of those roles.

The vocabulary is phase2-declarations', shared with the web kit `@igne-agency/react-web-ui`, so one brand file can theme a client's web and native apps. It leaves out what native cannot use: the `breakpoint` and `gutter` groups and the elevation drawn as a CSS `filter`. It adds three colour roles phase2-declarations lacks: `disabled.bg` and `disabled.fg`, the fill and ink of a control that cannot be used, and `text-placeholder`, the hint text an empty field shows. The kit's own values are neutral: the brand roles (`primary`, its container and the selection) alias `neutral`, and no font family is named, so the system font draws every role.

A project layers its own token files over these in a [DTCG resolver](https://www.designtokens.org/), and the kit's Terrazzo plugin builds the result into a typed theme.

1. Write a resolver that uses the kit's files as its base and puts yours after them:

   ```json
   {
   	"$schema": "https://www.designtokens.org/schemas/2025.10/resolver.json",
   	"version": "2025.10",
   	"sets": {
   		"kit": {
   			"sources": [
   				{
   					"$ref": "../../../node_modules/@maanlamp/react-native-ui/tokens/ref.tokens.json"
   				},
   				{
   					"$ref": "../../../node_modules/@maanlamp/react-native-ui/tokens/sys.tokens.json"
   				}
   			]
   		},
   		"brand": {
   			"sources": [{ "$ref": "brand.tokens.json" }]
   		}
   	},
   	"modifiers": {
   		"theme": {
   			"contexts": {
   				"light": [],
   				"dark": [
   					{
   						"$ref": "../../../node_modules/@maanlamp/react-native-ui/tokens/dark.tokens.json"
   					}
   				]
   			},
   			"default": "light"
   		}
   	},
   	"resolutionOrder": [
   		{ "$ref": "#/sets/kit" },
   		{ "$ref": "#/sets/brand" },
   		{ "$ref": "#/modifiers/theme" }
   	]
   }
   ```

2. Override what you need in `brand.tokens.json`. Roles alias the ramps, so replacing a ramp restyles every role that aliases it in both themes; give all 25 steps, since an override replaces each step one by one. A role re-pointed here holds in the light theme, because the kit's `dark.tokens.json` re-points it again: put its dark value in a file of yours after the kit's in the `dark` context. A typography token is replaced whole, so give its full value when you add a `fontFamily`.

   ```json
   {
   	"sys": {
   		"color": {
   			"primary": {
   				"$type": "color",
   				"$value": "{ref.blue.550}"
   			}
   		}
   	}
   }
   ```

3. Run the plugin from `terrazzo.config.ts`:

   ```ts
   import reactNativeTheme from "@maanlamp/react-native-ui/terrazzo";
   import { defineConfig } from "@terrazzo/cli";

   export default defineConfig({
   	tokens: ["./src/theme/tokens/app.resolver.json"],
   	outDir: "./src/theme/",
   	plugins: [reactNativeTheme()],
   });
   ```

   `tz build` writes `src/theme/theme.gen.ts`, which exports `light` and `dark` typed as the kit's `SysTheme`. Gitignore it. `reactNativeTheme({ filename })` changes the file name.

4. Register the generated themes in place of the default one:

   ```ts
   // src/theme/index.ts
   import { registerTheme } from "@maanlamp/react-native-ui/theme";

   import { dark, light } from "./theme.gen";

   registerTheme({ light, dark });
   ```

The plugin reads only the `sys` group. Kebab-case names become camelCase keys. Colours become hex, with 8 digits when translucent. Dimensions become pixels (a `rem` is 16), durations become milliseconds, and shadows become `boxShadow` layers. A typography role without a `fontFamily` is drawn in the system font. The plugin narrows Terrazzo's `core/valid-typography` lint rule to match, unless your config sets that rule's `requiredProperties` itself.

## Use

```tsx
import {
	Button,
	TextField,
	useAppForm,
} from "@maanlamp/react-native-ui";
```

Each component is one namespace of parts (`Button.Root`, `Button.Label`, …). Where one composition of the parts is right nearly everywhere, the kit exports it as a preset too (`TextField`, `StaleContent`, `ConfirmSheet`), and the example Storybook files those under `Presets/`, except `WheelPicker`, `MonthCalendar` and `PullToRefresh`, which are filed under the component they assemble. The kit has no copy of its own: every string a component shows or announces comes in through a prop.

The raw text control is `TextInput`, named as React Native's is, so a file that imports both aliases one of them:

```tsx
import { TextInput as RNTextInput } from "react-native";
```

### Links

The kit doesn't depend on a router. To navigate, wrap `Button.Root`, `Link.Root` or `ListRow.Link` in expo-router's `Link` with `asChild`. It hands the part the `onPress` that navigates and the `link` role it's announced with:

```tsx
import { Link } from "expo-router";

<Link href="/settings" asChild>
	<ListRow.Link
		svg={SettingsIcon}
		label={m.settings_title()}
	/>
</Link>;
```

### Unsaved changes

`useLeaveGuard(when)` guards a screen against being left while `when` holds, and `LeaveGuardSheet` asks whether to leave anyway. The guard doesn't know the router. `@maanlamp/react-native-ui/expo-router` wires it to expo-router's `usePreventRemove`, which holds back, the swipe and every navigation away. `expo-router` is an optional peer dependency, needed only for that entry point:

```tsx
import { LeaveGuardSheet } from "@maanlamp/react-native-ui";
import { useRouterLeaveGuard } from "@maanlamp/react-native-ui/expo-router";

const guard = useRouterLeaveGuard(isDirty && !isSubmitting);

<LeaveGuardSheet
	guard={guard}
	title={m.edit_leave_title()}
	confirmLabel={m.edit_leave_discard()}
	cancelLabel={m.edit_leave_stay()}
/>;
```

A form in a sheet takes the guard on `Sheet.Root`. While it blocks, the scrim, the back press, the close control and a swipe down past the sheet's lowest stop, which springs back, are held for the question, which stacks over the sheet. Closing the sheet discards the form, so reset it once the sheet has gone:

```tsx
const guard = useLeaveGuard(isDirty && !isSubmitting);

<>
	<Sheet.Root
		snapPoints={["85%"]}
		modal
		dismissable
		guard={guard}
		onIndexChange={index => {
			if (index === -1) {
				form.reset();
			}
		}}>
		{content}
	</Sheet.Root>
	<LeaveGuardSheet
		guard={guard}
		title={m.edit_leave_title()}
		confirmLabel={m.edit_leave_discard()}
		cancelLabel={m.edit_leave_stay()}
	/>
</>;
```

### Forms

`useAppForm` is TanStack Form's hook with every form control registered on `field`. It validates with any [Standard Schema](https://standardschema.dev), such as Zod or Valibot; the kit ships no validators.

```tsx
const form = useAppForm({
	defaultValues: { email: "" },
	validationLogic: revalidateLogic(),
	validators: {
		onDynamic: signUpSchema,
		onSubmitAsync: submit,
	},
});

<Form.Root form={form}>
	<form.AppField name="email">
		{field => (
			<field.EmailField
				copy={fieldCopy}
				label={m.signup_email()}
				requiredness="required"
				testID="signup-email"
			/>
		)}
	</form.AppField>
	<Form.Errors testID="signup-error" />
	<Form.Submit
		busyLabel={m.common_busy()}
		testID="signup-submit">
		<Button.Label>{m.signup_submit()}</Button.Label>
	</Form.Submit>
</Form.Root>;
```

- `Form.Root` hands the form to its parts and renders no element. `Form.Errors` shows the form-level errors, such as the string `onSubmitAsync` returns. `Form.Submit` shows busy and announces `busyLabel` only once a submit has lasted 150 ms, then stays busy for at least 200 ms.
- Requiredness is the caller's. Every field, connected or not, takes `requiredness` as `"required"` or `"optional"` and states nothing without it; the kit never reads it off the schema. A rule that depends on another value is decided at the call site, as in `requiredness={hasCompany ? "required" : "optional"}`.
- Every field's `errors` takes what the validators returned. `normalizeFieldErrors` turns strings and anything with a string `message`, Standard Schema issues included, into the lines shown, so a schema's messages must already be translated.
- A failed submit focuses the first invalid field on screen.

## Develop

```sh
bun i
bun run tokens   # writes src/theme/default.gen.ts from tokens/
bun run check    # oxfmt and oxlint, with type-aware rules and type-checking
bun run fix      # formats and applies every auto-fix
```

- `bun run build:types` emits the declarations into `build/`.
- `bun run build:terrazzo` builds the plugin into `build/terrazzo/`.
- `bun run check:exports` asserts that every `exports` entry lists `types` first.

`prepack` runs `tokens`, `build:types` and `build:terrazzo`, so a published package always carries all three.

## Release

Bump `version` in `package.json`, merge, then push a tag that matches it:

```sh
git tag v0.1.0 && git push origin v0.1.0
```

`.github/workflows/release.yml` publishes to npm through trusted publishing (OIDC) with provenance, in the `Production` environment.

## License

MIT
