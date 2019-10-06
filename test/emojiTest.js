import { escapeForSlack } from '../src/index.ts';

const customEmoji = {};
const users = {};

describe('emoji', () => {
  describe('static emoji', () => {
    it('should render replace an emoji', () => {
      escapeForSlack(':wave:').should.equal('&#x1F44B');
    });
  });

  describe('custom emoji', () => {
    it('should render an img tag', () => {
      escapeForSlack(':swiftype:', { customEmoji: { swiftype: 'https://swiftype.com/favicon.ico' } }).should.equal(
        '<img alt="swiftype" src="https://swiftype.com/favicon.ico" class="slack_emoji" />',
      );
    });

    it('should should be able to alias to a static emoji', () => {
      escapeForSlack(':goodbye:', { customEmoji: { goodbye: 'alias:wave' } }).should.equal('&#x1F44B');
    });

    it('should replace multiple emojis', () => {
      escapeForSlack(':swiftype::swiftype:', {
        customEmoji: { swiftype: 'https://swiftype.com/favicon.ico' },
      }).should.equal(
        '<img alt="swiftype" src="https://swiftype.com/favicon.ico" class="slack_emoji" /><img alt="swiftype" src="https://swiftype.com/favicon.ico" class="slack_emoji" />',
      );
    });
  });
});
