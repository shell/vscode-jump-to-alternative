// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as path from 'path';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.jumpToAlternative', () => {
		if (!vscode.window.activeTextEditor) {
			return;
		}

		const basePath = vscode.window.activeTextEditor.document.uri.path;
		const splitFileName = path.basename(vscode.window.activeTextEditor.document.fileName).split(".");
		const fileName = splitFileName.slice(0,-1).join('');
		const extension = splitFileName[splitFileName.length-1];

		let globPattern = `**/*${fileName}`;
		globPattern = determineGlobPattern(globPattern, extension);

		vscode.workspace.findFiles(globPattern, null, 10).then((found: vscode.Uri[]): void => {
			if (found.length === 0) {
				vscode.window.setStatusBarMessage('jumpToAlternative: Unable to find test file', 3000);
				return;
			}

			const closestFile = found.sort((a, b) =>
				getPathDistance(basePath, b.path) - getPathDistance(basePath, a.path))[0];

			vscode.commands.executeCommand('vscode.open', vscode.Uri.file(closestFile.path));
		});

		function getPathDistance(a: string, b: string): number {
			let dist = 0;
			[...a].forEach((char, idx) => {
				if (idx < b.length && char === b[idx]) {
					dist++;
				}
			});

			return dist;
		}

		function determineGlobPattern(globPattern: string, extension: string): string {
			if (globPattern.toLowerCase().includes('spec') || globPattern.toLowerCase().includes('test')) {
				globPattern = handleSwitchToSourceFile(globPattern);
			} else {
				globPattern = handleSwitchToTestFile(globPattern);
			}

			return `${globPattern}.${extension}`;
		}

		function handleSwitchToSourceFile(globPattern: string): string {
			globPattern = globPattern.replace(new RegExp(`[_.]*spec`, 'ig'), '');
			globPattern = globPattern.replace(new RegExp(`[_.]*test`, 'ig'), '');

			return globPattern;
		}

		function handleSwitchToTestFile(globPattern: string): string {
			return `${globPattern}{_,.}{spec,test,Spec,Test}`;
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
