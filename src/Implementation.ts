const SET_GET_REGEX = RegExp(/(set|get)_?([\w\d_]+)\(/, "g")

class CppImplementation {
    private className: String;
    private prefix: String;
    private returnType: String;
    private funcName: String;
    private isConstractor: boolean;

    constructor(className: String, prefix: String, returnType: String, funcName: String, isConstractor: boolean) {
        this.className = className;
        this.prefix = prefix;
        this.returnType = returnType;
        this.funcName = funcName;
        this.isConstractor = isConstractor
    }

    public generateImplemetation(generateSettersAndGetters: boolean): string {
        let body = "";
        if (generateSettersAndGetters && !this.isConstractor) {
            const res = this.funcName.match(SET_GET_REGEX);
            if (res) {
                const name = res[2].charAt(0).toLowerCase() + res[2].slice(1);
                body = res[1] == "set" ? `this->_${name} = ${name};` : `return this->_${name};`;
            }
        }
        return (this.isConstractor ? `${this.className}::${this.funcName}` : `${this.returnType} ${this.className}::${this.funcName}`) + ` { ${body} }`;
    }
}
export default CppImplementation;
