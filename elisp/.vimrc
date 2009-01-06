set nocompatible
set t_Co=256
colors elflord
if has("gui_running")  
	set guifont=Consolas:h12:cANSI
endif
set showcmd
set showmatch
set ignorecase
set incsearch
set hlsearch
set smarttab
set ls=2
set guioptions-=T
set guioptions-=m
set nu
syntax on
set ruler
set lines=45 columns=100
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
