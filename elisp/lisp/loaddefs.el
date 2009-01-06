
;;;### (autoloads (abtags-find-include abtags-find-next-file abtags-find-file)
;;;;;;  "abtags" "../abtags.el" (17689 36299))
;;; Generated autoloads from ../abtags.el

(autoload (quote abtags-find-file) "abtags" "\
Prompts the user to select a filename from among those in the tags file.
   Visits the selected file.

\(fn)" t nil)

(autoload (quote abtags-find-next-file) "abtags" "\
Prompts the user to select a filename from among those in the tags file.
   Visits the selected file.

\(fn)" t nil)

(autoload (quote abtags-find-include) "abtags" "\
Follow a #include statement.

\(fn)" t nil)

;;;***

;;;### (autoloads (apache-mode) "apache-mode" "../emacslib/apache-mode.el"
;;;;;;  (17308 52541))
;;; Generated autoloads from ../emacslib/apache-mode.el

(autoload (quote apache-mode) "apache-mode" "\
Major mode for editing Apache configuration files.

\(fn)" t nil)
(add-to-list 'auto-mode-alist '("\\.htaccess\\'"   . apache-mode))
(add-to-list 'auto-mode-alist '("httpd\\.conf\\'"  . apache-mode))
(add-to-list 'auto-mode-alist '("srm\\.conf\\'"    . apache-mode))
(add-to-list 'auto-mode-alist '("access\\.conf\\'" . apache-mode))
(add-to-list 'auto-mode-alist '("sites-\\(available\\|enabled\\)/" . apache-mode))

;;;***

;;;### (autoloads (ascii-off ascii-on ascii-display ascii-customize)
;;;;;;  "ascii" "../emacslib/ascii.el" (16943 57462))
;;; Generated autoloads from ../emacslib/ascii.el

(autoload (quote ascii-customize) "ascii" "\
Customize ASCII options.

\(fn)" t nil)

(autoload (quote ascii-display) "ascii" "\
Toggle ASCII code display.

If ARG is null, toggle ASCII code display.
If ARG is a number and is greater than zero, turn on display; otherwise, turn
off display.
If ARG is anything else, turn on display.

\(fn &optional ARG)" t nil)

(autoload (quote ascii-on) "ascii" "\
Turn on ASCII code display.

\(fn)" t nil)

(autoload (quote ascii-off) "ascii" "\
Turn off ASCII code display.

\(fn)" t nil)

;;;***

;;;### (autoloads (c-guess-basic-syntax) "cc-engine" "../emacslib/cc-mode-5.31.3/cc-engine.el"
;;;;;;  (17399 39638))
;;; Generated autoloads from ../emacslib/cc-mode-5.31.3/cc-engine.el

(autoload (quote c-guess-basic-syntax) "cc-engine" "\
Return the syntactic context of the current line.

\(fn)" nil nil)

;;;***

;;;### (autoloads (pike-mode idl-mode java-mode objc-mode c++-mode
;;;;;;  c-mode c-initialize-cc-mode) "cc-mode" "../emacslib/cc-mode-5.31.3/cc-mode.el"
;;;;;;  (17399 39639))
;;; Generated autoloads from ../emacslib/cc-mode-5.31.3/cc-mode.el

(autoload (quote c-initialize-cc-mode) "cc-mode" "\
Initialize CC Mode for use in the current buffer.
If the optional NEW-STYLE-INIT is nil or left out then all necessary
initialization to run CC Mode for the C language is done.  Otherwise
only some basic setup is done, and a call to `c-init-language-vars' or
`c-init-language-vars-for' is necessary too (which gives more
control).  See \"cc-mode.el\" for more info.

\(fn &optional NEW-STYLE-INIT)" nil nil)

(defvar c-mode-syntax-table nil "\
Syntax table used in c-mode buffers.")
 (add-to-list 'auto-mode-alist '("\\.\\(cc\\|hh\\)\\'" . c++-mode))
 (add-to-list 'auto-mode-alist '("\\.[ch]\\(pp\\|xx\\|\\+\\+\\)\\'" . c++-mode))
 (add-to-list 'auto-mode-alist '("\\.\\(CC?\\|HH?\\)\\'" . c++-mode))
 (add-to-list 'auto-mode-alist '("\\.[ch]\\'" . c-mode))
 (add-to-list 'auto-mode-alist '("\\.y\\(acc\\)?\\'" . c-mode))
 (add-to-list 'auto-mode-alist '("\\.lex\\'" . c-mode))

(autoload (quote c-mode) "cc-mode" "\
Major mode for editing K&R and ANSI C code.
To submit a problem report, enter `\\[c-submit-bug-report]' from a
c-mode buffer.  This automatically sets up a mail buffer with version
information already added.  You just need to add a description of the
problem, including a reproducible test case, and send the message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `c-mode-hook'.

Key bindings:
\\{c-mode-map}

\(fn)" t nil)

(defvar c++-mode-syntax-table nil "\
Syntax table used in c++-mode buffers.")

(autoload (quote c++-mode) "cc-mode" "\
Major mode for editing C++ code.
To submit a problem report, enter `\\[c-submit-bug-report]' from a
c++-mode buffer.  This automatically sets up a mail buffer with
version information already added.  You just need to add a description
of the problem, including a reproducible test case, and send the
message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `c++-mode-hook'.

Key bindings:
\\{c++-mode-map}

\(fn)" t nil)

(defvar objc-mode-syntax-table nil "\
Syntax table used in objc-mode buffers.")
 (add-to-list 'auto-mode-alist '("\\.m\\'" . objc-mode))

(autoload (quote objc-mode) "cc-mode" "\
Major mode for editing Objective C code.
To submit a problem report, enter `\\[c-submit-bug-report]' from an
objc-mode buffer.  This automatically sets up a mail buffer with
version information already added.  You just need to add a description
of the problem, including a reproducible test case, and send the
message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `objc-mode-hook'.

Key bindings:
\\{objc-mode-map}

\(fn)" t nil)

(defvar java-mode-syntax-table nil "\
Syntax table used in java-mode buffers.")
 (add-to-list 'auto-mode-alist '("\\.java\\'" . java-mode))

(autoload (quote java-mode) "cc-mode" "\
Major mode for editing Java code.
To submit a problem report, enter `\\[c-submit-bug-report]' from a
java-mode buffer.  This automatically sets up a mail buffer with
version information already added.  You just need to add a description
of the problem, including a reproducible test case, and send the
message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `java-mode-hook'.

Key bindings:
\\{java-mode-map}

\(fn)" t nil)

(defvar idl-mode-syntax-table nil "\
Syntax table used in idl-mode buffers.")
 (add-to-list 'auto-mode-alist '("\\.idl\\'" . idl-mode))

(autoload (quote idl-mode) "cc-mode" "\
Major mode for editing CORBA's IDL, PSDL and CIDL code.
To submit a problem report, enter `\\[c-submit-bug-report]' from an
idl-mode buffer.  This automatically sets up a mail buffer with
version information already added.  You just need to add a description
of the problem, including a reproducible test case, and send the
message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `idl-mode-hook'.

Key bindings:
\\{idl-mode-map}

\(fn)" t nil)

(defvar pike-mode-syntax-table nil "\
Syntax table used in pike-mode buffers.")
 (add-to-list 'auto-mode-alist '("\\.\\(u?lpc\\|pike\\|pmod\\(.in\\)?\\)\\'" . pike-mode))
 (add-to-list 'interpreter-mode-alist '("pike" . pike-mode))

(autoload (quote pike-mode) "cc-mode" "\
Major mode for editing Pike code.
To submit a problem report, enter `\\[c-submit-bug-report]' from a
pike-mode buffer.  This automatically sets up a mail buffer with
version information already added.  You just need to add a description
of the problem, including a reproducible test case, and send the
message.

To see what version of CC Mode you are running, enter `\\[c-version]'.

The hook `c-mode-common-hook' is run with no args at mode
initialization, then `pike-mode-hook'.

Key bindings:
\\{pike-mode-map}

\(fn)" t nil)
 (add-to-list 'auto-mode-alist '("\\.awk\\'" . awk-mode))
 (add-to-list 'interpreter-mode-alist '("awk" . awk-mode))
 (add-to-list 'interpreter-mode-alist '("mawk" . awk-mode))
 (add-to-list 'interpreter-mode-alist '("nawk" . awk-mode))
 (add-to-list 'interpreter-mode-alist '("gawk" . awk-mode))
 (autoload 'awk-mode "cc-mode" "Major mode for editing AWK code." t)

;;;***

;;;### (autoloads (c-set-offset c-add-style c-set-style) "cc-styles"
;;;;;;  "../emacslib/cc-mode-5.31.3/cc-styles.el" (17399 39639))
;;; Generated autoloads from ../emacslib/cc-mode-5.31.3/cc-styles.el

(autoload (quote c-set-style) "cc-styles" "\
Set the current buffer to use the style STYLENAME.
STYLENAME, a string, must be an existing CC Mode style - These are contained
in the variable `c-style-alist'.

The variable `c-indentation-style' will get set to STYLENAME.

\"Setting the style\" is done by setting CC Mode's \"style variables\" to the
values indicated by the pertinent entry in `c-style-alist'.  Other variables
might get set too.

If DONT-OVERRIDE is neither nil nor t, style variables whose default values
have been set (more precisely, whose default values are not the symbol
`set-from-style') will not be changed.  This avoids overriding global settings
done in ~/.emacs.  It is useful to call c-set-style from a mode hook in this
way.

If DONT-OVERRIDE is t, style variables that already have values (i.e., whose
values are not the symbol `set-from-style') will not be overridden.  CC Mode
calls c-set-style internally in this way whilst initializing a buffer; if
cc-set-style is called like this from anywhere else, it will usually behave as
a null operation.

\(fn STYLENAME &optional DONT-OVERRIDE)" t nil)

(autoload (quote c-add-style) "cc-styles" "\
Adds a style to `c-style-alist', or updates an existing one.
STYLE is a string identifying the style to add or update.  DESCRIPTION
is an association list describing the style and must be of the form:

  ([BASESTYLE] (VARIABLE . VALUE) [(VARIABLE . VALUE) ...])

See the variable `c-style-alist' for the semantics of BASESTYLE,
VARIABLE and VALUE.  This function also sets the current style to
STYLE using `c-set-style' if the optional SET-P flag is non-nil.

\(fn STYLE DESCRIPTION &optional SET-P)" t nil)

(autoload (quote c-set-offset) "cc-styles" "\
Change the value of a syntactic element symbol in `c-offsets-alist'.
SYMBOL is the syntactic element symbol to change and OFFSET is the new
offset for that syntactic element.  The optional argument is not used
and exists only for compatibility reasons.

\(fn SYMBOL OFFSET &optional IGNORED)" t nil)

;;;***

;;;### (autoloads nil "cc-subword" "../emacslib/cc-mode-5.31.3/cc-subword.el"
;;;;;;  (17399 39639))
;;; Generated autoloads from ../emacslib/cc-mode-5.31.3/cc-subword.el
 (autoload 'c-subword-mode "cc-subword" "Mode enabling subword movement and editing keys." t)

;;;***

;;;### (autoloads (cperl-mode) "cperl-mode" "../emacslib/cperl-mode.el"
;;;;;;  (17842 29090))
;;; Generated autoloads from ../emacslib/cperl-mode.el

(autoload (quote cperl-mode) "cperl-mode" "\
Major mode for editing Perl code.
Expression and list commands understand all C brackets.
Tab indents for Perl code.
Paragraphs are separated by blank lines only.
Delete converts tabs to spaces as it moves back.

Various characters in Perl almost always come in pairs: {}, (), [],
sometimes <>.  When the user types the first, she gets the second as
well, with optional special formatting done on {}.  (Disabled by
default.)  You can always quote (with \\[quoted-insert]) the left
\"paren\" to avoid the expansion.  The processing of < is special,
since most the time you mean \"less\".  Cperl mode tries to guess
whether you want to type pair <>, and inserts is if it
appropriate.  You can set `cperl-electric-parens-string' to the string that
contains the parenths from the above list you want to be electrical.
Electricity of parenths is controlled by `cperl-electric-parens'.
You may also set `cperl-electric-parens-mark' to have electric parens
look for active mark and \"embrace\" a region if possible.'

CPerl mode provides expansion of the Perl control constructs:

   if, else, elsif, unless, while, until, continue, do, 
   for, foreach, formy and foreachmy.

and POD directives (Disabled by default, see `cperl-electric-keywords'.)

The user types the keyword immediately followed by a space, which
causes the construct to be expanded, and the point is positioned where
she is most likely to want to be.  eg. when the user types a space
following \"if\" the following appears in the buffer: if () { or if ()
} { } and the cursor is between the parentheses.  The user can then
type some boolean expression within the parens.  Having done that,
typing \\[cperl-linefeed] places you - appropriately indented - on a
new line between the braces (if you typed \\[cperl-linefeed] in a POD
directive line, then appropriate number of new lines is inserted).  

If CPerl decides that you want to insert \"English\" style construct like

            bite if angry;

it will not do any expansion.  See also help on variable
`cperl-extra-newline-before-brace'.  (Note that one can switch the
help message on expansion by setting `cperl-message-electric-keyword'
to nil.)

\\[cperl-linefeed] is a convenience replacement for typing carriage
return.  It places you in the next line with proper indentation, or if
you type it inside the inline block of control construct, like

            foreach (@lines) {print; print}

and you are on a boundary of a statement inside braces, it will
transform the construct into a multiline and will place you into an
appropriately indented blank line.  If you need a usual 
`newline-and-indent' behaviour, it is on \\[newline-and-indent], 
see documentation on `cperl-electric-linefeed'.

Use \\[cperl-invert-if-unless] to change a construction of the form

	    if (A) { B }

into

            B if A;

\\{cperl-mode-map}

Setting the variable `cperl-font-lock' to t switches on font-lock-mode
\(even with older Emacsen), `cperl-electric-lbrace-space' to t switches
on electric space between $ and {, `cperl-electric-parens-string' is
the string that contains parentheses that should be electric in CPerl
\(see also `cperl-electric-parens-mark' and `cperl-electric-parens'),
setting `cperl-electric-keywords' enables electric expansion of
control structures in CPerl.  `cperl-electric-linefeed' governs which
one of two linefeed behavior is preferable.  You can enable all these
options simultaneously (recommended mode of use) by setting
`cperl-hairy' to t.  In this case you can switch separate options off
by setting them to `null'.  Note that one may undo the extra
whitespace inserted by semis and braces in `auto-newline'-mode by
consequent \\[cperl-electric-backspace].

If your site has perl5 documentation in info format, you can use commands
\\[cperl-info-on-current-command] and \\[cperl-info-on-command] to access it.
These keys run commands `cperl-info-on-current-command' and
`cperl-info-on-command', which one is which is controlled by variable
`cperl-info-on-command-no-prompt' and `cperl-clobber-lisp-bindings' 
\(in turn affected by `cperl-hairy').

Even if you have no info-format documentation, short one-liner-style
help is available on \\[cperl-get-help], and one can run perldoc or
man via menu.

It is possible to show this help automatically after some idle time.
This is regulated by variable `cperl-lazy-help-time'.  Default with
`cperl-hairy' (if the value of `cperl-lazy-help-time' is nil) is 5
secs idle time .  It is also possible to switch this on/off from the
menu, or via \\[cperl-toggle-autohelp].  Requires `run-with-idle-timer'.

Use \\[cperl-lineup] to vertically lineup some construction - put the
beginning of the region at the start of construction, and make region
span the needed amount of lines.

Variables `cperl-pod-here-scan', `cperl-pod-here-fontify',
`cperl-pod-face', `cperl-pod-head-face' control processing of pod and
here-docs sections.  With capable Emaxen results of scan are used
for indentation too, otherwise they are used for highlighting only.

Variables controlling indentation style:
 `cperl-tab-always-indent'
    Non-nil means TAB in CPerl mode should always reindent the current line,
    regardless of where in the line point is when the TAB command is used.
 `cperl-indent-left-aligned-comments'
    Non-nil means that the comment starting in leftmost column should indent.
 `cperl-auto-newline'
    Non-nil means automatically newline before and after braces,
    and after colons and semicolons, inserted in Perl code.  The following
    \\[cperl-electric-backspace] will remove the inserted whitespace.
    Insertion after colons requires both this variable and 
    `cperl-auto-newline-after-colon' set. 
 `cperl-auto-newline-after-colon'
    Non-nil means automatically newline even after colons.
    Subject to `cperl-auto-newline' setting.
 `cperl-indent-level'
    Indentation of Perl statements within surrounding block.
    The surrounding block's indentation is the indentation
    of the line on which the open-brace appears.
 `cperl-continued-statement-offset'
    Extra indentation given to a substatement, such as the
    then-clause of an if, or body of a while, or just a statement continuation.
 `cperl-continued-brace-offset'
    Extra indentation given to a brace that starts a substatement.
    This is in addition to `cperl-continued-statement-offset'.
 `cperl-brace-offset'
    Extra indentation for line if it starts with an open brace.
 `cperl-brace-imaginary-offset'
    An open brace following other text is treated as if it the line started
    this far to the right of the actual line indentation.
 `cperl-label-offset'
    Extra indentation for line that is a label.
 `cperl-min-label-indent'
    Minimal indentation for line that is a label.

Settings for K&R and BSD indentation styles are
  `cperl-indent-level'                5    8
  `cperl-continued-statement-offset'  5    8
  `cperl-brace-offset'               -5   -8
  `cperl-label-offset'               -5   -8

CPerl knows several indentation styles, and may bulk set the
corresponding variables.  Use \\[cperl-set-style] to do this.  Use
\\[cperl-set-style-back] to restore the memorized preexisting values
\(both available from menu).

If `cperl-indent-level' is 0, the statement after opening brace in
column 0 is indented on 
`cperl-brace-offset'+`cperl-continued-statement-offset'.

Turning on CPerl mode calls the hooks in the variable `cperl-mode-hook'
with no args.

DO NOT FORGET to read micro-docs (available from `Perl' menu)
or as help on variables `cperl-tips', `cperl-problems',
`cperl-non-problems', `cperl-praise', `cperl-speed'.

\(fn)" t nil)

;;;***

;;;### (autoloads (gnuserv-start) "gnuserv" "../emacslib/gnuserv.el"
;;;;;;  (16943 57462))
;;; Generated autoloads from ../emacslib/gnuserv.el

(autoload (quote gnuserv-start) "gnuserv" "\
Allow this Emacs process to be a server for client processes.
This starts a server communications subprocess through which
client \"editors\" (gnuclient and gnudoit) can send editing commands to
this Emacs job. See the gnuserv(1) manual page for more details.

Prefix arg means just kill any existing server communications subprocess.

\(fn &optional LEAVE-DEAD)" t nil)

;;;***

;;;### (autoloads (htmlize-many-files-dired htmlize-many-files htmlize-file
;;;;;;  htmlize-buffer) "htmlize" "../emacslib/htmlize.el" (16943
;;;;;;  57462))
;;; Generated autoloads from ../emacslib/htmlize.el

(autoload (quote htmlize-buffer) "htmlize" "\
HTML-ize BUFFER.

\(fn &optional BUFFER)" t nil)

(autoload (quote htmlize-file) "htmlize" "\
HTML-ize FILE, and save the result.
If TARGET-DIRECTORY is non-nil, the resulting HTML file will be saved
to that directory, instead of to the FILE's directory.

\(fn FILE &optional TARGET-DIRECTORY)" t nil)

(autoload (quote htmlize-many-files) "htmlize" "\
HTML-ize files specified by FILES, and save them to `.html' files.
If TARGET-DIRECTORY is specified, the HTML files will be saved to that
directory.  Normally, each HTML file is saved to the directory of the
corresponding source file.

\(fn FILES &optional TARGET-DIRECTORY)" t nil)

(autoload (quote htmlize-many-files-dired) "htmlize" "\
HTMLize dired-marked files.

\(fn ARG &optional TARGET-DIRECTORY)" t nil)

;;;***

;;;### (autoloads (jdok-generate-javadoc-template jdok-customize)
;;;;;;  "jdok" "../emacslib/jdok.el" (16943 57462))
;;; Generated autoloads from ../emacslib/jdok.el

(autoload (quote jdok-customize) "jdok" "\
Show the jdok customization options panel.

\(fn)" t nil)

(autoload (quote jdok-generate-javadoc-template) "jdok" "\
Insert a javadoc block comment template above the class or method
declaration at point (see `jdok-get-declaration' for details on how
the declaration is found). The command assumes that the declaration
syntax is valid.

BEFORE EXECUTING THE COMMAND, THE POINT MUST BE LOCATED AT THE FIRST
LINE OF THE CLASS OR METHOD DECLARATION. IF NOT RESULT IS UNCERTAIN.

In the following examples, point is located at the beginning of the
line, before the word 'public' (but it could be anywhere on this
line):

1- Class example:
   -------------

-|-  public class MyClass
       extends MySuperClass implements Runnable, java.io.Serializable
     {
       ...

\\[jdok-generate-javadoc-template] inserts:

+    /**
+     * Describe class <code>MyClass</code> here.
+     *
+     * @author \"David Ponce\" <david.ponce@wanadoo.fr>
+     * @version 1.0
+     * @since 1.0
+     * @see MySuperClass
+     * @see Runnable
+     * @see java.io.Serializable
+     */
     public class MyClass
       extends MySuperClass implements Runnable, java.io.Serializable
     {
       ...

2- Method example:
   --------------

-|-  public
     void   myMethod( int  x,  int y )
       throws Exception
     {
       ...

\\[jdok-generate-javadoc-template] inserts:

+    /**
+     * Describe <code>myMethod</code> method here.
+     *
+     * @param x an <code>int</code> value
+     * @param y a <code>long</code> value
+     * @exception Exception if an error occurs
+     */
     public
     void   myMethod( int  x,  long y )
       throws Exception
     {
       ...

`tempo' templates are used for each category of javadoc line. The
following templates are currently defined and fully customizable (see
`tempo-define-template' for the different items that can be used in a
tempo template):

- - `jdok-author-tag-template'
- - `jdok-describe-class-template'
- - `jdok-describe-constructor-template'
- - `jdok-describe-interface-template'
- - `jdok-describe-method-template'
- - `jdok-exception-tag-template'
- - `jdok-param-tag-template'
- - `jdok-return-tag-template'
- - `jdok-see-tag-template'
- - `jdok-since-tag-template'
- - `jdok-version-tag-template'

For example if you customize `jdok-describe-class-template' with the
following value:

'(\"* \" (P \"Class description: \"))

you will be asked to enter the class description in the
minibuffer. See also the `jdok-a' and `jdok-code' helper functions.

\(fn)" t nil)

;;;***

;;;### (autoloads (nxml-glyph-display-string) "nxml-glyph" "../emacslib/nxml-mode-20041004/nxml-glyph.el"
;;;;;;  (16943 57444))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/nxml-glyph.el

(autoload (quote nxml-glyph-display-string) "nxml-glyph" "\
Return a string that can display a glyph for Unicode code-point N.
FACE gives the face that will be used for displaying the string.
Return nil if the face cannot display a glyph for N.

\(fn N FACE)" nil nil)

;;;***

;;;### (autoloads (nxml-mode) "nxml-mode" "../emacslib/nxml-mode-20041004/nxml-mode.el"
;;;;;;  (16948 39663))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/nxml-mode.el

(autoload (quote nxml-mode) "nxml-mode" "\
Major mode for editing XML.

Syntax highlighting is performed unless the variable
`nxml-syntax-highlight-flag' is nil.

\\[nxml-finish-element] finishes the current element by inserting an end-tag.
C-c C-i closes a start-tag with `>' and then inserts a balancing end-tag
leaving point between the start-tag and end-tag. 
\\[nxml-balanced-close-start-tag-block] is similar but for block rather than inline elements:
the start-tag, point, and end-tag are all left on separate lines.
If `nxml-slash-auto-complete-flag' is non-nil, then inserting a `</'
automatically inserts the rest of the end-tag.

\\[nxml-complete] performs completion on the symbol preceding point.

\\[nxml-dynamic-markup-word] uses the contents of the current buffer
to choose a tag to put around the word preceding point.

Sections of the document can be displayed in outline form.  The
variable `nxml-section-element-name-regexp' controls when an element
is recognized as a section.  The same key sequences that change
visibility in outline mode are used except that they start with C-c C-o
instead of C-c.

Validation is provided by the related minor-mode `rng-validate-mode'.
This also makes completion schema- and context- sensitive.  Element
names, attribute names, attribute values and namespace URIs can all be
completed. By default, `rng-validate-mode' is automatically enabled by
`rng-nxml-mode-init' which is normally added to `nxml-mode-hook'. You
can toggle it using \\[rng-validate-mode].

\\[indent-for-tab-command] indents the current line appropriately.
This can be customized using the variable `nxml-child-indent'
and the variable `nxml-attribute-indent'.

\\[nxml-insert-named-char] inserts a character reference using
the character's name (by default, the Unicode name). \\[universal-argument] \\[nxml-insert-named-char]
inserts the character directly.

The Emacs commands that normally operate on balanced expressions will
operate on XML markup items.  Thus \\[forward-sexp] will move forward
across one markup item; \\[backward-sexp] will move backward across
one markup item; \\[kill-sexp] will kill the following markup item;
\\[mark-sexp] will mark the following markup item.  By default, each
tag each treated as a single markup item; to make the complete element
be treated as a single markup item, set the variable
`nxml-sexp-element-flag' to t.  For more details, see the function
`nxml-forward-balanced-item'.

\\[nxml-backward-up-element] and \\[nxml-down-element] move up and down the element structure.

Many aspects this mode can be customized using
\\[customize-group] nxml RET.

\(fn)" t nil)

;;;***

;;;### (autoloads (nxml-enable-unicode-char-name-sets) "nxml-uchnm"
;;;;;;  "../emacslib/nxml-mode-20041004/nxml-uchnm.el" (16943 57444))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/nxml-uchnm.el

(autoload (quote nxml-enable-unicode-char-name-sets) "nxml-uchnm" "\
Enable the use of Unicode standard names for characters.
The Unicode blocks for which names are enabled is controlled by
the variable `nxml-enabled-unicode-blocks'.

\(fn)" t nil)

;;;***

;;;### (autoloads (rng-c-load-schema) "rng-cmpct" "../emacslib/nxml-mode-20041004/rng-cmpct.el"
;;;;;;  (16943 57443))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/rng-cmpct.el

(autoload (quote rng-c-load-schema) "rng-cmpct" "\
Load a schema in RELAX NG compact syntax from FILENAME.
Return a pattern.

\(fn FILENAME)" nil nil)

;;;***

;;;### (autoloads (rng-write-version rng-format-manual rng-byte-compile-load
;;;;;;  rng-update-autoloads) "rng-maint" "../emacslib/nxml-mode-20041004/rng-maint.el"
;;;;;;  (16943 57443))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/rng-maint.el

(autoload (quote rng-update-autoloads) "rng-maint" "\
Update the autoloads in rng-auto.el.

\(fn)" t nil)

(autoload (quote rng-byte-compile-load) "rng-maint" "\
Byte-compile and load all of the RELAX NG library in an appropriate order.

\(fn)" t nil)

(autoload (quote rng-format-manual) "rng-maint" "\
Create manual.texi from manual.xml.

\(fn)" t nil)

(autoload (quote rng-write-version) "rng-maint" "\
Version

\(fn)" nil nil)

;;;***

;;;### (autoloads (rng-nxml-mode-init) "rng-nxml" "../emacslib/nxml-mode-20041004/rng-nxml.el"
;;;;;;  (16943 57444))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/rng-nxml.el

(autoload (quote rng-nxml-mode-init) "rng-nxml" "\
Initialize `nxml-mode' to take advantage of `rng-validate-mode'.
This is typically called from `nxml-mode-hook'.
Validation will be enabled if `rng-nxml-auto-validate-flag' is non-nil.

\(fn)" t nil)

;;;***

;;;### (autoloads (rng-validate-mode) "rng-valid" "../emacslib/nxml-mode-20041004/rng-valid.el"
;;;;;;  (16943 57444))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/rng-valid.el

(autoload (quote rng-validate-mode) "rng-valid" "\
Minor mode performing continual validation against a RELAX NG schema.

Checks whether the buffer is a well-formed XML 1.0 document,
conforming to the XML Namespaces Recommendation and valid against a
RELAX NG schema. The mode-line indicates whether it is or not.  Any
parts of the buffer that cause it not to be are considered errors and
are highlighted with `rng-error-face'. A description of each error is
available as a tooltip.  \\[rng-next-error] goes to the next error
after point. Clicking mouse-1 on the word `Invalid' in the mode-line
goes to the first error in the buffer. If the buffer changes, then it
will be automatically rechecked when Emacs becomes idle; the
rechecking will be paused whenever there is input pending..

By default, uses a vacuous schema that allows any well-formed XML
document. A schema can be specified explictly using
\\[rng-set-schema-file-and-validate], or implicitly based on the buffer's
file name or on the root element name.  In each case the schema must
be a RELAX NG schema using the compact schema (such schemas
conventionally have a suffix of `.rnc').  The variable
`rng-schema-locating-files' specifies files containing rules
to use for finding the schema.

\(fn &optional ARG NO-CHANGE-SCHEMA)" t nil)

;;;***

;;;### (autoloads (rng-xsd-compile) "rng-xsd" "../emacslib/nxml-mode-20041004/rng-xsd.el"
;;;;;;  (16943 57443))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/rng-xsd.el

(put (quote http://www\.w3\.org/2001/XMLSchema-datatypes) (quote rng-dt-compile) (quote rng-xsd-compile))

(autoload (quote rng-xsd-compile) "rng-xsd" "\
Provides W3C XML Schema as a RELAX NG datatypes library. NAME is a
symbol giving the local name of the datatype.  PARAMS is a list of
pairs (PARAM-NAME . PARAM-VALUE) where PARAM-NAME is a symbol giving
the name of the parameter and PARAM-VALUE is a string giving its
value.  If NAME or PARAMS are invalid, it calls rng-dt-error passing
it arguments in the same style as format; the value from rng-dt-error
will be returned.  Otherwise, it returns a list.  The first member of
the list is t if any string is a legal value for the datatype and nil
otherwise.  The second argument is a symbol; this symbol will be
called as a function passing it a string followed by the remaining
members of the list.  The function must return an object representing
the value of the datatype that was represented by the string, or nil
if the string is not a representation of any value. The object
returned can be any convenient non-nil value, provided that, if two
strings represent the same value, the returned objects must be equal.

\(fn NAME PARAMS)" nil nil)

;;;***

;;;### (autoloads (xmltok-get-declared-encoding-position) "xmltok"
;;;;;;  "../emacslib/nxml-mode-20041004/xmltok.el" (16948 39603))
;;; Generated autoloads from ../emacslib/nxml-mode-20041004/xmltok.el

(autoload (quote xmltok-get-declared-encoding-position) "xmltok" "\
Return the position of the encoding in the XML declaration at point.
If there is a well-formed XML declaration starting at point and it
contains an encoding declaration, then return (START . END)
where START and END are the positions of the start and the end
of the encoding name; if there is no encoding declaration return
the position where and encoding declaration could be inserted.
If there is XML that is not well-formed that looks like an XML declaration,
return nil.  Otherwise, return t.
If LIMIT is non-nil, then do not consider characters beyond LIMIT.

\(fn &optional LIMIT)" nil nil)

;;;***

;;;### (autoloads (php-mode) "php-mode" "../emacslib/php-mode.el"
;;;;;;  (17842 30655))
;;; Generated autoloads from ../emacslib/php-mode.el

(defvar php-file-patterns (list "\\.php[s34]?\\'" "\\.phtml\\'" "\\.inc\\'"))

(autoload (quote php-mode) "php-mode" "\
Major mode for editing PHP code.

\\{php-mode-map}

\(fn)" t nil)

;;;***

;;;### (autoloads (svn-status) "psvn" "../emacslib/psvn.el" (17000
;;;;;;  34319))
;;; Generated autoloads from ../emacslib/psvn.el

(autoload (quote svn-status) "psvn" "\
Examine the status of Subversion working copy in directory DIR.
If ARG then pass the -u argument to `svn status'.

\(fn DIR &optional ARG)" t nil)

;;;***

;;;### (autoloads (py-shell python-mode) "python-mode" "../emacslib/python-mode.el"
;;;;;;  (16943 57462))
;;; Generated autoloads from ../emacslib/python-mode.el

(autoload (quote python-mode) "python-mode" "\
Major mode for editing Python files.
To submit a problem report, enter `\\[py-submit-bug-report]' from a
`python-mode' buffer.  Do `\\[py-describe-mode]' for detailed
documentation.  To see what version of `python-mode' you are running,
enter `\\[py-version]'.

This mode knows about Python indentation, tokens, comments and
continuation lines.  Paragraphs are separated by blank lines only.

COMMANDS
\\{py-mode-map}
VARIABLES

py-indent-offset		indentation increment
py-block-comment-prefix		comment string used by `comment-region'
py-python-command		shell command to invoke Python interpreter
py-temp-directory		directory used for temp files (if needed)
py-beep-if-tab-change		ring the bell if `tab-width' is changed

\(fn)" t nil)

(let ((modes (quote (("jpython" . jpython-mode) ("jython" . jpython-mode) ("python" . python-mode))))) (while modes (when (not (assoc (car modes) interpreter-mode-alist)) (push (car modes) interpreter-mode-alist)) (setq modes (cdr modes))))

(when (not (or (rassq (quote python-mode) auto-mode-alist) (rassq (quote jpython-mode) auto-mode-alist))) (push (quote ("\\.py$" . python-mode)) auto-mode-alist))

(autoload (quote py-shell) "python-mode" "\
Start an interactive Python interpreter in another window.
This is like Shell mode, except that Python is running in the window
instead of a shell.  See the `Interactive Shell' and `Shell Mode'
sections of the Emacs manual for details, especially for the key
bindings active in the `*Python*' buffer.

With optional \\[universal-argument], the user is prompted for the
flags to pass to the Python interpreter.  This has no effect when this
command is used to switch to an existing process, only when a new
process is started.  If you use this, you will probably want to ensure
that the current arguments are retained (they will be included in the
prompt).  This argument is ignored when this function is called
programmatically, or when running in Emacs 19.34 or older.

Note: You can toggle between using the CPython interpreter and the
JPython interpreter by hitting \\[py-toggle-shells].  This toggles
buffer local variables which control whether all your subshell
interactions happen to the `*JPython*' or `*Python*' buffers (the
latter is the name used for the CPython buffer).

Warning: Don't use an interactive Python if you change sys.ps1 or
sys.ps2 from their default values, or if you're running code that
prints `>>> ' or `... ' at the start of a line.  `python-mode' can't
distinguish your output from Python's output, and assumes that `>>> '
at the start of a line is a prompt from Python.  Similarly, the Emacs
Shell mode code assumes that both `>>> ' and `... ' at the start of a
line are Python prompts.  Bad things can happen if you fool either
mode.

Warning:  If you do any editing *in* the process buffer *while* the
buffer is accepting output from Python, do NOT attempt to `undo' the
changes.  Some of the output (nowhere near the parts you changed!) may
be lost if you do.  This appears to be an Emacs bug, an unfortunate
interaction between undo and process filters; the same problem exists in
non-Python process buffers using the default (Emacs-supplied) process
filter.

\(fn &optional ARGPROMPT)" t nil)

;;;***

;;;### (autoloads (ruby-mode) "ruby-mode" "../emacslib/ruby/ruby-mode.el"
;;;;;;  (17641 62708))
;;; Generated autoloads from ../emacslib/ruby/ruby-mode.el

(autoload (quote ruby-mode) "ruby-mode" "\
Major mode for editing ruby scripts.
\\[ruby-indent-command] properly indents subexpressions of multi-line
class, module, def, if, while, for, do, and case statements, taking
nesting into account.

The variable ruby-indent-level controls the amount of indentation.
\\{ruby-mode-map}

\(fn)" t nil)

;;;***

;;;### (autoloads (rubydb) "rubydb2x" "../emacslib/ruby/rubydb2x.el"
;;;;;;  (17641 62707))
;;; Generated autoloads from ../emacslib/ruby/rubydb2x.el

(autoload (quote rubydb) "rubydb2x" "\
Run rubydb on program FILE in buffer *gud-FILE*.
The directory containing FILE becomes the initial working directory
and source-file directory for your debugger.

\(fn COMMAND-LINE)" t nil)

;;;***

;;;### (autoloads (rubydb) "rubydb3x" "../emacslib/ruby/rubydb3x.el"
;;;;;;  (17641 62708))
;;; Generated autoloads from ../emacslib/ruby/rubydb3x.el

(autoload (quote rubydb) "rubydb3x" "\
Run rubydb on program FILE in buffer *gud-FILE*.
The directory containing FILE becomes the initial working directory
and source-file directory for your debugger.

\(fn COMMAND-LINE)" t nil)

;;;***

;;;### (autoloads (make-current-directory make-magic make-remake
;;;;;;  make make-doit) "make" "../make.el" (17619 33017))
;;; Generated autoloads from ../make.el

(autoload (quote make-doit) "make" "\
Compile in a given dir with the given command, preserving the
  existing command and directory. Kill the old compile if necessary.

\(fn COMMAND &rest DIR)" nil nil)

(autoload (quote make) "make" "\
Compile with make using the current values of make-directory and
  make-command.  If a prefix argument is specified the user will be
  prompted for the make command.  Otherwise, if either the directory
  or command is not specified, the user will be prompted then as
  well.

\(fn &rest PROMPT)" nil nil)

(autoload (quote make-remake) "make" "\
Select a directory & command, then make.

\(fn)" t nil)

(autoload (quote make-magic) "make" "\
Magically figure out how to compile the current file.

\(fn)" t nil)

(autoload (quote make-current-directory) "make" "\
Run make in the current directory.

\(fn)" t nil)

;;;***

;;;### (autoloads (svn-root svn-exec svn-blame svn-log svn-info svn-resolved
;;;;;;  svn-ediff svn-diff svn-revert svn-rm svn-add) "svn" "../svn.el"
;;;;;;  (17672 40125))
;;; Generated autoloads from ../svn.el

(autoload (quote svn-add) "svn" "\
Add current file to svn.

\(fn)" t nil)

(autoload (quote svn-rm) "svn" "\
Remove current file from svn.

\(fn)" t nil)

(autoload (quote svn-revert) "svn" "\
Revert current file.

\(fn &rest FORCE)" t nil)

(autoload (quote svn-diff) "svn" "\
Show diff for current file.

\(fn)" t nil)

(autoload (quote svn-ediff) "svn" "\
Show ediff for current file.

\(fn)" t nil)

(autoload (quote svn-resolved) "svn" "\
Mark the current file as resolved.

\(fn)" t nil)

(autoload (quote svn-info) "svn" "\
Display the subversion info about the current file.

\(fn)" t nil)

(autoload (quote svn-log) "svn" "\
Show log for current file.

\(fn)" t nil)

(autoload (quote svn-blame) "svn" "\
Show blame for current file.

\(fn)" t nil)

(autoload (quote svn-exec) "svn" "\
Run svn into *SVN*, with args.

\(fn ARGS &optional SHOW)" nil nil)

(autoload (quote svn-root) "svn" "\
Return the topmost project in the given path

\(fn)" nil nil)

;;;***
