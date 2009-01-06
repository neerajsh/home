;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; To get started with emacs:
;;
;; 1. Set the AMDELISP variable to point to the elisp/ directory. For
;;    example:

(defvar AMDELISP (format "%s/elisp" (getenv "HOME")))

;; 2. Load the start file.
(load (format "%s/start" AMDELISP))






      

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; everything else in this file is OPTIONAL but you may find some of
;; it useful
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; look and feel
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(require 'color-theme)
(when window-system
  (color-theme-gtk-ide))
(when (not window-system)
  (color-theme-dark-laptop))

;; my colors, defined in prefs.el
;;(turn-on-color-theme-amd)
  
;; put the window on the right, make it 87 columns wide. Also, enable
;; the mouse wheel.
(when window-system
  ;; (setq window-position 'right
;;         window-columns 87
;;         window-fudge '(0 12 0 55))

  (when is-win32
    (setq my-font (window-build-font "Andale" 10)))
  
  ;;  (setq my-font (window-build-font "Hells Programmer" 8))
  ;;  (setq my-font (window-build-font "Sheldon Narrow" 8))

  ;; turn on the mouse wheel
  (mouse-wheel-mode t)

  ;; blink the cursor
  (blink-cursor-mode 1)

  ;; highlight line-mode
  (global-hl-line-mode)
  )

;; i don't like menus...
(menu-bar-mode 0)

;; personally i like transient-mark-mode
(transient-mark-mode t)





;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; modes
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(require 'complete)
(partial-completion-mode t)

;; (when (not is-win32)
;;   (require 'xcscope))

;; turn of p4-check-mode unless absolutely necessary
(setq p4-file-refresh-timer-time 0
      p4-do-find-file nil)

;; spelling
(setq
 ispell-extra-args '("--mode=sgml")
 ispell-program-name "aspell"
 ispell-silently-savep t)
(set-default 'ispell-skip-html t)

;; turn on global-auto-revert-mode
(global-auto-revert-mode 1)
(setq global-auto-revert-mode-text "-AR"
      auto-revert-interval 5)

;; but leave it off for TAGS files
(defun turn-off-auto-revert-hook ()
  "If this is a TAGS file, turn off auto-revert."
  (when (string= (buffer-name) "TAGS")
    (setq global-auto-revert-ignore-buffer t)))
(add-hook 'find-file-hooks 'turn-off-auto-revert-hook)





;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; random settings
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(setq
 abtags-keymap-prefix nil
 backward-delete-char-untabify-method 'all
 comint-input-ring-size 99
 completion-ignore-case t
 html-helper-do-write-file-hooks nil
 shell-dirtrack-verbose nil
 sort-fold-case t
 sql-oracle-program "sqlplus"
 tags-add-tables t
 )



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; functions
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defun switch-to-buffer-nocreate (buffer)
  "Switch to a buffer but don't create one if it doesn't exist."
  (interactive "bSwitch to buffer ")
  (switch-to-buffer buffer))

;; hack to clear comint buffer when I use certain commands
(defun my-comint-filter (x)
  (when (string-match "\\(startup\\|units\\)\n" x)
    (kill-region (point-min) (point-max))
    (insert (format "(buffer cleared by my-comint-filter)\n> %s" x))))
(add-hook 'shell-mode-hook '(lambda () (add-hook 'comint-input-filter-functions 'my-comint-filter nil t)))

;; overridden to modify compilation-search-path
(defun compilation-find-file (marker filename dir &rest formats)
  "Find a buffer for file FILENAME.
Search the directories in `compilation-search-path'.
A nil in `compilation-search-path' means to try the
current directory, which is passed in DIR.
If FILENAME is not found at all, ask the user where to find it.
Pop up the buffer containing MARKER and scroll to MARKER if we ask the user."
  (or formats (setq formats '("%s")))
  (save-excursion
    (let ((dirs compilation-search-path)
          buffer thisdir fmts name)
      (if (file-name-absolute-p filename)
          ;; The file name is absolute.  Use its explicit directory as
          ;; the first in the search path, and strip it from FILENAME.
          (setq filename (abbreviate-file-name (expand-file-name filename))
                dirs (cons (file-name-directory filename) dirs)
                filename (file-name-nondirectory filename)))
      ;; Now search the path.
      (while (and dirs (null buffer))
        (setq thisdir (or (car dirs) dir)
              fmts formats)
        ;; For each directory, try each format string.
        (while (and fmts (null buffer))
          (setq name (expand-file-name (format (car fmts) filename) thisdir)
                buffer (and (file-exists-p name)
                            (find-file-noselect name))
                fmts (cdr fmts)))
        (setq dirs (cdr dirs)))
      (or buffer
          ;; The file doesn't exist.
          ;; Ask the user where to find it.
          ;; If he hits C-g, then the next time he does
          ;; next-error, he'll skip past it.
          (let* ((pop-up-windows t)
                 (w (display-buffer (marker-buffer marker))))
            (set-window-point w marker)
            (set-window-start w marker)
            (let ((name (expand-file-name
                         (read-file-name
                          (format "Find this error in: (default %s) "
                                  filename)
                          dir filename t))))
              (if (file-directory-p name)
                  (setq name (expand-file-name filename name)))

              ;; amd
              (setq compilation-search-path
                    (cons (file-name-directory name) compilation-search-path))
	       
              (setq buffer (and (file-exists-p name)
                                (find-file name))))))
      ;; Make intangible overlays tangible.
      (mapcar (function (lambda (ov)
                          (when (overlay-get ov 'intangible)
                            (overlay-put ov 'intangible nil))))
              (overlays-in (point-min) (point-max)))
      buffer)))



;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; keys
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(global-set-key [f7]  'abtags-find-file)
(global-set-key [f8]  'grep)
(global-set-key [f12] 'next-error)
(global-set-key "\C-xb" 'switch-to-buffer-nocreate)
(global-set-key "\C-\M-q" 'backward-up-list-indent)
(global-set-key "\M-," 'tags-search-tags-table)

;; use TAB key for completion everywhere
(global-set-key-override0 "\t" 'clever-hippie-tab)
(global-set-key-override  "\t" 'clever-nxml-tab 'nxml-mode)


;; ecb projects
(custom-set-variables
  ;; custom-set-variables was added by Custom.
  ;; If you edit it by hand, you could mess it up, so be careful.
  ;; Your init file should contain only one such instance.
  ;; If there is more than one, they won't work right.
 '(ecb-options-version "2.32")
 '(ecb-source-path (quote (("c:\\depot\\wave14\\avalanche\\sources\\proto\\Dev" "avdev") ("c:\home" "home")))))
(custom-set-faces
  ;; custom-set-faces was added by Custom.
  ;; If you edit it by hand, you could mess it up, so be careful.
  ;; Your init file should contain only one such instance.
  ;; If there is more than one, they won't work right.
 )

