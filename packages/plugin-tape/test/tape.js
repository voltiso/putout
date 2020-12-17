'use strict';

const test = require('@putout/test')(__dirname, {
    tape: require('..'),
});

test('plugin-test: report', (t) => {
    t.report('equal', '"result" should be before "expected"');
    t.end();
});

test('plugin-test: transform', (t) => {
    t.transform('equal');
    t.end();
});

test('plugin-test: transform: tape', (t) => {
    t.transform('tape');
    t.end();
});

test('plugin-test: transform: tape: throws', (t) => {
    t.transform('throws');
    t.end();
});

