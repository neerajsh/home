;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;
;; To get started with emacs:
;;
;; 1. Set the AMDELISP variable to point to the elisp/ directory. For
;;    example:

(defvar *emacs-load-start* (current-time))


(defvar AMDELISP (format "%s/elisp" (getenv "HOME")))

;; 2. Load the start file.
(load (format "%s/start" AMDELISP))


(require 'linum)
(linum-mode)



      

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; everything else in this file is OPTIONAL but you may find some of
;; it useful
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; my colors, defined in prefs.el
;(turn-on-color-theme-amd)
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; look and feel
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
(require 'color-theme)
 (when window-system
   (color-theme-gtk-ide))
 (when (not window-system)
   (color-theme-gtk-ide))

;;(turn-on-color-theme-amd)



  
;; put the window on the right, make it 87 columns wide. Also, enable
;; the mouse wheel.
(when window-system
  ;; (setq window-position 'right
;;         window-columns 87
;;         window-fudge '(0 12 0 55))

  
  ;;  (setq my-font (window-build-font "Hells Programmer" 8))
  ;;  (setq my-font (window-build-font "Sheldon Narrow" 8))

  ;; turn on the mouse wheel
  (mouse-wheel-mode t)

  ;; blink the cursor
  (blink-cursor-mode 1)

  ;; highlight line-mode
  (global-hl-line-mode)
  )


(menu-bar-mode 1)
(scroll-bar-mode 1)
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

