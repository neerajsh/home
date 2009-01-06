set nocompatible
"set t_Co=256
colors zellner
if has("gui_running")  
"	set guifont=Sans:h10:cANSI
endif
set showcmd
set showmatch
set ignorecase
set incsearch
set hlsearch
set smarttab
set ls=2
set guioptions-=T
set nu
syntax on
set ruler
"set lines=45 columns=100
filetype on
filetype indent on
filetype plugin on
set statusline=%<%f\%h%m%r%=%-20.(line=%l\ \ col=%c%V\ \ totlin=%L%)\ \ \%h%m%r%=%-40(bytval=0x%B,%n%Y%)\%P
let g:miniBufExplMapWindowNavVim = 1 
let g:miniBufExplMapWindowNavArrows = 1 
let g:miniBufExplMapCTabSwitchBufs = 1 
let g:miniBufExplModSelTarget = 1 
set completeopt=longest,menuone 
inoremap <expr> <cr> pumvisible() ? "\<c-y>" : "\<c-g>u\<cr>" 
inoremap <expr> <c-n> pumvisible() ? "\<lt>c-n>" : "\<lt>c-n>\<lt>c-r>=pumvisible() ? \"\\<lt>down>\" : \"\"\<lt>cr>" 
inoremap <expr> <m-;> pumvisible() ? "\<lt>c-n>" : "\<lt>c-x>\<lt>c-o>\<lt>c-n>\<lt>c-p>\<lt>c-r>=pumvisible() ? \"\\<lt>down>\" : \"\"\<lt>cr>" 
set wildmenu
autocmd BufNewFile * silent! 0r $HOME/templates/%:e.tpl
map <F12> <ESC>:Tlist<CR><C-W>h<C-W>s:VTreeExplore<CR>:set nonu<CR><C-W>l

let treeExplHidden=1
let treeExplVertical=1
let treeExplDirSort=1
let $VIM_INTELLISENSE="$HOME\vimfiles\intellisense"
autocmd BufEnter * lcd %:p:h
set showfulltag
set tags+=$HOME/vimfiles/tags/python.ctags

set foldmethod=syntax
set foldlevelstart=99

"Use :make to compile c even without a makefile
au FileType c,cpp if glob('Makefile') == "" | let &mp="gcc -o %< %" | endif
" Switch to the directory of the current file, unless it's a help file.
	au BufEnter * if &ft != 'help' | silent! cd %:p:h | endif

	" smart indenting for python
	au FileType python set smartindent cinwords=if,elif,else,for,while,try,except,finally,def,class

	" allows us to run :make and get syntax errors for our python scripts
	au FileType python set makeprg=python\ -c\ \"import\ py_compile,sys;\ sys.stderr=sys.stdout;\ py_compile.compile(r'%')\"
	" setup file type for code snippets
	au FileType python if &ft !~ 'django' | setlocal filetype=python.django_tempate.django_model | endif
	au FileType python set expandtab


" bind ctrl+space for omnicompletion
inoremap <expr> <C-Space> pumvisible() \|\| &omnifunc == '' ?
			\ "\<lt>C-n>" :
			\ "\<lt>C-x>\<lt>C-o><c-r>=pumvisible() ?" .
			\ "\"\\<lt>c-n>\\<lt>c-p>\\<lt>c-n>\" :" .
			\ "\" \\<lt>bs>\\<lt>C-n>\"\<CR>"


" Set the window size to 200 by 80
"
"winsize 150 60

" Toggle the tag list bar
nmap <F4> :TlistToggle<CR>

" tab navigation (next tab) with alt left / alt right
nnoremap  <a-right>  gt
nnoremap  <a-left>   gT

" Ctrl + Arrows - Move around quickly
nnoremap  <c-up>     {
nnoremap  <c-down>   }
nnoremap  <c-right>  El
nnoremap  <c-down>   Bh

" Shift + Arrows - Visually Select text
nnoremap  <s-up>     Vk
nnoremap  <s-down>   Vj
nnoremap  <s-right>  vl
nnoremap  <s-left>   vh

if &diff
" easily handle diffing 
   vnoremap < :diffget<CR>
   vnoremap > :diffput<CR>
else
" visual shifting (builtin-repeat)
   vnoremap < <gv                       
   vnoremap > >gv 
endif

" Extra functionality for some existing commands:
" <C-6> switches back to the alternate file and the correct column in the line.
nnoremap <C-6> <C-6>`"

" CTRL-g shows filename and buffer number, too.
nnoremap <C-g> 2<C-g>

" Arg!  I hate hitting q: instead of :q
nnoremap q: q:iq<esc>

" <C-l> redraws the screen and removes any search highlighting.
nnoremap <silent> <C-l> :nohl<CR><C-l>

" Q formats paragraphs, instead of entering ex mode
noremap Q gq

" * and # search for next/previous of selected text when used in visual mode
vnoremap * y/<C-R>"<CR>
vnoremap # y?<C-R>"<CR>

" <space> toggles folds opened and closed
nnoremap <space> za

" <space> in visual mode creates a fold over the marked range
vnoremap <space> zf

" allow arrow keys when code completion window is up
inoremap <Down> <C-R>=pumvisible() ? "\<lt>C-N>" : "\<lt>Down>"<CR>

""" Abbreviations
function! EatChar(pat)
  let c = nr2char(getchar(0))
  return (c =~ a:pat) ? '' : c
endfunc

iabbr _me Neeraj Sharma (neerajsh@microsoft.com)<C-R>=EatChar('\s')<CR>
iabbr _t  <C-R>=strftime("%H:%M:%S")<CR><C-R>=EatChar('\s')<CR>
iabbr _d  <C-R>=strftime("%a, %d %b %Y")<CR><C-R>=EatChar('\s')<CR>
iabbr _dt <C-R>=strftime("%a, %d %b %Y %H:%M:%S %z")<CR><C-R>=EatChar('\s')<CR>
set nocp
 map <F11> :!ctags -R --c++-kinds=+p --fields=+iaS --extra=+q .<CR>
