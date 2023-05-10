import * as vscode from "vscode";
import {Logger} from "./logger";
import * as c from "chalk";
import * as childProcess from "child_process";
import { Worker } from "worker_threads";
import * as path from "path";


let REMOTE_CONFIGS: any = {};
let PROJECT_CONFIG: any = null;
let COMMANDS_RESULTS: any = {};
let MULTITHREAD_ACTIVE: boolean | null = null;

export function resetCache() {
    REMOTE_CONFIGS = {};
    PROJECT_CONFIG = null;
    COMMANDS_RESULTS = {};
}
export async function execSfdxJson(
    command: string,
    commandThis: any,
    options: any = {
        fail: false,
        output: false,
        debug: false,
    }
): Promise<any> {
    if (!command.includes("--json")) {
        command += " --json";
    }
    return await execCommand(command, commandThis, options);
}

// Execute command
export async function execCommand(
    command: string,
    commandThis: any,
    options: any = {
        fail: false,
        output: false,
        debug: false,
        spinner: true,
    }
): Promise<any> {
    let commandResult = null;
    // Call command (disable color before for json parsing)
    const prevForceColor = process.env.FORCE_COLOR;
    process.env.FORCE_COLOR = "0";
    let uri;
    if (vscode.workspace.workspaceFolders) {
        uri = vscode.workspace.workspaceFolders[0].uri;
    }
    const execOptions: any = {
        maxBuffer: 10000 * 10000,
        cwd: options.cwd || uri,
        env: process.env,
    };
    try {
        if (COMMANDS_RESULTS[command]) {
            // use cache
            Logger.log(
                `[sf-streaming-subscriber][command] Waiting for promise already started for command ${command}`
            );
            commandResult =
                COMMANDS_RESULTS[command].result ??
                (await COMMANDS_RESULTS[command].promise);
        } else {
            // no cache
            Logger.log("[sf-streaming-subscriber][command] " + command);
            console.time(command);
            const commandResultPromise = await execShell(command, execOptions);
            COMMANDS_RESULTS[command] = { promise: commandResultPromise };
            commandResult = await commandResultPromise;
            COMMANDS_RESULTS[command] = { result: commandResult };
            console.timeEnd(command);
        }
    } catch (e: any) {
        console.timeEnd(command);
        process.env.FORCE_COLOR = prevForceColor;
        // Display error in red if not json
        if (!command.includes("--json") || options.fail) {
            if (options.fail) {
                Logger.log(`ERROR: ${e.stdout}\n${e.stderr}`);
                throw e;
            }
        }
        // if --json, we should not have a crash, so return status 1 + output log
        return {
            status: 1,
            errorMessage: `[sfdx-sf-streaming-subscriber][ERROR] Error processing command\n$${e.stdout}\n${e.stderr}`,
        };
    }
    // Display output if requested, for better user understanding of the logs
    if (options.output || options.debug) {
        Logger.log(commandResult.stdout.toString());
    }
    // Return status 0 if not --json
    process.env.FORCE_COLOR = prevForceColor;
    if (!command.includes("--json")) {
        return {
            status: 0,
            stdout: commandResult.stdout,
            stderr: commandResult.stderr,
        };
    }
    // Parse command result if --json
    try {
        const parsedResult = JSON.parse(commandResult.stdout.toString());
        if (options.fail && parsedResult.status && parsedResult.status > 0) {
            throw new Error(
                c.red(`[sfdx-sf-streaming-subscriber][ERROR] Command failed: ${commandResult}`)
            );
        }
        if (commandResult.stderr && commandResult.stderr.length > 2) {
            Logger.log(
                "[sfdx-sf-streaming-subscriber][WARNING] stderr: " + c.yellow(commandResult.stderr)
            );
        }
        return parsedResult;
    } catch (e: any) {
        // Manage case when json is not parsable
        return {
            status: 1,
            errorMessage: c.red(
                `[sfdx-sf-streaming-subscriber][ERROR] Error parsing JSON in command result: ${e.message}\n${commandResult.stdout}\n${commandResult.stderr})`
            ),
        };
    }
}

export async function execShell(cmd: string, execOptions: any) {
    if (isMultithreadActive()) {
        // Use worker to perform CLI command
        return new Promise<any>((resolve, reject) => {
            const worker = new Worker(path.join(__dirname, "worker.js"), {
                workerData: {
                    cliCommand: { cmd: cmd, execOptions: JSON.stringify(execOptions) },
                    path: "./worker.ts",
                },
            });
            worker.on("message", (result) => {
                if (result.error) {
                    reject(result.error);
                }
                resolve({ stdout: result.stdout, stderr: result.stderr });
            });
        });
    } else {
        // Use main process to perform CLI command
        return new Promise<any>((resolve, reject) => {
            childProcess.exec(cmd, execOptions, (error, stdout, stderr) => {
                if (error) {
                    return reject(error);
                }
                return resolve({ stdout: stdout, stderr: stderr });
            });
        });
    }
}

export function isMultithreadActive() {
    if (MULTITHREAD_ACTIVE !== null) {
        return MULTITHREAD_ACTIVE;
    }
    const config = vscode.workspace.getConfiguration("vsCodeStreamingSubscriber");
    if (config?.enableMultithread === true) {
        MULTITHREAD_ACTIVE = true;
        return true;
    }
    MULTITHREAD_ACTIVE = false;
    return false;
}