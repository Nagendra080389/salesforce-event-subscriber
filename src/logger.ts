let loggerInstance: Logger;

export class Logger {
	outputChannel: any;

	constructor(vsCodeWindow: any) {
		this.outputChannel = vsCodeWindow.createOutputChannel("Streaming Subscriber");
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		loggerInstance = this;
	}

	static log(str: any): void {
		if (loggerInstance) {
			console.log(str);
			for (const line of str.toString().split("\n")) {
				loggerInstance.outputChannelLog(line);
			}
		} else {
			console.log(str);
		}
	}

	outputChannelLog(str: string) {
		this.outputChannel.appendLine(str);
	}
}
