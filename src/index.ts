import Logging from "#classes/Logging";
import Graph from "#classes/Graph";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
	Logging.log("Starting presence tool...");
	let graph = new Graph();
	
	while (true) {
		await graph.process();
		for (let i = 0; i < (process.env.REFRESH_MINUTES ?? 5) * 3; i++) {
			await graph.listPresence(i != 0);
			await delay(1000 * 20); // Update every 20 seconds.
		}
		Logging.moveUp(graph.accounts.length);
	}
}

main().catch(error => {
	Logging.complete();
	Logging.error(error, error);
	process.exit(1);
});