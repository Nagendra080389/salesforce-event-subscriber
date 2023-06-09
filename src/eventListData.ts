import * as vscode from 'vscode';
import { EventEmitter } from 'events';
import { Connection } from 'jsforce';
import { accessTokenFromOrg, instanceURLFromOrg } from "./orgInfo";
import { Logger } from "./logger";
import * as fs from 'fs';
import * as path from 'path';

export class EventDataProvider implements vscode.TreeDataProvider<EventListData> {

	private _onDidChangeTreeData: vscode.EventEmitter<EventListData | undefined | null | void> = new vscode.EventEmitter<EventListData | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<EventListData | undefined | null | void> = this._onDidChangeTreeData.event;

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	constructor(private workspaceRoot: string | undefined, private context: vscode.ExtensionContext) {
		const savedNodes = context.workspaceState.get<EventListData[]>('nodes', []);
		this.nodes = savedNodes.map(nodeData => {
			if (typeof nodeData.label === 'string') {
				return new EventListData(nodeData.label, nodeData.command);
			} else {
				throw new Error('Invalid label type');
			}
		});
	}

	private nodes: EventListData[] = [];

	public getNodes(): EventListData[] {
		return this.nodes;
	}

	getTreeItem(element: EventListData): vscode.TreeItem {
		return element;
	}

	async addNode(commandId: string): Promise<void> {

		const nodeName = await vscode.window.showInputBox({ prompt: 'Enter the full name, for eg: Platform event starts with \'/event/eventname__e\', CDC starts with \'/data/ChangeEventName\' etc ', title: 'Enter the channel/CDC/Topic name' });
		Logger.log(`[sf-streaming-subscriber][addNode] Channel Name is ->  ${nodeName}`);
		if (nodeName) {
			const newNode = new EventListData(nodeName, {
				command: commandId,
				title: nodeName,
				arguments: [nodeName],
			});
			newNode.commandRun = false;
			this.nodes.push(newNode);
			await this.context.workspaceState.update('nodes', this.nodes);
			this.refresh();
		}
	}

	getChildren(element?: EventListData): Thenable<EventListData[]> {
		if (!this.workspaceRoot) {
			vscode.window.showInformationMessage('No sfdx project in empty workspace');
			return Promise.resolve([]);
		}
		const sfdxCofigExists = path.join(this.workspaceRoot, '.sfdx/sfdx-config.json');
		if (this.pathExists(sfdxCofigExists)) {
			if (element) {
				return Promise.resolve(element.children);
			} else {
				return Promise.resolve(this.nodes);
			}
		} else {
			vscode.window.showInformationMessage('Workspace has no sfdx-config.json');
			return Promise.resolve([]);
		}
	}

	private pathExists(p: string): boolean {
		try {
			fs.accessSync(p);
		} catch (err) {
			return false;
		}

		return true;
	}

	async runNodeCommand(nodeLabel: string, fromButton: boolean): Promise<void> {
		const node = this.nodes.find(n => n.label === nodeLabel);
		Logger.log(`[sf-streaming-subscriber][runNodeCommand] Node selected is ->  ${nodeLabel}`);
		if (node && node.command && !node.commandRun) {
			if (accessTokenFromOrg) {
				try {
					// Connect to Salesforce
					const conn = await this.connectToSalesforce();

					// Subscribe to the platform event
					this.subscribeToPlatformEvent(conn, node);
					vscode.window.showInformationMessage('Subscribed successfully to ' + nodeLabel);
				} catch (error) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					vscode.window.showErrorMessage(error.message);
				} finally {
					//make commandRun as true so that when user clicks the event again we don't keep subscribing it.
					node.commandRun = true;
				}

				// Refresh the tree view
				this.refresh();
			} else {
				vscode.window.showInformationMessage('Wait for the org data to appear, try resubscribing after that.');
			}
		} else {
			if (node?.commandRun && !fromButton) {
				vscode.window.showInformationMessage('Already subscribed successfully to ' + nodeLabel);
			}
		}
	}

	private subscribeToPlatformEvent(conn: Connection, node: EventListData): void {
		// platform event name
		const channel = node.label;
		let subscription;
		if (typeof channel === "string") {
			subscription = conn.streaming.topic(channel).subscribe((message) => {
				node.outputChannel.appendLine(JSON.stringify(message));
			});
		}
		node.subscription = subscription;
	}


	private async connectToSalesforce(): Promise<Connection> {
		return new Connection({ accessToken: accessTokenFromOrg, instanceUrl: instanceURLFromOrg });
	}

	async deleteNode(nodeLabel: EventListData): Promise<void> {
		const nodeIndex = this.nodes.findIndex(n => n.label === nodeLabel.label);
		Logger.log(`[sf-streaming-subscriber][deleteNode] Node to be deleted is ->  ${nodeLabel.label}`);
		Logger.log(`[sf-streaming-subscriber][deleteNode] Node index ->  ${nodeIndex}`);
		if (nodeIndex !== -1) {
			// Unsubscribe from the platform event
			if (this.nodes[nodeIndex].subscription) {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.nodes[nodeIndex].subscription.unsubscribe();
			}

			// Remove the output channel
			this.nodes[nodeIndex].outputChannel.dispose();

			// Remove the node from the nodes array
			this.nodes.splice(nodeIndex, 1);

			await this.context.workspaceState.update('nodes', this.nodes);

			// Refresh the tree view
			this.refresh();
		}
	}

}

export class EventListData extends vscode.TreeItem {
	children: EventListData[] = [];
	commandRun = false;
	outputChannel: vscode.OutputChannel;
	subscription?: EventEmitter;

	constructor(label: string, command?: vscode.Command) {
		super(label, vscode.TreeItemCollapsibleState.None);
		this.command = command;
		this.outputChannel = vscode.window.createOutputChannel(label);
	}

	contextValue = 'streamingEvent';
}


