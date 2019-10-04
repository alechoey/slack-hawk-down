import { escapeForSlackWithMarkdown } from '../src/index.ts'

describe('markdown', () => {
  describe('code multiline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('```this is a code multiline```').should.equal('<div class="slack_code">this is a code multiline</div>')
    })

    it('should convert newlines', () => {
      escapeForSlackWithMarkdown('```this is a code multiline\nwith newlines```').should.equal('<div class="slack_code">this is a code multiline<br>with newlines</div>')
    })

    it('should greedily capture backticks', () => {
      escapeForSlackWithMarkdown('````this is a code multiline with backticks````').should.equal('<div class="slack_code">`this is a code multiline with backticks`</div>')
    })

    it('should not capture whitespace', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` ```and this is another```').should.equal('<div class="slack_code">this is a code multiline</div> <div class="slack_code">and this is another</div>')
    })

    it('should not apply markdown to text within a code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline with *asterisks*```').should.equal('<div class="slack_code">this is a code multiline with *asterisks*</div>')
    })

    it('should not affect markdown after the code block', () => {
      escapeForSlackWithMarkdown('```this is a code multiline``` with some *bold* text after it').should.equal('<div class="slack_code">this is a code multiline</div> with some <span class="slack_bold">bold</span> text after it')
    })
  })

  describe('code inline', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('`this is a code inline`').should.equal('<span class="slack_code">this is a code inline</span>')
    })
  })

  describe('bold', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is *bold*').should.equal('this is <span class="slack_bold">bold</span>')
    })

    it('should capture as much as possible', () => {
      escapeForSlackWithMarkdown('this is *bold*with*more*asterisks*').should.equal('this is <span class="slack_bold">bold*with*more*asterisks</span>')
    })
  })

  describe('italic', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is _italic_').should.equal('this is <span class="slack_italics">italic</span>')
    })
  })

  describe('strikethrough', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is ~struck~').should.equal('this is <span class="slack_strikethrough">struck</span>')
    })
  })

  describe('block quote', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote').should.equal('<div class="slack_block">this is a block quote</div>')
    })

    it('should replace newlines', () => {
      escapeForSlackWithMarkdown('&gt;&gt;&gt;this is a block quote\nwith newlines').should.equal('<div class="slack_block">this is a block quote<br>with newlines</div>')
    })
  })

  describe('inline quote', () => {
    it('should render an element', () => {
      escapeForSlackWithMarkdown('this is an &gt;inline quote').should.equal('this is an <span class="slack_block">inline quote</span>')
    })
  })
})
