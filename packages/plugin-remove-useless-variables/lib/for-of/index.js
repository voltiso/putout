'use strict';

const {
    types,
    operator,
} = require('putout');
const {replaceWith} = operator;

const {isAssignmentPattern} = types;

const isToManyProperties = (a, {maxProperties}) => a.isObjectPattern() && a.node.properties.length > maxProperties;
const isAssignment = (a) => isAssignmentPattern(a.value);

module.exports.report = () => `Destructuring should be used in the head of for-of`;

module.exports.fix = ({path, varPath}) => {
    replaceWith(varPath, path.node.id);
    path.remove();
};

module.exports.traverse = ({push, options}) => ({
    'for (const __ of __) __'(path) {
        const leftPath = path.get('left');
        const varPath = leftPath.get('declarations.0.id');
        
        if (!varPath.isIdentifier())
            return;
        
        const {scope, node} = varPath;
        const {name} = node;
        const binding = scope.bindings[name];
        
        if (!binding)
            return;
        
        const {
            references,
            referencePaths,
        } = binding;
        
        if (references !== 1)
            return;
        
        const [referencePath] = referencePaths;
        const {parentPath} = referencePath;
        const isSameName = parentPath
            .get('init')
            .isIdentifier({name});
        
        if (!isSameName)
            return;
        
        const idPath = parentPath.get('id');
        const {maxProperties = 4} = options;
        
        if (isToManyProperties(idPath, {maxProperties}))
            return;
        
        const {properties} = idPath.node;
        
        if (properties.find(isAssignment))
            return;
        
        push({
            path: parentPath,
            varPath,
        });
    },
});

