/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   CppImplementer.ts                                  :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: ldedier <ldedier@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2019/07/12 20:04:15 by ldedier           #+#    #+#             */
/*   Updated: 2019/10/18 00:55:51 by ldedier          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import * as vscode from 'vscode';
import * as path from 'path';
import HppClassDecomposer from './HppClassDecomposer';
import CppImplementation from './Implementation';
import CppWatcher from './CppWatcher';

class CppImplementer
{

	public command: string;
	public editor: vscode.TextEditor;
	public hppDoc: vscode.TextDocument;
	public generateSettersAndGetters: boolean;

	constructor(editor: vscode.TextEditor, hppDoc: vscode.TextDocument)
	{
		this.editor = editor;
		this.hppDoc = hppDoc;
		this.command = (vscode.workspace.getConfiguration().get('cpp-skeleton.headerCommandId') as string).trim();
		this.generateSettersAndGetters = vscode.workspace.getConfiguration().get('cpp-skeleton.generateSettersAndGetters') as boolean;
	}

	private processFillSkeletonFromHpp()
	{
		var ImplementationsArray: CppImplementation[] | null;
		ImplementationsArray = this.GetImplementationsArray();
		if (ImplementationsArray != null)
		{
			this.editor.edit( edit => {
				const pos: vscode.Position = this.editor.selection.active;
				edit.insert(pos,
					[
						"#include \""+ path.basename(this.hppDoc.fileName) as string +"\"",
						(<CppImplementation[]> ImplementationsArray).map(
							implementation => implementation.implements()).join("\n\n")
					].join("\n\n"));
			});
		}
		else
		{
			vscode.window.showErrorMessage(this.hppDoc.fileName + " is not a well formatted hpp class file.");
		}
	}

	private  computeImplementation(regexArray: RegExpExecArray, className: string, innerClass: boolean): CppImplementation
	{
		var type = regexArray[8];
		var rhs = regexArray[14];
		const stc = regexArray[2];
		const cst = regexArray[4];
		const virtual = regexArray[6];
		const methodName = regexArray[15];
		const args = regexArray[16];
	
		var isConstructor = false;
		if (rhs.charAt(0) == '(')
		{
			isConstructor = true;
			rhs = type + rhs;
			type = "";
		}

		var prototype: string;
		var body = "\t";
		var prefix = regexArray[4] ? regexArray[4] + " " : "";

		// res = (stc ? "/*\n** static method\n*/\n" : "");
		let arr: RegExpMatchArray | null;
		if (!stc && innerClass && this.generateSettersAndGetters &&  (arr = methodName.match(new RegExp(/.*get([A-Za-z_0-9\-~].*)/g, ""))))
			body = "\treturn (this->_" + arr[1].charAt(0).toLowerCase() + arr[1].slice(1) + ");";
		else if (!stc && innerClass && this.generateSettersAndGetters && (arr = methodName.match(new RegExp(/.*set([A-Za-z_0-9\-~].*)/g, ""))))
			body = "\tthis->_" + arr[1].charAt(0).toLowerCase() + arr[1].slice(1) + " = " + args.split(" ").slice(-1)[0] + ";";
		const classNamePrefix = (innerClass ? className + "::" : "");
		if (type)
			prototype = prefix + type + "\t" + classNamePrefix + rhs;
		else
			prototype = prefix + classNamePrefix + rhs;
		return (new CppImplementation(prototype, body, methodName, args, isConstructor));
	}

	private static sortImplementationsArray(implementations: CppImplementation[])
	{
		var i;
		var foundPrevNonConstructor = 1;
		while (foundPrevNonConstructor)
		{
			foundPrevNonConstructor = 0;
			var foundindex = -1;
			i = 0;
			while (i < implementations.length)
			{
				if (foundindex != -1 && implementations[i].isConstructor)
				{
					foundPrevNonConstructor = 1;
					var elt : CppImplementation = implementations.splice(i, 1)[0];
					implementations.splice(foundindex, 0, elt);
					break;
				}
				if (!implementations[i].isConstructor)
				{
					foundindex = i;
				}
				i++;
			}
		}
	}

	private GetImplementationsArray(): CppImplementation[] | null
	{
		const decomposer : HppClassDecomposer = new HppClassDecomposer(this.hppDoc);
		if (decomposer.success)
		{
			
			// const Functionregex = RegExp(/^(\t| )*(static)?(\t| )*(([A-Za-z_:\-~]*)((\t| )*(&|\*))?)(\t| )*(([A-Za-z_0-9<=\+\/\-~]*)\((.*)\).*);$/, 'gm');
			const Functionregex = RegExp(/^(\t| )*(static)?(\t| )*(const)?(\t| )*(virtual)?(\t| )*(([A-Za-z_:\-~]*)((\t| )*(\&|\*))?)(\t| )*(([A-Za-z_0-9\<\>!\*=\+\/\-~]*)\((.*)\)([^=\n])*);(\t| )*$/, 'gm');
			let array: RegExpExecArray | null;
			var implementations: CppImplementation[] = [];
			const className : string = path.basename(this.editor.document.fileName, ".cpp");
			while ((array = Functionregex.exec(decomposer.innerClass)))
			{
				// console.log(array);
				let implementation = this.computeImplementation(array, className, true);
				implementations.push(implementation);
			}
			while ((array = Functionregex.exec(decomposer.bottom)))
			{
				// console.log(array);
				let implementation = this.computeImplementation(array, className, false);
				implementations.push(implementation);
			}

			console.log(implementations);
			CppImplementer.sortImplementationsArray(implementations);
			console.log(implementations);
			return (implementations);
		}
		else
			return (null);
	}

	public  fillSkeleton()
	{
		if (this.command && this.command.length > 0)
		{
			vscode.commands.executeCommand(this.command).then(() => {
				vscode.window.showTextDocument(this.editor.document, 1, false).then(() => {
					this.processFillSkeletonFromHpp();
				})
			}, (err)=> {
				vscode.window.showErrorMessage(err.message);
			})
		}
		else
			this.processFillSkeletonFromHpp();
	}

	private processImplementMissingMethods()
	{
		const text = this.editor.document.getText();
		
		var implementationsArray: CppImplementation[] | null;
		var missingImplementations: CppImplementation[] = [];
		if ((implementationsArray = this.GetImplementationsArray()))
		{
			console.log('text', text);

			for (let i = 0; i < implementationsArray.length; i++) {
				const implementation = implementationsArray[i];
				if (text.indexOf(implementation.prototype) == -1)
					missingImplementations.push(implementationsArray[i])
			}
			if (missingImplementations.length > 0)
			{
				this.editor.edit( edit => {
					const pos: vscode.Position = this.editor.document.positionAt(this.editor.document.getText().length);
					// this.editor.selection.active = pos;
					edit.insert(pos,
						[	"",
							(<CppImplementation[]> missingImplementations).map(elt => elt.implements()).join("\n\n")
						].join("\n\n"));
				});
			}
		}
		else
			vscode.window.showErrorMessage(this.hppDoc.fileName + " is not a well formatted hpp class file.");
	}

	public static implementsMissingMethods()
	{
		if (vscode.window.activeTextEditor
			&& path.extname(vscode.window.activeTextEditor.document.fileName).substr(1) == "cpp")
		{
			let editor = vscode.window.activeTextEditor as vscode.TextEditor;
			const matchinHppFileName : string = <string>CppWatcher.getHppRelativePath();
			vscode.workspace.openTextDocument(matchinHppFileName).then(
			(doc) => {
					const implementer : CppImplementer = new CppImplementer(editor, doc); 
					implementer.processImplementMissingMethods();
			},
			(err) => {
				vscode.window.showErrorMessage(err.message);
			})
		}
		else
			vscode.window.showErrorMessage("this command shall be executed while editing a .cpp file")
	}

	public static clearAsNewSkeleton()
	{
		if (vscode.window.activeTextEditor
			&& path.extname(vscode.window.activeTextEditor.document.fileName).substr(1) == "cpp")
		{
			let editor = vscode.window.activeTextEditor as vscode.TextEditor;
			
			const matchinHppFileName : string = <string>CppWatcher.getHppRelativePath();

			vscode.workspace.openTextDocument(matchinHppFileName).then(
			(doc) => {
				var firstLine = editor.document.lineAt(0);
				var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
				var textRange = new vscode.Range(0, 
								 firstLine.range.start.character, 
								 editor.document.lineCount - 1, 
								 lastLine.range.end.character);
				editor.edit(edit =>
				{
					edit.delete(textRange);
				}).then(() => {
					const implementer : CppImplementer = new CppImplementer(editor, doc); 
					implementer.fillSkeleton();
					})
			},
			(err) => {
				vscode.window.showErrorMessage(err.message);
			})
		}
		else
			vscode.window.showErrorMessage("this command shall be executed while editing a .cpp file")
	}
}
export default CppImplementer;
