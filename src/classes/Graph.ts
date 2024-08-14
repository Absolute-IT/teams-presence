import "dotenv/config";

import Logging from "#classes/Logging";

import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials/index.js";
import { ClientSecretCredential } from "@azure/identity";

import fs from "node:fs";
import chalk from "chalk";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Defines the structure for an account object, representing user information and status.
 * 
 * @interface
 * @property {string} id - The unique identifier for the account.
 * @property {string} userPrincipalName - The principal name of the user.
 * @property {string | null} displayName - The display name of the user.
 * @property {string | null} jobTitle - The job title of the user.
 * @property {string | null} givenName - The given name of the user.
 * @property {string | null} surname - The surname of the user.
 * @property {string | null} mail - The email address of the user.
 * @property {Array<string> | null} mobilePhone - The mobile phone numbers of the user.
 * @property {string | null} officeLocation - The office location of the user.
 * @property {string | null} preferredLanguage - The preferred language of the user.
 * @property {string} status - The current status of the account.
 */
interface Account {
	id: string;
	userPrincipalName: string;
	displayName: string | null;
	jobTitle: string | null;
	givenName: string | null;
	surname: string | null;
	mail: string | null;
	mobilePhone: Array<string> | null;
	officeLocation: string | null;
	preferredLanguage: string | null;
	status: string;
}

/**
 * Represents a Graph client for interacting with Microsoft Graph API.
 * This class provides methods to perform operations on Microsoft Graph resources.
 * 
 * @class
 * @property {string} tenantID - The Azure tenant ID.
 * @property {string} clientID - The Azure client ID.
 * @property {string} secret - The Azure client secret.
 * @property {Array<Account>} accounts - A list of accounts to manage.
 * @property {Client} client - The Microsoft Graph Client instance.
 */
export default class Graph {
	private tenantID: string;
	private clientID: string;
	private secret: string;

	public accounts: Array<Account>;

	private client: Client;

	/**
	 * Initializes a new instance of the Graph class.
	 * Sets up the Microsoft Graph Client with the necessary credentials and initializes the accounts list.
	 * Environment variables must be set for AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, and AZURE_APPLICATION_ID.
	 * 
	 * @throws Will throw an error if any of the required environment variables are not set.
	 */
	constructor() {
		if (!process.env.AZURE_TENANT_ID) throw "AZURE_TENANT_ID not set in .env file.";
		this.tenantID = process.env.AZURE_TENANT_ID;

		if (!process.env.AZURE_CLIENT_ID) throw "AZURE_CLIENT_ID not set in .env file.";
		this.clientID = process.env.AZURE_CLIENT_ID ?? null;

		if (!process.env.AZURE_CLIENT_SECRET) throw "AZURE_CLIENT_SECRET not set in .env file.";
		this.secret = process.env.AZURE_CLIENT_SECRET ?? null;

		const credential = new ClientSecretCredential(this.tenantID, this.clientID, this.secret);
		this.client = Client.initWithMiddleware({ 
			authProvider: new TokenCredentialAuthenticationProvider(credential, {
				scopes: ["https://graph.microsoft.com/.default"]
			}) 
		});

		this.accounts = [];
	}

	/**
	 * Retrieves a list of users from Microsoft Graph, optionally filtered and selecting specific fields.
	 * 
	 * @async
	 * @param {string | null} filter - An OData filter string to apply to the query.
	 * @param {string | null} select - A comma-separated string of properties to include in the response.
	 * @returns {Promise<any>} A promise that resolves to the result of the query.
	 * @throws {Error} Throws an error if the query to Microsoft Graph API fails.
	 */
	async listUsers(filter: string | null = null, select: string | null = null) {
		const query = this.client.api("/users");
	
		if (filter != null) query.filter(filter);
		if (select != null) query.select(select);
	
		const result = await query.get();
		
		return result;
	}

	/**
	 * Loads account information from a local JSON file named 'accounts.json' and retrieves corresponding user details from Microsoft Graph.
	 * The function matches accounts from the file with users in Microsoft Graph based on username or ID.
	 * 
	 * @async
	 * @returns {Promise<void>} A promise that resolves when the accounts have been loaded and processed.
	 * @throws {Error} Throws an error if 'accounts.json' does not exist or if there is an error reading the file.
	 * @throws {Error} Throws an error if querying Microsoft Graph API fails.
	 */
	async loadAccounts() {
		if (!fs.existsSync("accounts.json")) {
			throw "accounts.json not found.";
		}

		let targets = null;
		try {
			targets = JSON.parse(fs.readFileSync("accounts.json", "utf-8"));
		} catch (error) {
			throw error;
		}

		this.accounts = [];

		return this.listUsers().then(async results => {
			for (const target of targets) {
				const account = results.value.find((user: Account) => {
					return (target.username && user.userPrincipalName.toLowerCase() == target.username.toLowerCase()) || 
					(target.id && user.id.toLowerCase() == target.id.toLowerCase());
				});

				if (account) { 
					account.status = target.status ?? process.env.DEFAULT_STATUS ?? "Available";
					this.accounts.push(account);
				} else {
					throw `Account not found for ${target.label ?? target.username ?? target.id}`;
				}
			}

			return this.accounts;
		});
	}

