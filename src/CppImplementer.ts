import * as vscode from 'vscode';
import { Class } from './HppClassDecomposer';
import CppImplementation from './Implementation';

class CppImplementer {

    public command: string;
    public editor: vscode.TextEditor;
    public classes: Class[];
    public includeFilename: String;
    public generateSettersAndGetters: boolean;

    constructor(editor: vscode.TextEditor, includeFilename: String, classes: Class[]) {
        this.editor = editor;
        this.classes = classes;
        this.includeFilename = includeFilename;
        this.command = (vscode.workspace.getConfiguration().get('cpp-skeleton.headerCommandId') as string).trim();
        this.generateSettersAndGetters = vscode.workspace.getConfiguration().get('cpp-skeleton.generateSettersAndGetters') as boolean;
    }

    private processFillSkeletonFromHpp() {
        const ImplementationsArray = this.GetImplementationsArray();
        this.editor.edit(edit => {
            const pos: vscode.Position = this.editor.selection.active;
            edit.insert(pos,
                [
                    `#include "${this.includeFilename}"`,
                    ...ImplementationsArray.map(i => i.generateImplemetation(this.generateSettersAndGetters))
                ].join("\n\n"));
        });
    }

    private GetImplementationsArray(): CppImplementation[] {
        return this.classes.map(c => [
            c.functions.map(f => new CppImplementation(c.name, f.prefix, f.returnType, f.name, false)),
            c.constructors.map(f => new CppImplementation(c.name, "", "", f.name, true)),
        ]).flat(2);
    }

    public async fillSkeleton() {
        if (this.command && this.command.length > 0) {
            await vscode.commands.executeCommand(this.command)
            await vscode.window.showTextDocument(this.editor.document, 1, false)
        }
        this.processFillSkeletonFromHpp();
        await vscode.commands.executeCommand('editor.action.formatDocument');
        await vscode.commands.executeCommand('workbench.action.files.save');
    }

    // private processImplementMissingMethods() {
    //     const text = this.editor.document.getText();

    //     var implementationsArray: CppImplementation[] | null;
    //     var missingImplementations: CppImplementation[] = [];
    //     if ((implementationsArray = this.GetImplementationsArray())) {
    //         console.log('text', text);

    //         for (let i = 0; i < implementationsArray.length; i++) {
    //             const implementation = implementationsArray[i];
    //             if (text.indexOf(implementation.prototype) == -1)
    //                 missingImplementations.push(implementationsArray[i])
    //         }
    //         if (missingImplementations.length > 0) {
    //             this.editor.edit(edit => {
    //                 const pos: vscode.Position = this.editor.document.positionAt(this.editor.document.getText().length);
    //                 // this.editor.selection.active = pos;
    //                 edit.insert(pos,
    //                     ["",
    //                         (<CppImplementation[]>missingImplementations).map(elt => elt.implements()).join("\n\n")
    //                     ].join("\n\n"));
    //             });
    //         }
    //     }
    //     else
    //         vscode.window.showErrorMessage(this.hppDoc.fileName + " is not a well formatted hpp class file.");
    // }

    // public static implementsMissingMethods() {
    //     if (vscode.window.activeTextEditor
    //         && path.extname(vscode.window.activeTextEditor.document.fileName).substr(1) == "cpp") {
    //         let editor = vscode.window.activeTextEditor as vscode.TextEditor;
    //         const matchinHppFileName: string = <string>CppWatcher.getHppRelativePath();
    //         vscode.workspace.openTextDocument(matchinHppFileName).then(
    //             (doc) => {
    //                 const implementer: CppImplementer = new CppImplementer(editor, doc);
    //                 implementer.processImplementMissingMethods();
    //             },
    //             (err) => {
    //                 vscode.window.showErrorMessage(err.message);
    //             })
    //     }
    //     else
    //         vscode.window.showErrorMessage("this command shall be executed while editing a .cpp file")
    // }

    // public static clearAsNewSkeleton() {
    //     if (vscode.window.activeTextEditor
    //         && path.extname(vscode.window.activeTextEditor.document.fileName).substr(1) == "cpp") {
    //         let editor = vscode.window.activeTextEditor as vscode.TextEditor;

    //         const matchinHppFileName: string = <string>CppWatcher.getHppRelativePath();

    //         vscode.workspace.openTextDocument(matchinHppFileName).then(
    //             (doc) => {
    //                 var firstLine = editor.document.lineAt(0);
    //                 var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
    //                 var textRange = new vscode.Range(0,
    //                     firstLine.range.start.character,
    //                     editor.document.lineCount - 1,
    //                     lastLine.range.end.character);
    //                 editor.edit(edit => {
    //                     edit.delete(textRange);
    //                 }).then(() => {
    //                     const implementer: CppImplementer = new CppImplementer(editor, doc);
    //                     implementer.fillSkeleton();
    //                 })
    //             },
    //             (err) => {
    //                 vscode.window.showErrorMessage(err.message);
    //             })
    //     }
    //     else
    //         vscode.window.showErrorMessage("this command shall be executed while editing a .cpp file")
    // }
}
export default CppImplementer;
