/* eslint-disable */
const rawEmoji = require('emoji-datasource/emoji_pretty.json');
const fs = require('fs');

const EMOJI_PATHS = ['dist/emoji.js', 'src/emoji.js'];

process.stdout.write('Processing raw emoji list...');
const condensedEmoji = rawEmoji.reduce(function(accumulator, emoji) {
  accumulator[emoji.short_name] = emoji.unified;
  return accumulator;
}, {});

try {
  fs.mkdirSync('dist/');
} catch (_err) {
  console.log('dist/ directory already exists; skipping');
}

EMOJI_PATHS.forEach((path) => {
  fs.writeFileSync(path, `module.exports = ${JSON.stringify(condensedEmoji)}`, 'utf8');
});
console.log('Complete!');
/* eslint-enable */
