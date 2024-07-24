# Teams Presence Tool
Microsoft Teams is a critical part of many business's workflow and communication process. Some organisations use Teams to route incoming external phone calls to staff on a hierarchical basis. A major problem with Teams, however, is that it automatically sets accounts to 'away' status when they're inactive for a certain period of time. This breaks the routing process and causes incoming calls to be missed.

This tool uses the Microsoft Graph API to automatically keep accounts in the 'online' status.

Developed by [Absolute I.T.](https://absolute-it.com.au/) Australia, Sunshine Coast managed IT service provider and software development.

[![Download 1.0.0](https://img.shields.io/badge/Download-1.0.0-blue)](https://absolute-it.com.au/)

## Requirements
The application is built using Typescript and requires NodeJS on the computer to function. Installing NodeJS is easier than ever with `nvm` (Node Version Manager). Follow [this guide](https://www.freecodecamp.org/news/node-version-manager-nvm-install-guide/) to install on your operating system of choice. 

This project was developed using Node v22.2.0, however it should work with older versions without issue.

## Setup
1. Create an App in [portal.azure.com](https://portal.azure.com) console, **Home** > **App registrations**.
	1. Enter a name for your application. This doesn't affect the program.
	2. Select the **Supported account types**. Likely you'll only want the **Single tenant** option.
	3. Click register. A **Redirect URI** is *not* required.
2. Create a secret token, **Manage** > **Certificates & secrets** > **Client secrets**. Record the Value and ID columns because you will not see them again.
3. Set the app's permissions under **Manage** > **API Permissions**. 
	1. Click **Add a permission**, select **Microsoft Graph** and the **Application permissions** option. 
	2. This program needs Microsoft Graph permissions `Presence.Read.All`, `Presence.ReadWrite.All`, `User.Read` and `User.Read.All`.
	3. Click **Grant admin consent for <Organisation>**. 
4. Create a `.env` file in the project's root directory. See formatting below.
5. Create an `accounts.json` file in the project's root directory. See formatting below.
6. Run `npm install` in the root directory to install dependencies.

### .env
```dotenv
NODE_ENV=production

AZURE_TENANT_ID=<Directory (tenant) ID>
AZURE_CLIENT_ID=<Application (client) ID>

AZURE_CLIENT_SECRET_ID=<Client Secret ID>
AZURE_CLIENT_SECRET=<Client Secret Value>

DEFAULT_STATUS=Available
REFRESH_MINUTES=5
PROCESS_DELAY=200
```
- `AZURE_TENANT_ID` and `AZURE_CLIENT_ID` can be found in your app's **Overview** under **Essentials**.
- `AZURE_CLIENT_SECRET_ID` and `AZURE_CLIENT_SECRET` should have been noted when you created your secret in step 2.
- `DEFAULT_STATUS` can be "Available", "Busy", "Away" or "DoNotDisturb".
- `REFRESH_MINUTES` defines how many minutes the program waits before refreshing the account statuses.
- `PROCESS_DELAY` set a delay in milliseconds between each API call. Can be set to 0 for no delay.

### accounts.json
```
[
	{
		"label": "A label describing the account",
		"username": "example@organisation.com"
	},
	{
		"label": "Another account",
		"id": "fdb1814d-2cea-4e4a-9544-cbdc455852a3"
	},
	{
		"label": "A third account with a status override",
		"username": "example2@organisation.com",
		"status": "Away"
	},
]
```
You can set a list of accounts, or just a single one. Ensure that the first and last line is square brackets (`[` and `]` which indicates a list in JSON). Each account is an object encapsulated by curly brackets (`{` and `}`). Inside, you should put account related information. It's important that each key uses double quotes (").
- `label` sets a label that will help identify the account. It can be anything (*optional*)
- `username` the username that identifies the account (*required* or `id`)
- `id` the internal ID that identified the account (*required* or `username`)
- `status` set this account to a different status than the `DEFAULT_STATUS` in `.env`. Can be "Available", "Busy", "Away" or "DoNotDisturb" (*optional*)

You only need to provide an `id` *or* `username`, you don't need to provide both.

## Usage
Run `npm start` in the root directory to start the program.