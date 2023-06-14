/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from 'path';
import { window, workspace, ExtensionContext, commands, Range } from 'vscode';
import { friendlySyntaxToApiSyntax } from '@openfga/syntax-transformer';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	const serverModule = context.asAbsolutePath(
		path.join('server', 'out', 'server.js')
	);

	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
		}
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'openfga' }, { scheme: 'file', language: 'plaintext' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'openfga',
		'OpenFGA',
		serverOptions,
		clientOptions
	);

	const transformCommand = commands.registerCommand('openfga.commands.transformToJson', async () => {
		const activeEditor = window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		const text = activeEditor.document.getText();

		const modelInApiFormat = friendlySyntaxToApiSyntax(text);
		activeEditor.edit(editBuilder => {
			const range = new Range(0, 0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
			editBuilder.replace(range, JSON.stringify(modelInApiFormat, null, "  "));
		});
	});

	context.subscriptions.push(transformCommand);

	// Start the client. This will also launch the server
	client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
