/**
 * The four states of a view whose content arrives asynchronously.
 * - `loading`: none of its content has arrived yet.
 * - `updating`: its content is on screen and a fresh copy is out.
 * - `error`: its request failed and nothing is out to replace it.
 * - `ready`: its content is on screen and nothing is out.
 */
export type AsyncStatus =
	| "loading"
	| "updating"
	| "error"
	| "ready";

/**
 * Which of the four states a request's flags put its view in.
 *
 * @example
 *   asyncStatus({ isError: false, isFetching: true, isPending: false }); // "updating"
 */
export const asyncStatus = ({
	isError,
	isFetching,
	isPending,
}: Readonly<{
	isError: boolean;
	isFetching: boolean;
	isPending: boolean;
}>): AsyncStatus => {
	if (isError && !isFetching) {
		return "error";
	}
	if (isPending) {
		return "loading";
	}
	return isFetching ? "updating" : "ready";
};
