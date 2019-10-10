import XRegExp from 'xregexp';

import * as Patterns from './patterns';
import { IReplaceOptions, IReplacedText } from './types';

class ReplacementWindow {
  start: number;

  end: number;

  replacementDisabled: boolean;

  constructor(start: number, end: number) {
    this.start = start;
    this.end = end;
    this.replacementDisabled = false;
  }

  increment(offset: number) {
    this.start += offset;
    this.end += offset;
  }

  disable() {
    this.replacementDisabled = true;
  }

  static incrementAt(windows: ReplacementWindow[], index: number, offset: number) {
    windows.slice(index).forEach((window) => {
      window.increment(offset);
    });
  }
}

const findMatch = (text: string, regexp: any, startIndex: number) => {
  return XRegExp.exec(text, regexp, startIndex);
};

const replaceInWindows = (
  text: string,
  delimiterLiteral: string,
  openingDelimiterRegExp: any,
  closingDelimiterRegExp: any,
  replacementOpeningLiteral: string,
  replacementClosingLiteral: string,
  windows: ReplacementWindow[],
  options: IReplaceOptions = {},
  windowIndex: number = 0,
  windowOffset: number = 0,
): IReplacedText => {
  const { asymmetric, disableNestedReplacement, replaceNewlines, noAlphaNumericPadded } = options;
  let maxReplacements = options.maxReplacements === undefined ? Infinity : options.maxReplacements;

  if (windowIndex >= windows.length || (maxReplacements && maxReplacements <= 0)) {
    return {
      text,
      windows,
      maxReplacements,
    };
  }

  const currentWindow = windows[windowIndex];
  const openingMatch = findMatch(text, openingDelimiterRegExp, currentWindow.start + windowOffset);

  if (!currentWindow.replacementDisabled && openingMatch && openingMatch.index <= currentWindow.end) {
    const closingDelimiterLength = asymmetric ? 0 : delimiterLiteral.length;
    const closingMatch = findMatch(text, closingDelimiterRegExp, openingMatch.index + openingMatch[0].length);

    if (closingMatch && closingMatch.index + closingDelimiterLength - 1 <= currentWindow.end) {
      const afterDelimitersIndex = closingMatch.index + closingMatch[0].length;
      const textBeforeDelimiter = text.slice(0, openingMatch.index);
      const textAfterDelimiter = text.slice(afterDelimitersIndex);

      const openingReplacementString = `${replacementOpeningLiteral}${(!noAlphaNumericPadded &&
        openingMatch.openingCapturedWhitespace) ||
        ''}`;
      const closingReplacementString = `${(!noAlphaNumericPadded && closingMatch.closingCapturedWhitespace) || ''}${
        asymmetric ? closingMatch[0] : ''
      }${replacementClosingLiteral}`;

      const textBetweenDelimiters = text.slice(openingMatch.index + openingMatch[0].length, closingMatch.index);
      const replacedTextBetweenDelimiters = replaceNewlines
        ? XRegExp.replace(textBetweenDelimiters, Patterns.newlinePattern, Patterns.lineBreakTagLiteral)
        : textBetweenDelimiters;

      const replacedDelimiterText = [
        openingReplacementString,
        replacedTextBetweenDelimiters,
        closingReplacementString,
      ].join('');

      const windowOffsetIncrement =
        replacementOpeningLiteral.length -
        delimiterLiteral.length +
        replacedTextBetweenDelimiters.length -
        textBetweenDelimiters.length +
        replacementClosingLiteral.length -
        closingDelimiterLength;

      const replacedText = [textBeforeDelimiter, replacedDelimiterText, textAfterDelimiter].join('');
      ReplacementWindow.incrementAt(windows, windowIndex + 1, windowOffsetIncrement);
      maxReplacements -= 1;

      if (disableNestedReplacement) {
        // Split the current window into two at the occurrence of the delimiter pair
        windows.splice(
          windowIndex + 1,
          0,
          new ReplacementWindow(
            closingMatch.index + closingDelimiterLength + windowOffsetIncrement,
            currentWindow.end + windowOffsetIncrement,
          ),
        );
        currentWindow.end = openingMatch.index + replacedDelimiterText.length - 1;
        if (disableNestedReplacement) {
          currentWindow.disable();
        }

        return replaceInWindows(
          replacedText,
          delimiterLiteral,
          openingDelimiterRegExp,
          closingDelimiterRegExp,
          replacementOpeningLiteral,
          replacementClosingLiteral,
          windows,
          { ...options, maxReplacements },
          windowIndex + 1,
        );
      }

      currentWindow.end += windowOffsetIncrement;
      return replaceInWindows(
        replacedText,
        delimiterLiteral,
        openingDelimiterRegExp,
        closingDelimiterRegExp,
        replacementOpeningLiteral,
        replacementClosingLiteral,
        windows,
        { ...options, maxReplacements },
        windowIndex,
        windowOffsetIncrement + windowOffsetIncrement,
      );
    }
  }

  return replaceInWindows(
    text,
    delimiterLiteral,
    openingDelimiterRegExp,
    closingDelimiterRegExp,
    replacementOpeningLiteral,
    replacementClosingLiteral,
    windows,
    options,
    windowIndex + 1,
  );
};

