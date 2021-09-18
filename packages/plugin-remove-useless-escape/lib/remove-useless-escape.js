'use strict';

const emojiRegex = require('emoji-regex');

module.exports.report = () => 'Unnecessary escape character';

module.exports.fix = (path) => {
    if (path.isStringLiteral()) {
        const {raw} = path.node;
        path.node.raw = unEscape(raw);
        return;
    }
    
    if (path.isRegExpLiteral()) {
        const {pattern} = path.node;
        const unescaped = unescapeRegExp(pattern);
        path.node.pattern = unescaped;
        path.node.raw = `/${unescaped}/`;
        path.node.extra.raw = `/${unescaped}/`;
        return;
    }
    
    for (const tmpl of path.node.quasis) {
        const {raw} = tmpl.value;
        tmpl.value.raw = unEscape(raw);
    }
};

module.exports.traverse = ({push}) => ({
    'RegExpLiteral'(path) {
        const {raw} = path.node;
        
        if (isEscapedRegExp(raw))
            push(path);
    },
    '"__"'(path) {
        const {raw} = path.node;
        
        if (isEscaped(raw))
            push(path);
    },
    
    '`__`'(path) {
        for (const tmpl of path.node.quasis) {
            const {raw} = tmpl.value;
            
            if (hasQuote(raw))
                return push(path);
            
            if (isEscaped(raw))
                return push(path);
        }
    },
});

const createCheckRegExp = (a) => RegExp(`^((?!\\\\).)*\\\\${a}.`);

const match = (a) => a.match(emojiRegex()) || [];
const hasA = (a) => /\\\^/.test(a);
const hasDoubleQuote = (a) => createCheckRegExp('"').test(a);
const hasQuote = (a) => createCheckRegExp(`'`).test(a);

const hasEmoji = (a) => {
    for (const emoji of match(a)) {
        if (a.includes(`\\${emoji}`))
            return true;
    }
    
    return false;
};

function isEscaped(raw) {
    if (!raw)
        return false;
    
    if (!raw.includes('\\'))
        return false;
    
    if (hasDoubleQuote(raw))
        return true;
    
    if (hasEmoji(raw))
        return true;
    
    if (hasA(raw))
        return true;
    
    return false;
}

const createEncodedRegExp = (a) => RegExp(`\\\\${a}`, 'g');

function unEscape(raw) {
    raw = raw
        .replace(/\\'/g, `'`)
        .replace(createEncodedRegExp(`"`), '"')
        .replace(/\\\^/g, '^');
    
    for (const emoji of match(raw)) {
        raw = raw.replace(createEncodedRegExp(emoji), emoji);
    }
    
    return raw;
}

function unescapeRegExp(raw) {
    return raw.replace(/\\:/g, ':');
}

function isEscapedRegExp(raw) {
    const includes = /\\:/.test(raw);
    const notIncludes = !/\\\\:/.test(raw);
    
    return includes && notIncludes;
}

