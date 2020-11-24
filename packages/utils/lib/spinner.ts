import { Spinner } from "cli-spinner";

/**
 *
 * Spinning of the console
 *
 * @param {string} text The text displayed by the console
 */
/* istanbul ignore next */
export function startSpinner(text: string): any {
	const spinner = new Spinner(`%s ${text}`);
	spinner.setSpinnerString("|/-\\");
	spinner.start();
	return spinner;
}
