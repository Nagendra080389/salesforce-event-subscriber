# Salesforce Streaming Subscriber

The Salesforce Streaming Subscriber is a Visual Studio Code extension that allows you to manage and interact with Salesforce platform events and any streaming api directly from your workspace. This tool is designed to increase efficiency and streamline the development process when working with Salesforce.

## Features

This extension provides an interface within VS Code to:

1. Connect to Salesforce and fetch org information. (Automatically detects the default org in your workspace)
2. Subscribe and Unsubscribe from Salesforce Platform Events and other streaming channels such as CDC or Topics.
3. Add and delete nodes to manage multiple event subscriptions.
4. View the event data in real-time using the built-in Output Channel of VS Code.

## Usage

### Connecting to Salesforce Org

After installing the extension, you can view the org data by expanding the Salesforce Org Info tree in the Explorer view. This provides you with details about the connected Salesforce org, such as the Access Token, Api Version, Connected Status, Org Id, Instance URL, SfdxAuthUrl, and Username.

### Managing Salesforce Platform Events

The Salesforce Streaming Subscriber extension provides a tree view of all the events you've subscribed to in your Salesforce org. You can add new nodes to this tree by right-clicking on the tree view and selecting "Add Channel." You'll be prompted to enter the name of the channel/event you wish to subscribe to.

Once a node is added, you can click on it to subscribe to the corresponding event. The extension will then start receiving the event messages and display them in a dedicated Output Channel.

You can also unsubscribe from an event by right-clicking on the corresponding node and selecting "Delete Node." This will unsubscribe from the event and remove the node from the tree view.

### Commands

The extension provides the following commands:

- `eventNames.addChannel`: Add a new node to the event tree.
- `eventNames.runNodeCommand`: Subscribe to the event corresponding to the selected node.
- `eventNames.deleteNode`: Unsubscribe from the event corresponding to the selected node and remove the node from the tree.
- `eventNames.showOutputChannel`: Display the Output Channel containing the event data for the selected node.
- `orgData.showData`: Display sensitive data for the connected Salesforce org.

## Requirements

1. Visual Studio Code
2. Salesforce CLI
3. Salesforce DX
4. A Salesforce org

## Installation

1. Open Visual Studio Code.
2. Press `Ctrl+P` to open the Quick Open dialog.
3. Type `ext install your-extension-id` to find and install the Salesforce Streaming Subscriber extension.
4. Reload Visual Studio Code.

## Known Issues

If you discover any bugs or have a feature request, please feel free to open an issue on GitHub.

## License

MIT

## Contact

If you have any questions or comments, please feel free to contact me at [nagendra080389@gmail.com](mailto:nagendra080389@gmail.com)

## Disclaimer

This extension is not an official Salesforce product. It is a tool created by me to easily subscribe to streaming api channels in vscode.

<video src="media/demo/demo.mp4" controls title="Salesforce Streaming Subscriber Demo"></video>