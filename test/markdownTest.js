import { escapeForSlackWithMarkdown } from '../src/index.ts';

describe('markdown', () => {
  describe('code multiline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('```this is a code multiline```').should.equal(
        '<div class="slack_code">this is a code multiline</div>',
      );
    });

    it('should convert newlines', () => {
      escapeForSlackWithMarkdown('```this is a code multiline\nwith newlines```').should.equal(
        '<div class="slack_code">this is a code multiline<br />with newlines</div>',
      );
    });

    it('should greedily capture backticks', () => {
      escapeForSlackWithMarkdown('````this is a code multiline with backticks````').should.equal(
        '<div class="slack_code">`this is a code multiline with backticks`</div>',
      );
    });

    it('should not capture whitespace', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` ```and this is another```').should.equal(
        '<div class="slack_code">this is a code multiline</div> <div class="slack_code">and this is another</div>',
      );
    });

    it('should not apply markdown to text within a code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline with *asterisks*```').should.equal(
        '<div class="slack_code">this is a code multiline with *asterisks*</div>',
      );
    });

    it('should not affect markdown after the code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` with some *bold* text after it').should.equal(
        '<div class="slack_code">this is a code multiline</div> with some <span class="slack_bold">bold</span> text after it',
      );
    });
  });

  describe('code inline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('`this is a code inline`').should.equal(
        '<span class="slack_code">this is a code inline</span>',
      );
    });

    it('should not greedily capture backticks', () => {
      escapeForSlackWithMarkdown('`this is code``this is not').should.equal(
        '<span class="slack_code">this is code</span>`this is not',
      );
    });
  });

  describe('bold', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is *bold*').should.equal('this is <span class="slack_bold">bold</span>');
    });

    context('with spaces in between asterisks', () => {
      it('should capture as much as possible', () => {
        escapeForSlackWithMarkdown('this is *bold * with * more * asterisks*').should.equal(
          'this is <span class="slack_bold">bold</span> with * more * asterisks*',
        );
      });
    });

    context('when next to another character', () => {
      it('should not replace the bold delimiters', () => {
        escapeForSlackWithMarkdown('a*this is not bold*').should.equal('a*this is not bold*');
      });
    });
  });

  describe('italic', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is _italic_').should.equal('this is <span class="slack_italics">italic</span>');
    });

    context('when next to another character', () => {
      it('should not replace the delimiters', () => {
        escapeForSlackWithMarkdown('this_is not italic_').should.equal('this_is not italic_');
      });

      it('should replace space padded delimiters', () => {
        escapeForSlackWithMarkdown('this _is_italic_').should.equal(
          'this <span class="slack_italics">is_italic</span>',
        );
      });
    });
  });

  describe('strikethrough', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is ~struck~').should.equal(
        'this is <span class="slack_strikethrough">struck</span>',
      );
    });

    context('with a closing whitespace', () => {
      it('should not render an element', () => {
        escapeForSlackWithMarkdown('this is ~not struck ~').should.equal('this is ~not struck ~');
      });
    });
  });

  describe('block quote', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote').should.equal(
        '<div class="slack_block">this is a block quote</div>',
      );
    });

    it('should replace newlines', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote\nwith newlines').should.equal(
        '<div class="slack_block">this is a block quote<br />with newlines</div>',
      );
    });
  });

  describe('inline quote', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is an \n&gt;inline quote').should.equal(
        'this is an \n<span class="slack_block">inline quote</span>',
      );
    });

    context('when not start anchored', () => {
      it('should not render an element', () => {
        escapeForSlackWithMarkdown('this is not &gt;an inline quote').should.equal('this is not &gt;an inline quote');
      });
    });
  });

  describe('mixed markdown', () => {
    context('bold and italic', () => {
      it('should replace both', () => {
        escapeForSlackWithMarkdown('*_bold and italic_*').should.equal(
          '<span class="slack_bold"><span class="slack_italics">bold and italic</span></span>',
        );
      });
    });

    context('italic and bold', () => {
      it('should replace both', () => {
        escapeForSlackWithMarkdown('_*italic and bold*_').should.equal(
          '<span class="slack_italics"><span class="slack_bold">italic and bold</span></span>'
        );
      });
    });

    context.skip('when delimiters are mismatched', () => {
      it('should respect precedence', () => {
        escapeForSlackWithMarkdown('*~this is bold*~').should.equal('<span class="slack_bold">~this is bold</span>~');
      });

      it('should not replace invalid delimiters', () => {
        escapeForSlackWithMarkdown('~*this is bold~*').should.equal('~*this is bold~*');
      });
    });
  });
});
