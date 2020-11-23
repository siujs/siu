/*
 * @Author: buns
 * @Date: 2020-09-29 18:26:10
 * @LastEditTime: 2020-10-10 08:55:50
 * @Description: Spinner in console
 */
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
