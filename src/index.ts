import Logging from "#classes/Logging";
import Graph from "#classes/Graph";

async function main() {
	Logging.log("Starting presence tool...");
	let graph = new Graph();

	graph.process();
	setInterval(() => graph.process(), 1000 * 60 * (process.env.REFRESH_MINUTES ?? 5));
}

main().catch(error => {
	Logging.complete();
	Logging.error(error, error);
	process.exit(1);
});