const replaceBlockCode = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.blockCodeDelimiter,
    Patterns.blockCodeOpeningPattern,
    Patterns.blockCodeClosingPattern,
    Patterns.codeDivOpeningPatternString,
    Patterns.closingDivPatternString,
    windows,
    {
      disableNestedReplacement: true,
      maxReplacements,
      noQuotePad: true,
      replaceNewlines: true,
    },
  );

const replaceCode = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.inlineCodeDelimiter,
    Patterns.inlineCodeOpeningPattern,
    Patterns.inlineCodeClosingPattern,
    Patterns.codeSpanOpeningPatternString,
    Patterns.closingSpanPatternString,
    windows,
    {
      disableNestedReplacement: true,
      noQuotePad: true,
      maxReplacements,
    },
  );

const replaceBold = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.boldDelimiter,
    Patterns.boldOpeningPattern,
    Patterns.boldClosingPattern,
    Patterns.boldOpeningPatternString,
    Patterns.closingSpanPatternString,
    windows,
    {
      maxReplacements,
      noAlphaNumericPadded: true,
    },
  );

const replaceStrikethrough = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.strikethroughDelimiter,
    Patterns.strikethroughOpeningPattern,
    Patterns.strikethroughClosingPattern,
    Patterns.strikethroughOpeningPatternString,
    Patterns.closingSpanPatternString,
    windows,
    {
      maxReplacements,
      noAlphaNumericPadded: true,
    },
  );

const replaceItalic = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.italicDelimiter,
    Patterns.italicOpeningPattern,
    Patterns.italicClosingPattern,
    Patterns.italicOpeningPatternString,
    Patterns.closingSpanPatternString,
    windows,
    {
      maxReplacements,
      noAlphaNumericPadded: true,
    },
  );

const replaceBlockQuote = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.blockQuoteDelimiter,
    Patterns.blockQuoteOpeningPattern,
    Patterns.blockQuoteClosingPattern,
    Patterns.blockDivOpeningPatternString,
    Patterns.closingDivPatternString,
    windows,
    {
      asymmetric: true,
      replaceNewlines: true,
      maxReplacements,
    },
  );

const replaceQuote = ({ text, maxReplacements, windows }: IReplacedText) =>
  replaceInWindows(
    text,
    Patterns.inlineQuoteDelimiter,
    Patterns.inlineQuoteOpeningPattern,
    Patterns.inlineQuoteClosingPattern,
    Patterns.blockSpanOpeningPatternString,
    Patterns.closingSpanPatternString,
    windows,
    {
      asymmetric: true,
      maxReplacements,
    },
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
  ].reduce((acc, func) => func(acc), {
    text,
    maxReplacements: 100,
    windows: [new ReplacementWindow(0, text.length - 1)],
  }).text;
};

export default replaceSlackdown;
