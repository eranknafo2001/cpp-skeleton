const CLASS_REGEX: RegExp = new RegExp(/^(?<type>class|struct)\s+(?<name>[\w\d_]+)(\s*:[^{}]*)?\s*{(?<contents>[^]*?)};$/, 'gm');
const FUNCTION_REGEX = RegExp(/^\s*(?<prefix>(static|virtual)\s+)*(?<returnType>(const\s+)?([A-Za-z_]([\w:]*\w)?)(\s*(\&|\*))?)\s+(?<name>([A-Za-z_][\w\<\>!\*=\+\/\-~]*)\(([^\(\)]*)\)(\s*const)?)\s*;/, 'gm');
const CONSTRACTOR_REGEX = RegExp(/^\s*(?<name>~?[a-zA-Z_]\w*?\([^\(\)]*\))\s*;/, 'gm');

const throwError = (message?: string) => {
    throw new Error(message);
}
export const getClasses = (contents: String) =>
    Array.from(contents.matchAll(CLASS_REGEX), (classMatch) =>
        new Class(classMatch.groups?.name ?? throwError(),
            Array.from(classMatch.groups?.contents?.matchAll(FUNCTION_REGEX) ?? throwError(), (functionMatch) =>
                new Function(functionMatch.groups?.name ?? throwError(), functionMatch.groups?.prefix ?? "", functionMatch.groups?.returnType ?? throwError())
            ),
            Array.from(classMatch.groups?.contents?.matchAll(CONSTRACTOR_REGEX) ?? throwError(), (constractorMatch) =>
                new Constractor(constractorMatch.groups?.name ?? throwError())
            ),
        )
    )

export class Class {
    private _name: string;
    public constructors: Constractor[];
    public functions: Function[];

    public constructor(name: string, functions: Function[], constructors: Constractor[]) {
        this._name = name;
        this.functions = functions;
        this.constructors = constructors;
    }

    public get name(): string { return this._name }
}

export class Constractor {
    private _name: string;

    public constructor(name: string) {
        this._name = name;
    }

    public get name() { return this._name; }
}

export class Function {
    private _prefix: string;
    private _returnType: string;
    private _name: string;

    public constructor(name: string, prefix: string, returnType: string) {
        this._name = name;
        this._prefix = prefix
        this._returnType = returnType;
    }

    public get name() { return this._name; }
    public get prefix() { return this._prefix }
    public get returnType() { return this._returnType; }
}

