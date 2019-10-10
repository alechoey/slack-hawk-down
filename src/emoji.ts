import XRegExp from 'xregexp';

import { emojiAliasPattern, emojiPattern } from './patterns';
import emoji from './staticEmoji';
import { EmojiMap } from './types';

export const replaceEmoji = (text: string, customEmoji: EmojiMap) => {
  const allEmoji: EmojiMap = { ...emoji, ...customEmoji };
  return XRegExp.replace(text, emojiPattern, ({ key }: { key: string }) => {
    let emojiKey = key;
    let emojiValue;

    for (;;) {
      emojiValue = allEmoji[emojiKey];
      if (!emojiValue || !XRegExp.match(emojiValue, emojiAliasPattern)) {
        break;
      }
      emojiKey = XRegExp.replace(emojiValue, emojiAliasPattern, (match: any) => match.aliasName);
    }

    if (key && emojiValue) {
      if (emojiValue.match(/https?:\/\/\S+/)) {
        return `<img alt="${key}" src="${emojiValue}" class="slack_emoji" />`;
      }
      return emojiValue
        .split('-')
        .map((emojiCode: string) => `&#x${emojiCode}`)
        .join('');
    }
    return key;
  });
};

export default replaceEmoji;
