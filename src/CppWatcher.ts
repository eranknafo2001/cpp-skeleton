import * as vscode from 'vscode';
import * as path from 'path';

import CppImplementer from './CppImplementer';
import { getClasses } from './HppClassDecomposer';

class CppWatcher {

    public fileSystemWatcher?: vscode.FileSystemWatcher;

    startWatch() {
        this.fileSystemWatcher = vscode.workspace.createFileSystemWatcher("**" + path.sep + "{[A-Z],[a-z]}*.cpp",
            false, true, true);
        this.fileSystemWatcher.onDidCreate(this.onCreateCpp);
    }

    private static getHppRelativePath(): string | undefined {
        let rel = (vscode.workspace.getConfiguration().get('cpp-skeleton.matchingHppPath') as string).trim();

        if (!rel || !rel.length)
            rel = ".";
        if (vscode.window.activeTextEditor)
            return path.normalize(path.join(path.dirname(vscode.window.activeTextEditor.document.fileName), rel, path.basename(vscode.window.activeTextEditor.document.fileName).replace(/\.cpp$/, ".hpp")));
    }

    private onCreateCpp = async (uri: vscode.Uri) => {
        if (vscode.window.activeTextEditor?.document.uri.path == uri.path && vscode.window.activeTextEditor.document.getText().length == 0) {
            const matchinHppFileName = CppWatcher.getHppRelativePath();
            if (!matchinHppFileName) return;
            const hppDoc = await vscode.workspace.openTextDocument(matchinHppFileName)
            const contents = hppDoc.getText()
            const classes = getClasses(contents);
            const cppImplementer = new CppImplementer(vscode.window.activeTextEditor, path.basename(hppDoc.fileName), classes);
            await cppImplementer.fillSkeleton();
        }
    }
}
export default CppWatcher;
