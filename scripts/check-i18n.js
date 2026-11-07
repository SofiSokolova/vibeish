#!/usr/bin/env node

/**
 * Checks that every locale in src/i18n/locales has exactly the same keys as en.json
 * (the source language), that no translation is empty, and that each translation uses
 * the same {{placeholders}} as the English text.
 *
 * Run: npm run i18n:check
 */

const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const SOURCE = 'en.json';

function flatten(object, prefix = '') {
  return Object.entries(object).flatMap(([key, value]) =>
    value !== null && typeof value === 'object'
      ? flatten(value, `${prefix}${key}.`)
      : [[`${prefix}${key}`, String(value)]]
  );
}

function load(file) {
  const json = JSON.parse(fs.readFileSync(path.join(localesDir, file), 'utf8'));
  return new Map(flatten(json));
}

function placeholders(text) {
  return [...text.matchAll(/{{\s*(\w+)\s*}}/g)]
    .map((match) => match[1])
    .sort()
    .join(', ');
}

const source = load(SOURCE);
const problems = [];
const locales = fs.readdirSync(localesDir).filter((name) => name.endsWith('.json') && name !== SOURCE);

for (const file of locales) {
  const locale = load(file);

  for (const [key, text] of source) {
    const translation = locale.get(key);
    if (translation === undefined) {
      problems.push(`${file}: missing "${key}"`);
    } else if (translation.trim() === '') {
      problems.push(`${file}: empty "${key}"`);
    } else if (placeholders(translation) !== placeholders(text)) {
      problems.push(
        `${file}: "${key}" must use the same placeholders as ${SOURCE} (${placeholders(text) || 'none'})`
      );
    }
  }

  for (const key of locale.keys()) {
    if (!source.has(key)) problems.push(`${file}: "${key}" is not in ${SOURCE}`);
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'));
  process.exit(1);
}

console.log(`All ${locales.length} locales match ${SOURCE} (${source.size} keys).`);
