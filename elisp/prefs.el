;;;
;;; Emacs preferences file - contains personal preferences.
;;; copy this into your ~/.emacs to personalize.
;;;

;; you probably don't care about these
(setq PC-word-delimiters "-_.=")
(setq auto-revert-interval 2)
(setq auto-save-list-file-prefix nil)
(setq backup-by-copying t)
(setq default-major-mode 'text-mode)
(setq default-tab-width 4)
;;(setq display-time-format "%a %b %e %l:%M\%p ")
(setq display-time-format nil)
(setq file-name-buffer-file-type-alist '(("\\.cgi$" . t)))
(setq fill-column 60)
(setq gc-cons-threshold 200000)
(setq inhibit-startup-message t)
(setq initial-scratch-message nil)
(setq jit-lock-stealth-time 1)
(setq jit-lock-stealth-nice 0.5)
(setq jit-lock-defer-contextually t)
(setq line-number-display-limit 3000000)
(setq message-log-max 200)
(setq save-abbrevs nil)
(setq speedbar-track-mouse-flag nil)
(setq track-eol nil)
(setq truncate-partial-width-windows nil)
(setq w32-use-full-screen-buffer nil)

;; cleanup make output
(setenv "TERM" "emacs")

;; you might want to customize these
(setq backup-inhibited t)
(setq backward-delete-char-untabify-method 'hungry)
(setq column-number-mode t)
(setq confirm-before-kill-emacs nil)
(setq line-number-mode t)
;;(setq printer-name nil)
(setq require-final-newline nil)

;; turn off p4-check-mode unless absolutely necessary. it really hammers
;; the server.
(setq p4-do-find-file nil)
(setq p4-file-refresh-timer-time 0)

(set-default 'indent-tabs-mode nil)
(set-default 'tab-width 4)

(put 'eval-expression 'disabled nil)
(put 'upcase-region   'disabled nil)
(put 'downcase-region 'disabled nil)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; editing

(when (not is-win32)
  (keyboard-translate ?\C-h ?\C-?))

(global-set-key "\C-\\"     'advertised-undo)
(global-set-key "\C-c\C-c"      'comment-region)  
(global-set-key "\C-c\C-u"  'uncomment-region)
(global-set-key "\C-m"      'newline-and-indent)
(global-set-key "\C-x."     'find-tag)
(global-set-key "\C-x\C-b"      'electric-buffer-list)
(global-set-key "\M-."      'find-tag-non-interactive)
(global-set-key "\M-;"      'tags-return)
(global-set-key "\M-g"          'goto-line)
(global-set-key [C-backspace]   'backward-kill-word)
(global-set-key [C-kp-right]    'indent-for-tab-command)
(global-set-key [C-right]       'indent-for-tab-command)
(global-set-key [C-tab]         'abtags-find-next-file)
(global-set-key-override "\177" 'backward-delete-char-untabify)

;; mini-buffer
(define-key minibuffer-local-map "\t" 'hippie-expand)
   
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; movement

(global-set-key "\M-z"          'pager-row-up)
(global-set-key "\C-z"          'pager-row-down)
(global-set-key [home]          'beginning-of-line)
(global-set-key [end]           'end-of-line)
(global-set-key [C-home]        'beginning-of-line)
(global-set-key [C-end]         'end-of-line)
(global-set-key [C-left]        'backward-word)
(global-set-key [C-up]          'previous-line)
(global-set-key [C-down]        'next-line)
(global-set-key [C-kp-up]       'previous-line)
(global-set-key [C-kp-down]     'next-line)
(global-set-key [C-kp-left]     'backward-word)
;; (global-set-key "\C-v"       'pager-page-down)
;; (global-set-key "\M-v"       'pager-page-up)
;; (global-set-key [next]       'pager-page-down)
;; (global-set-key [prior]      'pager-page-up)

;; these are turned off because some people use them to reindent a
;; line - see indent-for-tab-command above
;;
;;(global-set-key [C-right]     'forward-word)
;;(global-set-key [C-kp-right]  'forward-word)
 
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; mistakes

(global-set-key "\C-xf"     'find-file) 
(global-set-key "\C-x\C-f"  'find-file)
(global-set-key "\C-xs"     'save-buffer)
(global-set-key "\C-x\C-s"  'save-buffer)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; p4/csc 

;;(global-set-key [f1]      'p4-edit)
(global-set-key [f3]        'svn-diff)
;;(global-set-key "\C-xp"         'p4-prefix-map)
;;(global-set-key "\C-x\C-q"      'p4-toggle-read-only)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; compilation

(global-set-key "\M-m"      'make)
(global-set-key "\M-p"      'make-remake)
(global-set-key-override "\M-s" 'make-magic)
(global-set-key [M-up]      'previous-error)
(global-set-key [M-down]    'next-error)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; java/cpp

(global-set-key-override "\C-cr"    'repackage  'java-mode)
(global-set-key-override "\C-c\C-r" 'repackage  'java-mode)
(global-set-key-override "\C-cj"    'jdok-generate-javadoc-template 'java-mode)
(global-set-key-override "\C-c\C-j" 'jdok-generate-javadoc-template 'java-mode)
(global-set-key-override "\C-ct"    'java-trace-method 'java-mode)
(global-set-key-override "\C-c\C-t" 'java-trace-method 'java-mode)
(global-set-key-override "\C-cp"    'java-trace-ctor 'java-mode)
(global-set-key-override "\C-c\C-p" 'java-trace-ctor 'java-mode)
(global-set-key-override "\C-ct"    'cpp-trace-method 'c++-mode)
(global-set-key-override "\C-c\C-t" 'cpp-trace-method 'c++-mode)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; shell

(global-set-key-override "\t" 'comint-dynamic-complete 'shell-mode)
(global-set-key-override "\C-c\C-c" 'comint-interrupt-subjob 'shell-mode)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; imenu
(when window-system
  (global-set-key [C-down-mouse-3] 'imenu))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; abtags

;; A helper to set M-z to abtags after the .emacs file has loaded, if
;; the user doesn't specifically set abtags-keymap-prefix to nil.
(defun abtags-maybe-set-key ()
  (if (not (boundp 'abtags-keymap-prefix))
      (setq abtags-keymap-prefix "\M-z"))
  (if (not (null abtags-keymap-prefix))
      (global-set-key abtags-keymap-prefix 'abtags-key-map)))
(add-hook 'after-init-hook 'abtags-maybe-set-key)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; Window specific settings.

(setq ring-bell-function (function (lambda ())))

(defvar my-font nil)

(when window-system
  (blink-cursor-mode 0)
  (set-scroll-bar-mode nil)
  (setq visible-bell t)
  (tool-bar-mode 0)
  (transient-mark-mode 0)

;; (setq window-position 'center)
;;   (setq window-columns 100)
;;   (setq window-fudge '(0 0 0 0))
;;   (if is-win32 (setq window-fudge '(0 0 0 55)))
  (if is-win32 (setq my-font (window-build-font "Consolas" 10)))

  (window-set-frame-default 'auto-raise nil)
  (window-set-frame-default 'cursor-type 'box)
  (window-set-frame-default 'scroll-bar-width 12)

  ;; frame title
  (setq frame-title-format
        (concat "Emacs@"
                (if (string-match "^\\([^.]+\\)\..+" system-name)
                    (match-string 1 system-name)
                  system-name)
                " - %f")))

(when (or window-system (not is-win32))
  (setq font-lock-verbose 2048)
  (setq font-lock-maximum-decoration t)
  (global-font-lock-mode t))



;; Blackboard Colour Theme for Emacs.
;;
;; Defines a colour scheme resembling that of the original TextMate Blackboard colour theme.
;; To use add the following to your .emacs file (requires the color-theme package):
;;
;; (require 'color-theme)
;; (color-theme-initialize)
;; (load-file "~/.emacs.d/themes/color-theme-blackboard.el")
;;
;; And then (color-theme-blackboard) to activate it.
;;
;; MIT License Copyright (c) 2008 JD Huntington <jdhuntington at gmail dot com>
;; Credits due to the excellent TextMate Blackboard theme
;;
;; All patches welcome

(defun color-theme-blackboard ()
  "Color theme by JD Huntington, based off the TextMate Blackboard theme, created 2008-11-27"
  (interactive)
  (color-theme-install
   '(color-theme-blackboard
     ((background-color . "#0C1021")
      (background-mode . dark)
      (border-color . "black")
      (cursor-color . "#A7A7A7")
      (foreground-color . "#F8F8F8")
      (mouse-color . "sienna1"))
     (default ((t (:background "#0C1021" :foreground "#F8F8F8"))))
     (blue ((t (:foreground "blue"))))
     (bold ((t (:bold t))))
     (bold-italic ((t (:bold t))))
     (border-glyph ((t (nil))))
     (buffers-tab ((t (:background "#0C1021" :foreground "#F8F8F8"))))
     (font-lock-builtin-face ((t (:foreground "#F8F8F8"))))
     (font-lock-comment-face ((t (:italic t :foreground "#AEAEAE"))))
     (font-lock-constant-face ((t (:foreground "#D8FA3C"))))
     (font-lock-doc-string-face ((t (:foreground "DarkOrange"))))
     (font-lock-function-name-face ((t (:foreground "#FF6400"))))
     (font-lock-keyword-face ((t (:foreground "#FBDE2D"))))
     (font-lock-preprocessor-face ((t (:foreground "Aquamarine"))))
     (font-lock-reference-face ((t (:foreground "SlateBlue"))))

     (font-lock-regexp-grouping-backslash ((t (:foreground "#E9C062"))))
     (font-lock-regexp-grouping-construct ((t (:foreground "red"))))

     (font-lock-string-face ((t (:foreground "#61CE3C"))))
     (font-lock-type-face ((t (:foreground "#8DA6CE"))))
     (font-lock-variable-name-face ((t (:foreground "#FF6400"))))
     (font-lock-warning-face ((t (:bold t :foreground "Pink"))))
     (gui-element ((t (:background "#D4D0C8" :foreground "black"))))
     (region ((t (:background "#253B76"))))
     (mode-line ((t (:background "grey75" :foreground "black"))))
     (highlight ((t (:background "#222222"))))
     (highline-face ((t (:background "SeaGreen"))))
     (italic ((t (nil))))
     (left-margin ((t (nil))))
     (text-cursor ((t (:background "yellow" :foreground "black"))))
     (toolbar ((t (nil))))
     (underline ((nil (:underline nil))))
     (zmacs-region ((t (:background "snow" :foreground "ble")))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;; amd's color theme - turned off by default

(defun color-theme-amd ()
  (color-theme-install
   '(color-theme-amd
     ((background-color . "black")
      (foreground-color . "white")
      (cursor-color     . "yellow")
      (background-mode  . dark))
     
     (default      ((t (nil))))
     (fringe       ((t (                    :background "grey20"))))
     (modeline     ((t (:foreground "white" :background "darkslateblue"))))
     (region       ((t (                    :background "midnight blue"))))
     (highlight    ((t (                    :background "#13385b"))))
     
     (font-lock-builtin-face       ((t (:foreground "cornflower blue"))))
     (font-lock-comment-face       ((t (:foreground "green"))))
     (font-lock-doc-face           ((t (:foreground "green"))))
     (font-lock-constant-face      ((t (:foreground "gold"))))
     (font-lock-function-name-face ((t (:foreground "goldenrod" :bold t))))
     (font-lock-keyword-face       ((t (:foreground "DeepSkyBlue1"))))
     (font-lock-string-face        ((t (:foreground "red"))))
     (font-lock-type-face          ((t (:foreground "CadetBlue1" :bold t))))
     (font-lock-variable-name-face ((t (:foreground "SeaGreen2"))))
     (font-lock-warning-face       ((t (:foreground "Pink"))))

     )))

(defun color-theme-amd-win32 ()
  (color-theme-amd)
  (let ((color-theme-is-cumulative t))  
    (color-theme-install
     '(color-theme-amd-win32
       nil
       nil
       (font-lock-keyword-face       ((t (:foreground "cornflower blue"))))
       (font-lock-string-face        ((t (:foreground "tomato"))))
       (font-lock-warning-face       ((t (:foreground "cornflower blue"))))
       ))))

(defun color-theme-amd-linux ()
  (color-theme-amd)
  (let ((color-theme-is-cumulative t))  
    (color-theme-install
     '(color-theme-amd-win32
       ((background-color . "black"))
       nil
       (font-lock-string-face        ((t (:foreground "tomato"))))
       ))))

(defun color-theme-amd-linux-nw ()
  (color-theme-amd)
  (let ((color-theme-is-cumulative t))  
    (color-theme-install
     '(color-theme-amd-win32
       nil
       nil
       (font-lock-function-name-face ((t (:bold nil))))
       (font-lock-type-face          ((t (:foreground "cyan" :bold nil))))
       ))))

(defun turn-on-color-theme-amd ()
  "Turn on amd's colors."
  (interactive)
  (when (or window-system (not is-win32))
    (require 'color-theme)
    (cond
     (is-win32      (color-theme-amd-win32))
     (window-system (color-theme-amd-linux))
     (t             (color-theme-amd-linux-nw)))))


