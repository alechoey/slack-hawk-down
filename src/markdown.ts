import XRegExp from 'xregexp';
import { IReplaceOptions, IReplacedText } from './types.ts';
import * as Patterns from './patterns.ts';

const incrementWindows = (windows: number[][], offset: number) => {
  return windows.map((tagWindow) => {
    const window = tagWindow;
    window[0] += offset;
    window[1] += offset;
    return window;
  });
};

const replaceInWindows = (
  text: string,
  delimiterLiteral: string,
  replacementOpeningLiteral: string,
  replacementClosingLiteral: string,
  closedTagWindows: number[][],
  options: IReplaceOptions = {},
  tagWindowIndex: number = 0,
  tagWindowOffset: number = 0,
): IReplacedText => {
  const { asymmetric, endingPattern, partitionWindowOnMatch, replaceNewlines, spacePadded } = options;
  let maxReplacements = options.maxReplacements || Infinity;

  const openingDelimiterRegExp = Patterns.buildOpeningDelimiterRegExp(delimiterLiteral, { spacePadded });
  const closingDelimiterRegExp =
    asymmetric && endingPattern
      ? Patterns.buildClosingDelimiterRegExp(endingPattern)
      : Patterns.buildClosingDelimiterRegExp(delimiterLiteral, { spacePadded });

  if (tagWindowIndex >= closedTagWindows.length || (maxReplacements && maxReplacements <= 0)) {
    return {
      text,
      closedTagWindows,
    };
  }

  const currentClosedTagWindow = closedTagWindows[tagWindowIndex];
  const tagWindowStartIndex = currentClosedTagWindow[0];
  const tagWindowEndIndex = currentClosedTagWindow[1];
  if (tagWindowStartIndex >= tagWindowEndIndex || tagWindowStartIndex + tagWindowOffset > tagWindowEndIndex) {
    return replaceInWindows(
      text,
      delimiterLiteral,
      replacementOpeningLiteral,
      replacementClosingLiteral,
      closedTagWindows,
      options,
      tagWindowIndex + 1,
    );
  }

  const openingMatch = XRegExp.exec(text, openingDelimiterRegExp, tagWindowStartIndex + tagWindowOffset);

  if (openingMatch && openingMatch.index < tagWindowEndIndex) {
    const closingDelimiterLength = asymmetric ? 0 : delimiterLiteral.length;
    // Allow matching the end of the string if on the last window
    const closingMatchMaxIndex =
      (tagWindowIndex === closedTagWindows.length - 1 && tagWindowEndIndex === text.length
        ? tagWindowEndIndex + 1
        : tagWindowEndIndex) -
      closingDelimiterLength +
      1;

    // Look ahead at the next index to greedily capture as much inside the delimiters as possible
    let closingMatch = XRegExp.exec(text, closingDelimiterRegExp, openingMatch.index + delimiterLiteral.length);
    let nextClosingMatch = closingMatch && XRegExp.exec(text, closingDelimiterRegExp, closingMatch.index + 1);
    while (nextClosingMatch) {
      // If the next match is still in the window and there is not whitespace in between the two, use the later one
      const nextWhitespace = XRegExp.exec(
        text,
        Patterns.whitespaceRegExp,
        closingMatch.index + delimiterLiteral.length,
      );
      const crossedWhitespace = nextWhitespace && nextWhitespace.index < closingMatchMaxIndex;
      if (nextClosingMatch.index >= closingMatchMaxIndex || crossedWhitespace) {
        break;
      }
      closingMatch = nextClosingMatch;
      nextClosingMatch = XRegExp.exec(text, closingDelimiterRegExp, closingMatch.index + 1);
    }

    if (closingMatch && closingMatch.index < closingMatchMaxIndex) {
      const afterDelimitersIndex = closingMatch.index + closingMatch[0].length;
      const textBeforeDelimiter = text.slice(0, openingMatch.index);
      const textAfterDelimiter = text.slice(afterDelimitersIndex);

      const openingReplacementString = `${
        spacePadded ? openingMatch.openingCapturedWhitespace : ''
      }${replacementOpeningLiteral}`;
      const closingReplacementString = `${replacementClosingLiteral}${
        spacePadded ? closingMatch.closingCapturedWhitespace : ''
      }${asymmetric ? closingMatch[0] : ''}`;

      const textBetweenDelimiters = text.slice(openingMatch.index + openingMatch[0].length, closingMatch.index);
      const replacedTextBetweenDelimiters = replaceNewlines
        ? XRegExp.replace(textBetweenDelimiters, Patterns.newlineRegExp, Patterns.lineBreakTagLiteral)
        : textBetweenDelimiters;

      const replacedDelimiterText = [
        openingReplacementString,
        replacedTextBetweenDelimiters,
        closingReplacementString,
      ].join('');

      const delimiterReplacementLength = delimiterLiteral.length + closingDelimiterLength;
      const windowOffset =
        replacementOpeningLiteral.length +
        replacementClosingLiteral.length -
        delimiterReplacementLength +
        replacedTextBetweenDelimiters.length -
        textBetweenDelimiters.length;
      const newUpperWindowLimit = tagWindowEndIndex + windowOffset;

      const nextWindowIndex = partitionWindowOnMatch ? tagWindowIndex + 1 : tagWindowIndex;
      const nextTagWindowOffset = partitionWindowOnMatch
        ? 0
        : afterDelimitersIndex + windowOffset - tagWindowStartIndex + 1;
      if (partitionWindowOnMatch) {
        // Split the current window into two by the occurrence of the delimiter pair
        currentClosedTagWindow[1] = openingMatch.index;
        closedTagWindows.splice(nextWindowIndex, 0, [
          closingMatch.index + closingDelimiterLength + windowOffset,
          newUpperWindowLimit,
        ]);
      } else {
        currentClosedTagWindow[1] = newUpperWindowLimit;
      }
      const incrementedWindows = incrementWindows(closedTagWindows.slice(nextWindowIndex + 1), windowOffset);
      maxReplacements -= 1;

      return replaceInWindows(
        [textBeforeDelimiter, replacedDelimiterText, textAfterDelimiter].join(''),
        delimiterLiteral,
        replacementOpeningLiteral,
        replacementClosingLiteral,
        incrementedWindows,
        { ...options, maxReplacements },
        nextWindowIndex,
        nextTagWindowOffset,
      );
    }
  }

  return replaceInWindows(
    text,
    delimiterLiteral,
    replacementOpeningLiteral,
    replacementClosingLiteral,
    closedTagWindows,
    options,
    tagWindowIndex + 1,
  );
};

