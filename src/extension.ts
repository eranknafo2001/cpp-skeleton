import * as vscode from 'vscode';
import CppWatcher from './CppWatcher';
import CppImplementer from './CppImplementer';

const watcher: CppWatcher = new CppWatcher();

export function activate(context: vscode.ExtensionContext) {

    // let addMissingMethodsRegisteration = vscode.commands.registerCommand('cpp-skeleton.addMissingMethods', CppImplementer.implementsMissingMethods);
    // let clearAsNewSkeletonRegistration = vscode.commands.registerCommand('cpp-skeleton.clearAsNewSkeleton', CppImplementer.clearAsNewSkeleton);

    // context.subscriptions.push(addMissingMethodsRegisteration);
    // context.subscriptions.push(clearAsNewSkeletonRegistration);

    watcher.startWatch()
}

export function deactivate() { }
