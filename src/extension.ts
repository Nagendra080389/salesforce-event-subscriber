'use strict';

import * as vscode from 'vscode';

import {OrgInfoListProvider, OrgData} from './orgInfo';
import {EventDataProvider, EventListData} from "./eventListData";

export function activate(context: vscode.ExtensionContext) {
	const rootPath = (vscode.workspace.workspaceFolders && (vscode.workspace.workspaceFolders.length > 0))
		? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

	const orgDataProvider = new OrgInfoListProvider(rootPath);
	vscode.window.registerTreeDataProvider('orgData', orgDataProvider);

	const eventDataProvider = new EventDataProvider(rootPath);
	vscode.window.registerTreeDataProvider('eventNames', eventDataProvider);

	vscode.commands.registerCommand('eventNames.deleteEntry', (node: EventListData) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));
	vscode.commands.registerCommand('eventNames.editEntry', (node: EventListData) => vscode.window.showInformationMessage(`Successfully called delete entry on ${node.label}.`));

	vscode.commands.registerCommand('orgData.showData', async (node: OrgData) => {
		vscode.window.showInformationMessage(`You can copy this data from here :  ${node.sensitiveData}`);
	});

	vscode.commands.registerCommand('eventNames.addChannel', async () => {
		await eventDataProvider.addNode('eventNames.runNodeCommand');
	});

	const runNodeCommand = vscode.commands.registerCommand('eventNames.runNodeCommand', async (nodeLabel: string) => {
		await eventDataProvider.runNodeCommand(nodeLabel, false);
	});

	const deleteNodeCommand = vscode.commands.registerCommand('eventNames.deleteNode', async (node: EventListData) => {
		await eventDataProvider.deleteNode(node);
	});

	const showOutputChannel = vscode.commands.registerCommand('eventNames.showOutputChannel', async (node: EventListData) => {
		if (typeof node.label === "string") {
			await eventDataProvider.runNodeCommand(node.label, true);
		}
		await node.outputChannel.show();
	});

}