const replaceBlockCode = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '```',
    Patterns.codeDivOpeningPatternString,
    Patterns.closingDivPatternString,
    closedTagWindows,
    { partitionWindowOnMatch: true, replaceNewlines: true },
  );

const replaceCode = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '`',
    Patterns.codeSpanOpeningPatternString,
    Patterns.closingSpanPatternString,
    closedTagWindows,
    { partitionWindowOnMatch: true },
  );

const replaceBold = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    XRegExp.escape('*'),
    Patterns.boldOpeningPatternString,
    Patterns.closingSpanPatternString,
    closedTagWindows,
    { maxReplacements: 100 },
  );

const replaceStrikethrough = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '~',
    Patterns.strikethroughOpeningPatternString,
    Patterns.closingSpanPatternString,
    closedTagWindows,
    { maxReplacements: 100 },
  );

const replaceItalic = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '_',
    Patterns.italicOpeningPatternString,
    Patterns.closingSpanPatternString,
    closedTagWindows,
    { spacePadded: true, maxReplacements: 100 },
  );

const replaceBlockQuote = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '&gt;&gt;&gt;',
    Patterns.blockDivOpeningPatternString,
    Patterns.closingDivPatternString,
    closedTagWindows,
    {
      asymmetric: true,
      endingPattern: '$',
      replaceNewlines: true,
      maxReplacements: 100,
    },
  );

const replaceQuote = ({ text, closedTagWindows }: IReplacedText) =>
  replaceInWindows(
    text,
    '&gt;',
    Patterns.blockSpanOpeningPatternString,
    Patterns.closingSpanPatternString,
    closedTagWindows,
    { asymmetric: true, endingPattern: '\\n|$', maxReplacements: 100 },
  );

const replaceSlackdown = (text: string) => {
  return [
    replaceBlockCode,
    replaceCode,
    replaceBold,
    replaceStrikethrough,
    replaceItalic,
    replaceBlockQuote,
    replaceQuote,
  ].reduce((acc, func) => func(acc), { text, closedTagWindows: [[0, text.length]] }).text;
};

export default replaceSlackdown;
