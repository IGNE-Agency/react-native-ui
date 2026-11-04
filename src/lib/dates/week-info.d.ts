declare global {
	namespace Intl {
		type WeekInfo = Readonly<{
			firstDay: number;
			weekend: readonly number[];
			minimalDays?: number;
		}>;

		// oxlint-disable-next-line typescript/consistent-type-definitions -- augmenting Intl.Locale needs declaration merging
		interface Locale {
			getWeekInfo: () => WeekInfo;
		}
	}
}

export {};
