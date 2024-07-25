import Logging from "#classes/Logging";
import Graph from "#classes/Graph";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
	Logging.log("Starting presence tool...");
	let graph = new Graph();

	while (true) {
		await graph.process();
		await delay(1000 * 60 * (process.env.REFRESH_MINUTES ?? 5));
	}
}

main().catch(error => {
	Logging.complete();
	Logging.error(error, error);
	process.exit(1);
});