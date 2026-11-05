// The kit's default theme registers with Unistyles before any kit style is
// created, so it is the first import.
// oxlint-disable-next-line import/no-unassigned-import -- registering the theme is the import's whole job
import "@igne-agency/react-native-ui/theme/default";
// oxlint-disable-next-line import/no-unassigned-import -- installs Intl.getCanonicalLocales, which the Locale polyfill needs
import "@formatjs/intl-getcanonicallocales/polyfill.js";
// oxlint-disable-next-line import/no-unassigned-import -- installs Intl.Locale, which Hermes lacks
import "@formatjs/intl-locale/polyfill.js";
import { registerRootComponent } from "expo";

import { App } from "./src/app";

registerRootComponent(App);
