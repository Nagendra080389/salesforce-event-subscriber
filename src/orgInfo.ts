import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {execSfdxJson} from "./utils";

export let accessTokenFromOrg = '';
export let instanceURLFromOrg = '';
export class OrgInfoListProvider implements vscode.TreeDataProvider<OrgData> {


	constructor(private workspaceRoot: string | undefined) {
	}


	getTreeItem(element: OrgData): vscode.TreeItem {
		return element;
	}

	getChildren(element?: OrgData): Thenable<OrgData[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No sfdx project in empty workspace');
			return Promise.resolve([]);
		}

		if (element) {
			return Promise.resolve(this.fetchOrgDetails());
		} else {
			const sfdxCofigExists = path.join(this.workspaceRoot, '.sfdx/sfdx-config.json');
			if (this.pathExists(sfdxCofigExists)) {
				return Promise.resolve(this.fetchOrgDetails());
			} else {
				vscode.window.showInformationMessage('Workspace has no sfdx-config.json');
				return Promise.resolve([]);
			}
		}

	}

	/**
	 * Given the path to package.json, read all its dependencies and devDependencies.
	 */
	private async fetchOrgDetails(): Promise<OrgData[]>{
		return await this.getTargetOrgName();
	}

	private async getTargetOrgName(): Promise<OrgData[]> {
		const items: any = [];
		const sfdxJson = await execSfdxJson('sf config get target-org', this, {
			fail: false,
			output: false,
		});
		const resultElement = sfdxJson.result[0];
		let authDetails = await execSfdxJson('sf org display -o ' + resultElement.value +' --verbose', this, {
			fail: false,
			output: false,
		});

		authDetails = authDetails.result;
		accessTokenFromOrg = authDetails.accessToken;
		instanceURLFromOrg = authDetails.instanceUrl;
		items.push(new OrgData(
			'Connected Org: ' + resultElement.value,
			'',
			vscode.TreeItemCollapsibleState.None,
			resultElement.value,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));

		items.push(new OrgData(
			'Access Token: ' ,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.accessToken,
			'sensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'Api Version: ' + authDetails.apiVersion,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.apiVersion,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'Connected Status: ' + authDetails.connectedStatus,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.connectedStatus,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'Org Id: ' + authDetails.id,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.id,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'Instance URL: ' + authDetails.instanceUrl,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.instanceUrl,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'SfdxAuthUrl : ',
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.sfdxAuthUrl,
			'sensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		items.push(new OrgData(
			'Username : ' + authDetails.username,
			'',
			vscode.TreeItemCollapsibleState.None,
			authDetails.username,
			'nonSensitiveData',
			{
				command: 'orgData.selectedData',
				title: '',
				arguments: []
			}
		));
		return items;
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}

}

export class OrgData extends vscode.TreeItem {

	constructor(
		public readonly label: string,
		private readonly version: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly sensitiveData: string,
		public readonly contextValue: string,
		public readonly command?: vscode.Command
	) {
		super(label, collapsibleState);
		this.tooltip = `${this.label}-${this.version}`;
		this.description = this.version;
	}
}