(defun files-in-below-directory (directory)
  "List the .el files in DIRECTORY and its subdirs"
  (interactive "DDirectory Name: ")
  (let (files-list
        (current-directory-list
         (directory-files-and-attributes directory t)))
    ;; while we are in current directory
    (while current-directory-list
      (cond
       ;; check to see if the file name ends in `.el' and if so append it to the list
       ((equal ".el" (substring (car (car current-directory-list)) -3))
        (setq files-list
              (cons (car (car current-directory-list)) files-list)))
       ;; check whther filename is that of a directory
       ((eq t (car (cdr (car current-directory-list))))
        ;; decide  whether to skip or recurse
        (if
            (equal "."
                   (substring (car (car current-directory-list)) -1))
            ;; hten do nothing since the file name id that of current dir or parent "." or ".."
            ()
          ;; ekse descend in to the directory and repeat the process
          (setq files-list
                (append
                 (files-in-below-directory
                  (car (car current-directory-list)))
                 files-list)))))
      ;; move to the next file name in the list; this also shortens teh list so the while loop eventually comes to an end
      (setq current-directory-list (cdr current-directory-list)))
    ;;return the file names
    files-list))

(let ((test 'string))
  (message "%s" test))

(let ((file-list (files-in-below-directory "~/elisp")))
     (while file-list
       (byte-compile-file (car file-list))
       (setq file-list (cdr file-list))))