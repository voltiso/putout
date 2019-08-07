'use strict';

const {types} = require('putout');

const {
    isIdentifier,
    isStringLiteral,
    isTemplateLiteral,
} = types;

module.exports.report = () => '"lint" should check "madrun.js"';

module.exports.fix = ({line}) => {
    if (isStringLiteral(line)) {
        const result = line.value.replace('test', 'test madrun.js');
        
        line.value = result;
        line.raw = result;
        return;
    }
    
    const result = line.value.raw.replace('test', 'test madrun.js');
    
    line.value.raw = result;
    line.value.cooked = result;
};

module.exports.traverse = ({push}) => {
    return {
        MemberExpression(path) {
            const {object, property} = path.node;
            
            if (!isModuleExports(object, property))
                return;
            
            const {parentPath} = path;
            
            if (!parentPath.isAssignmentExpression())
                return;
            
            const rightPath = parentPath.get('right');
            
            if (!rightPath.isObjectExpression())
                return;
            
            const lint = findKey('lint', rightPath);
            
            if (!lint)
                return;
            
            const value = lint.parentPath.get('value');
            
            if (!value.isFunction())
                return;
            
            const {body} = value.node;
            
            if (isStringLiteral(body) && !/madrun/.test(body.value))
                return push({
                    path: rightPath,
                    lint,
                    line: body,
                });
            
            if (!isTemplateLiteral(body))
                return;
            
            if (body.expressions.length)
                return;
            
            const [line] = body.quasis;
            
            if (line.value.raw.includes('madrun'))
                return;
            
            push({
                path: rightPath,
                lint,
                line,
            });
        },
    };
};

function isModuleExports(object, property) {
    const isModule = isIdentifier(object, {name: 'module'});
    const isExports = isIdentifier(property, {name: 'exports'});
    
    return isModule && isExports;
}

function findKey(name, path) {
    const properties = path.get('properties');
    
    for (const property of properties) {
        const key = property.get('key');
        const is = isKey(name, key);
        
        if (is)
            return key;
    }
    
    return null;
}

function isKey(name, key) {
    const isId = key.isIdentifier({name});
    const isStr = key.isStringLiteral({
        value: name,
    });
    
    return isStr || isId;
}

