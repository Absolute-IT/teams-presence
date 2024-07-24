import chalk from "chalk";

/**
 * @classdesc A class for logging messages and errors.
 */
export default class Logging {
	/**
	 * Logs a message to the console.
	 * 
	 * @param {any} message - The message to log.
	 * 
	 * @example Logging.log("Hello, world!");
	 */
	static log(message: any) {
		if (typeof message === "string") {
			console.log(`${chalk.cyan("[NOTICE]")} ${chalk.blueBright(message)}`);
		} else if (typeof message === "object") {
			console.log(chalk.blueBright(JSON.stringify(message, null, 2)));
		}
	}

	/**
	 * Logs an error to the console.
	 * 
	 * @param {any} message - The error message to log.
	 * @param {any} [error] - The error object to log. Use this to output the full error.
	 * 
	 * @example Logging.error("Failed to find a random clientID.", error);
	 */
	static error(message: any, error: any = null) {
		console.error(`${chalk.redBright("[ERROR]")} ${chalk.red(message)}`);
		if (error != null){ 
			if (typeof error === "string") {
				console.error(chalk.yellow(error));
			} else if (typeof error === "object") {
				console.error(chalk.yellow(JSON.stringify(error, null, 2)));
			}
		}
	}

	/**
	 * Logs a progress message to the console.
	 * 
	 * @param {string} message - The progress message to log.
	 * @param {number} percentage - The fraction representing the percentage of completion.
	 * 
	 * @example Logging.progress("Processing product", 0.1);
	 */
	static progress(message: string, percentage: number) {
		const progress = Math.round(percentage * 100);
		const color = chalk.rgb(Math.floor(255 * (1 - percentage)), Math.floor(255 * percentage), 0);
		const progressString = `${chalk.cyan("[PROGRESS]")} ${chalk.blueBright(message)} ${color(`${progress}%`)}`;
		process.stdout.write(`\r${progressString}`);
	}

	/**
	 * Logs a static message to the console.
	 * 
	 * @param {string} message - The static message to log.
	 * 
	 * @example Logging.staticLog("Processing product");
	 */
	static staticLog(message: string) {
		process.stdout.write(`\x1b[2K\x1b[0G${message}`);
	}

	/**
	 * Closes the progress logging function.
	 * 
	 * @example Logging.complete();
	 */
	static complete() {
		process.stdout.write("\n");
	}
}