	/**
	 * Retrieves the presence information for all accounts managed by this Graph instance.
	 * It constructs a request with the account IDs and queries Microsoft Graph API to get their presence status.
	 * 
	 * @async
	 * @returns {Promise<any>} A promise that resolves to the presence information of all accounts.
	 * @throws {Error} Throws an error if the Microsoft Graph API call fails.
	 */
	async listPresence(wipe: boolean = false) {
		const options = {
			ids: this.accounts.map(account => account.id)
		}
		
		const result = await this.client.api("/communications/getPresencesByUserId").post(options);

		if (wipe) Logging.clearLine(this.accounts.length);
		for (const account of this.accounts) {
			const presence = result.value.find((p: any) => p.id == account.id);
			Logging.basicLog(`\n${chalk.blueBright("Presence for ")}${chalk.green(account.userPrincipalName.toLowerCase())}${chalk.blueBright(": ")}${presence?.availability ? chalk.green(presence.availability) : chalk.red("UNKNOWN")}${presence?.availability != presence?.activity ? `${chalk.blueBright(" (")}${presence?.activity ? chalk.green(presence.activity) : chalk.red("UNKNOWN")}${chalk.blueBright(")")}` : ``}`);
		}

		return result;
	}

	/**
	 * Sets the presence status for a specified account based on its current status.
	 * The function maps the account's status to the corresponding Microsoft Graph API presence values.
	 * 
	 * @async
	 * @param {Account} account - The account object containing the ID and status to update.
	 * @returns {Promise<void>} A promise that resolves when the presence status has been successfully updated.
	 * @throws {Error} Throws an error if the Microsoft Graph API call to set presence fails.
	 */
	async setPresence(account: Account) {
		let availability = null;
		let activity = null;
		switch (account.status.toLowerCase()) {
			case "available":
				availability = "Available";
				activity = "Available";
				break;
			case "away":
				availability = "Away";
				activity = "Away";
				break;
			case "busy":
				availability = "Busy";
				activity = "InACall";
				break;
			case "donotdisturb":
				availability = "DoNotDisturb";
				activity = "Presenting";
				break;
			default:
				availability = "Available";
				activity = "Available";
		}

		const options = {
			sessionId: this.clientID,
			availability: availability,
			activity: activity,
			expirationDuration: "PT4H"
		}
		
		const result = await this.client.api(`/users/${account.id}/presence/setPresence`).post(options);
		
		return result;
	}

	async setPreferredPresence(account: Account) {
		const options = {
			availability: "Available",
			activity: "Available"
		}

		const result = await this.client.api(`/users/${account.id}/presence/setUserPreferredPresence`).post(options);

		return result;
	}

	/**
	 * Processes all accounts by loading them, setting their presence based on the account status, and logging the operations.
	 * It introduces a delay between setting the presence for each account to avoid rate limiting issues.
	 * The function logs the start of the process, each account's presence update, and the completion of the process.
	 * 
	 * @async
	 * @returns {Promise<void>} A promise that resolves when all accounts have been processed and their presence updated.
	 * @throws {Error} Throws an error if loading accounts or setting presence for any account fails.
	 */
	async process() {
		Logging.staticLog(chalk.blueBright("Loading account data..."));
		let accounts = null;
		try {
			accounts = await this.loadAccounts();
		} catch (error) {
			Logging.complete();
			Logging.error(error, error);
			return;
		}

		Logging.staticLog(chalk.blueBright("Setting presences..."));
		await delay(process.env.PROCESS_DELAY ?? 200);
		for (const account of accounts) {
			Logging.staticLog(`${chalk.blueBright("Setting presence to ")}${chalk.green(account.status)}${chalk.blueBright(" for ")}${chalk.green(account.userPrincipalName.toLowerCase())}${chalk.blueBright("...")}`);
			try {
				await this.setPreferredPresence(account);
				await this.setPresence(account);
			} catch (error) {
				Logging.complete();
				Logging.error(error, error);
				return;
			}
			
			Logging.staticLog(`${chalk.blueBright(`Successfully set `)}${chalk.green(account.status)}${chalk.blueBright(" for ")}${chalk.green(account.userPrincipalName.toLowerCase())}${chalk.blueBright("...")}`);
			await delay(process.env.PROCESS_DELAY ?? 200);
		}

		Logging.staticLog(`${chalk.blueBright("Presences are up to date. Will refresh in ")}${chalk.green(process.env.REFRESH_MINUTES ?? 5)}${chalk.blueBright(" minutes.")}`);
	}
}