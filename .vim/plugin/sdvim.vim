" SDmenu.vim : Vim menu for using SourceDepot       vim:tw=0
" Author : Gautam Bhakar <gautamb@microsoft.com>    vim600:fdm=marker
" global definitions.                               vim600:fmr=<<<,>>>
"#############################################################################
" Settings
"#############################################################################
" global variables : may be set in ~/.vimrc	<<<1

" this *may* interfere with :help (inhibits highlighting)
" disable autocheck, if this happens to you.
if ($SDOPT == '')
  let $SDOPT='-z9'
endif

if ($SDCMD == '')
  let $SDCMD='sd'
endif
if !exists("s:SDMyOpenedBuffer")
    let s:SDMyOpenedBuffer = 0
endif
if !exists("s:SDdiffOpenedSplitBelowBak")
    let s:SDdiffOpenedSplitBelowBak = 0
endif
if !exists("g:SDcmd")
    let g:SDcmd = 'sd '
endif
if !exists(':SdDiff')
	command -nargs=0 SdDiff :silent call SDdiff()
endif
if !exists("s:SDSavedDiff")
    let s:SDSavedDiff = 1			" save settings when using :diff
endif
if !exists("s:SDDiffBuff")
    let s:SDDiffBuff = -1
endif



" script variables	<<<1
if has('unix')				" path separator
    let s:sep='/'
else
    let s:sep='\'
endif
let s:orgpath = getcwd()
let s:SDLeaveDiff = 0
let g:SDdifforgbuf = 0

if exists("loaded_sdmenu")
    aunmenu SD
endif

"-----------------------------------------------------------------------------
" Menu entries		<<<1
"-----------------------------------------------------------------------------
" Space before each command to inhibit translation (no one wants a 'cvs Differenz':)
" <esc> in Keyword menus to avoid expansion
" use only TAB between menu item and command (used for MakeLeaderMapping)

"amenu &Depot.\ In&fo						    :call SDShowInfo()<cr>
amenu &Depot.\ &Diff						    :call SDdiff()<cr>
amenu &Depot.\ &History						:call SDShowHistory()<cr>
amenu &Depot.\ &Opened\ Files                  :call SDdiffopened()<cr>
amenu &Depot.-SEP1-						:
amenu &Depot.\ &Checkout						:call SDCheckOut()<cr>
amenu &Depot.\ &Revert\ changes				:call SDRevertChanges()<cr>
amenu &Depot.\ &Add						    :call SDAdd()<cr>
amenu &Depot.-SEP2-						:
amenu &Depot.\ &Submit\ Changes                :call SDCreateChangelist()<cr>

"-----------------------------------------------------------------------------
" syntax, MakeRO/RW		<<<1
"-----------------------------------------------------------------------------

function! SDMakeRO()
    set nomodified
    set readonly
    if v:version >= 600
        setlocal nomodifiable
    endif
endfunction

function! SDMakeRW()
    set noreadonly
    if v:version >= 600
        setlocal modifiable
    endif
endfunction

function! SDFindFile()
    let curdir = getcwd()
    exec 'cd '.g:workdir
    normal 0W
    exec 'cd '.curdir
    unlet curdir
endfunction

"-----------------------------------------------------------------------------
" status variables		<<<1
"-----------------------------------------------------------------------------
function! SDChDir(path)
    let s:orgpath = getcwd()
    let s:workdir = expand("%:p:h")
    exec 'cd '.a:path
endfunction

function! SDRestoreDir()
    if isdirectory(s:orgpath)
        exec 'cd '.s:orgpath
    endif
endfunction

"-----------------------------------------------------------------------------
">>>
"#############################################################################
" SD commands
"#############################################################################
"-----------------------------------------------------------------------------
" SD call		<<<1
"-----------------------------------------------------------------------------

" return > 0 if is win 95-me
function! SDIsW9x()
    return (has("win32") && (match($COMSPEC,"command\.com") > -1))
endfunction

function! SDDoCommand(cmd,...)
    " needs to be called from orgbuffer
    let isfile = SDUsesFile()
    " change to buffers directory
    "exec 'cd '.expand('%:p:h')
    call SDChDir(expand('%:p:h'))
    " get file/directory to work on (if not given)
    if a:0 < 1
        let filename=expand('%:p:t')
    else
        let filename = a:1
    endif
    " problem with win98se : system() gives an error
    " cannot open 'F:\WIN98\TEMP\VIo9134.TMP'
    " piping the password also seems to fail (maybe caused by sd.exe)
    " Using 'exec' creates a confirm prompt - only use this s**t on w9x
    if SDIsW9x()
        let tmp=tempname()
        exec '!'.g:SDcmd.' '.a:cmd.' '.filename.'>'.tmp
        exec 'split '.tmp
        let dummy=delete(tmp)
        unlet tmp dummy
    else
        let regbak=@z
        let @z=system(g:SDcmd.' '.a:cmd.' '.filename)
        new
        silent normal "zP
        "let @z=regbak
    endif
    call SDProcessOutput(isfile, filename, a:cmd)
    call SDRestoreDir()
    unlet filename
endfunction

function! SDProcessOutput(isfile,filename,cmd)
    " delete leading and trainling blank lines
    while (getline(1) == '') && (line("$")>1)
        silent exec '0d'
    endwhile
    while (getline("$") == '') && (line("$")>1)
        silent exec '$d'
    endwhile
    " move to top
    normal gg
    set nowrap
    call SDMakeRO()
endfunction

" return: 1=file 0=dir
function! SDUsesFile()
    let filename=expand("%:p:t")
    if filename != ''
        return 1
    else
        return 0
    endif
    unlet filename
endfunction

"-----------------------------------------------------------------------------
" SD history (revision)		<<<1
"-----------------------------------------------------------------------------
function! SDProcessHistoryFile(filename)
    call append(0, a:filename)
    silent exec '%s/\n\n\t/\t{{{1\r\t/g'
    silent! exec '%s/\n\n\(\.\{3} \)\{2}/\r\t\tBranch Info\t{{{2\r\t\t/g'
    silent! exec '%s/\(\.\{3} \)\{2}/\t\t/g'
    silent! exec '%s/\(\.\{3} \)//g'
    setlocal tw=0
    setlocal fdm=marker
endfunction

function! SDShowHistory()
    call SDChDir(expand("%:p:h"))
    let filename = expand("%:p:t")
    let fullfilename = expand("%:p")
    if filename == ''
        echo 'History only shows valid files'
        return
    endif
    let tmpname = tempname().'.sdhist'
    call SDDoCommand('filelog -l', filename)
    call SDMakeRW()
    call SDProcessHistoryFile(fullfilename)
    exec 'w! '.tmpname
    " Set Split to split below and store old value in backup.
    let s:SDdiffOpenedSplitBelowBak = &splitbelow
    set splitbelow
    call SDMakeRO()
    call SDRestoreDir()
    nnoremap <buffer> <tab> :call SDShowDescriptionDetails()<cr>
    nnoremap <buffer> <cr>  :call SDShowDiffs()<cr>
    unlet fullfilename filename tmpname
endfunction

function! SDShowDiffs()
    let CurrLineNum = line(".")
    if CurrLineNum < 3
        CurrLineNum = 3
    endif
    while getline(CurrLineNum)[0] != '#'
        let CurrLineNum = CurrLineNum -1
    endwhile
    if CurrLineNum > 2
        let CurrentLine = getline(CurrLineNum)
        let RevisionNum = strpart(CurrentLine, 1, stridx(CurrentLine, ' ')) + 0
        if RevisionNum > 1
            let filename = getline("1")
            if s:SDDiffBuff != -1
                if bufwinnr(s:SDDiffBuff) != -1
                    exec bufwinnr(s:SDDiffBuff).' wincmd w'
                    exec 'q! '
                endif
                let s:SDDiffBuff = -1
            endif
            if bufwinnr(s:SDMyOpenedBuffer) > 0
                exec bufwinnr(s:SDMyOpenedBuffer).' wincmd w'
            else
                new
            endif
            exec 'edit '.filename
            let s:SDMyOpenedBuffer = SDDiffFiles(RevisionNum,RevisionNum-1, filename, 1)
            wincmd _
        endif
        unlet CurrentLine RevisionNum
    endif
    unlet filename CurrLineNum
endfunction

function! SDHistFilePrepareLeave()
    let &splitbelow = s:SDdiffOpenedSplitBelowBak
endfunction

function! SDHistFileEnter()
    exec 'resize '.line("$")
endfunction

function! SDHistFileLeave()
    resize 1
endfunction

function! SDShowDescriptionDetails()
endfunction
"-----------------------------------------------------------------------------
" SD checkout (revision)		<<<1
"-----------------------------------------------------------------------------
function! SDCheckOut()
    call SDChDir(expand("%:p:h"))
    call system('sd edit '.expand('%:p:t'))
    exec 'e '
    call SDRestoreDir()
endfunction

function! SDcheckoutRevision(rev)
endfunction

function! SDRevertChanges()
    call SDChDir(expand("%:p:h"))
    let filename = expand('%:p:t')
    if filename == ''
        echo 'Revert changes:only on files'
        return
    endif
    call system('sd revert '.filename)
    exec 'e! '
    call SDRestoreDir()
    unlet filename
endfunction

function! SDAdd()
    call SDChDir(expand("%:p:h"))
    let filename = expand("%:p:t")
    if filename == ''
        echo "Can't Add this file"
        return
    endif
    call system('sd add '.filename)
    call SDRestoreDir()
    unlet filename
endfunction

function! SDCreateChangelist()
    call SDChDir(expand("%:p:h"))
    call SDDoCommand('change -o','')
    let tmpnam = tempname().'.sdchnglist'
    exec 'w! '.tmpnam
    call SDMakeRW()
    call SDRestoreDir()
endfunction

function! SDSubmitChangelist()
    let Response = confirm("Submit Changelist?", "&Yes\n&No", 1)
    let filename = expand("%:p")
    if Response == 1
        exec '!sd submit -i < "'.filename.'"'
    endif
    call system('del /f '.filename)
    unlet filename Response
endfunction
"-----------------------------------------------------------------------------
" SD diff (diffsplit)		<<<1
"-----------------------------------------------------------------------------

" parm : revision
function! SDdiff(...)
    call SDDiffFiles(0, -1)
endfunction

function! SDDiffFiles(File1Revision, File2Revision, ...)
    if s:SDSavedDiff > 0
        call SDDiffEnter()
    endif
    let OpenInCurrentBuffer = 0
    if a:0 > 0 && filereadable(a:1)
        if stridx(a:1, "\\") != -1
            let Seperator = "\\"
        elseif stridx(a:1, "/") != -1
            let Seperator = "/"
        elseif stridx(a:1, ":") != -1
            let Seperator = ":"
        else
            let Seperator = ""
        endif
        if Seperator != ""
            let CurrFileNameTail = strpart(a:1, strridx(a:1, "\\") + 1)
            let CurrFileNameHead = strpart(a:1, 0, strridx(a:1, "\\"))
        else
            CurrFileNameTail = a:1
            CurrFileNameHead = ""
        endif
        if a:0 == 2
            let OpenInCurrentBuffer = 1
        endif
    else
        let CurrFileNameTail = expand("%:p:t")
        let CurrFileNameHead = expand("%:p:h")
    endif
    let CurrFileName = CurrFileNameTail
    call SDChDir(CurrFileNameHead)
    if a:File1Revision == 0
        let File1Name = CurrFileName
    else
        let File1Name = CurrFileName."_".a:File1Revision
        call system('sd print -o '.File1Name.' -q '.CurrFileName.'#'.a:File1Revision)
    endif
    let File2Name = CurrFileName."_".a:File2Revision.'.sddiff'
    if a:File2Revision == -1
        call system('sd print -o '.File2Name.' -q '.CurrFileName)
    else
        call system('sd print -o '.File2Name.' -q '.CurrFileName.'#'.a:File2Revision)
    endif
    let orgfiletype = &filetype
    if File1Name != CurrFileName
        if OpenInCurrentBuffer == 0
            new
        endif
        exec 'edit '.File1Name
        call SDMakeRO()
    else
        let s:SDLeaveDiff = s:SDLeaveDiff + 1
    endif
    let RetVal = bufnr("%")
    if v:version < 600
        exec 'diffsplit '.File2Name
    else
        exec 'vertical diffsplit '.File2Name
    endif
    call SDMakeRO()
    let s:SDDiffBuff=bufnr("%")
    let &filetype = orgfiletype
    if File1Name != CurrFileName
        call system('del /f '.File1Name)
    endif
    call system('del /f '.File2Name)
    call SDRestoreDir()
    unlet CurrFileName File1Name File2Name CurrFileNameTail CurrFileNameHead
    return RetVal
endfunction

"-----------------------------------------------------------------------------
" SD diff all opened (diffsplit)		<<<1
"-----------------------------------------------------------------------------
function! SDdiffopened()
    let orgcwd = getcwd()
    exec 'cd '.expand('%:p:h')
    let tmpname = tempname().'.sdodiff'
    call SDDoCommand("opened -l", ' ')
    redraw
    exec 'w! '.tmpname
    call SDMakeRO()
    call system('del /f '.tmpname)
    let s:SDdiffOpenedSplitBelowBak = &splitbelow
    set splitbelow
    nnoremap <buffer> <cr> :call SDOpenAndDiffFile()<cr>
    exec 'cd '.orgcwd
    unlet orgcwd tmpname
endfunction

function! SDOpenAndDiffFile()
    let curline=getline(".")
    let filename=''
    if stridx(curline, "#") > 0
        let filename=strpart(curline, 0, stridx(curline, "#"))
        if s:SDDiffBuff != -1
            if bufwinnr(s:SDDiffBuff) != -1
                exec bufwinnr(s:SDDiffBuff).' wincmd w'
                exec 'q! '
            endif
            let s:SDDiffBuff = -1
        endif
        if bufwinnr(s:SDMyOpenedBuffer) > 0
            exec bufwinnr(s:SDMyOpenedBuffer).' wincmd w'
        else
            new
        endif
        exec 'edit '.filename
        let s:SDMyOpenedBuffer = SDDiffFiles(0,-1)
        wincmd _
    endif
endfunction

function! SDOpenedDiffPrepareLeave()
    let &splitbelow = s:SDdiffOpenedSplitBelowBak
endfunction

function! SDOpenedDiffEnter()
    exec 'resize '.line("$")
endfunction

function! SDOpenedDiffLeave()
    resize 1
endfunction
">>>
"#############################################################################
" extended commands
"#############################################################################
"-----------------------------------------------------------------------------
" revert changes, shortstatus		<<<1
"-----------------------------------------------------------------------------

" get status info, compress it (one line/file), sort by status
"-----------------------------------------------------------------------------
" LocalStatus : read from SD/Entries		<<<1
"-----------------------------------------------------------------------------

" extract and convert timestamp from SDEntryItem
function! SDtimeToStr(entry)
  return SDAsctimeToStr(SDSubstr(a:entry,'/',3))
endfunction
" get and convert filetime
" include local time zone info
function! SDFiletimeToStr(filename)
  let time=getftime(a:filename)-(GMTOffset() * 60*60)
  return strftime('%Y-%m-%d %H:%M:%S',time)
endfunction

" entry format : ISO C asctime()
function! SDAsctimeToStr(asctime)
  let mon=strpart(a:asctime, 4,3)
  let DD=SDLeadZero(strpart(a:asctime, 8,2))
  let hh=SDLeadZero(strpart(a:asctime, 11,2))
  let nn=SDLeadZero(strpart(a:asctime, 14,2))
  let ss=SDLeadZero(strpart(a:asctime, 17,2))
  let YY=strpart(a:asctime, 20,4)
  let MM=SDMonthIdx(mon)
  " SD/WinNT : no date given for merge-results
  if MM == ''
    let result = ''
  else
    let result = YY.'-'.MM.'-'.DD.' '.hh.':'.nn.':'.ss
  endif
  unlet YY MM DD hh nn ss mon
  return result
endfunction

" append a leading zero
function! SDLeadZero(value)
  let nr=substitute(a:value,' ','','g') + 0
  if (nr < 10)
    let nr = '0' . nr
  endif
  return nr
endfunction

" return month (leading zero) from cleartext
function! SDMonthIdx(month)
  if match(a:month,'Jan') > -1
    return '01'
  elseif match(a:month,'Feb') > -1
    return '02'
  elseif match(a:month,'Mar') > -1
    return '03'
  elseif match(a:month,'Apr') > -1
    return '04'
  elseif match(a:month,'May') > -1
    return '05'
  elseif match(a:month,'Jun') > -1
    return '06'
  elseif match(a:month,'Jul') > -1
    return '07'
  elseif match(a:month,'Aug') > -1
    return '08'
  elseif match(a:month,'Sep') > -1
    return '09'
  elseif match(a:month,'Oct') > -1
    return '10'
  elseif match(a:month,'Nov') > -1
    return '11'
  elseif match(a:month,'Dec') > -1
    return '12'
  else
    return
endfunction

" divide string by sep, return field[index] .start at 0.
function! SDSubstr(string,separator,index)
  let sub = ''
  let idx = 0
  let bst = 0
  while (bst < strlen(a:string)) && (idx <= a:index)
    if a:string[bst] == a:separator
      let idx = idx + 1
    else
      if (idx == a:index)
        let sub = sub . a:string[bst]
      endif
    endif
    let bst = bst + 1
  endwhile
  unlet idx bst
  return sub
endfunction

"Get difference between local time and GMT
"strftime() returns the adjusted time
"->strftime(0) GMT=00:00:00, GMT+1=01:00:00
"->midyear=summertime: strftime(182*24*60*60)=02:00:00 (GMT+1)
"linux bug:wrong CEST information before 1980
"->use 331257600 = 01.07.80 00:00:00
function! GMTOffset()
  let winter1980 = (10*365+2)*24*60*60      " = 01.01.80 00:00:00
  let summer1980 = winter1980+182*24*60*60  " = 01.07.80 00:00:00
  let summerhour = strftime("%H",summer1980)
  let summerzone = strftime("%Z",summer1980)
  let winterhour = strftime("%H",winter1980)
  let winterday  = strftime("%d",winter1980)
  let curzone    = strftime("%Z",localtime())
  if curzone == summerzone
    let result = summerhour
  else
    let result = winterhour
  endif
  " GMT - x : invert sign
  if winterday == 31
    let result = -1 * result
  endif
  unlet curzone winterday winterhour summerzone summerhour summer1980 winter1980
  return result
endfunction

"-----------------------------------------------------------------------------
" tools: output processing, input query		<<<1
"-----------------------------------------------------------------------------

"-----------------------------------------------------------------------------
" Autocommand : set title, restore diffmode		<<<1
"-----------------------------------------------------------------------------

" save pre diff settings
function! SDDiffEnter()
    if s:SDDiffBuff != -1
        if bufwinnr(s:SDDiffBuff) != -1
            exec bufwinnr(s:SDDiffBuff).' wincmd w'
            exec 'q! '
        endif
        let s:SDDiffBuff = -1
    endif
    let g:SDdifforgbuf = bufnr('%')
    let g:SDbakdiff 		= &diff
    let g:SDbakscrollbind 	= &scrollbind
    let g:SDbakwrap 		= &wrap
    let g:SDbakfoldcolumn 	= &foldcolumn
    let g:SDbakfoldenable 	= &foldenable
    let g:SDbakfoldlevel 	= &foldlevel
    let g:SDbakfoldmethod 	= &foldmethod
endfunction

" restore pre diff settings
function! SDDiffLeave()
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&diff'	    , g:SDbakdiff	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&scrollbind' , g:SDbakscrollbind	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&wrap'	    , g:SDbakwrap	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&foldcolumn' , g:SDbakfoldcolumn	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&foldenable' , g:SDbakfoldenable	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&foldlevel'    , g:SDbakfoldlevel	)
    call setwinvar(bufwinnr(g:SDdifforgbuf), '&foldmethod' , g:SDbakfoldmethod	)
endfunction

" save original settings
function! SDBackupDiffMode()
    let g:SDorgdiff 		= &diff
    let g:SDorgscrollbind 	= &scrollbind
    let g:SDorgwrap 		= &wrap
    let g:SDorgfoldcolumn 	= &foldcolumn
    let g:SDorgfoldenable 	= &foldenable
    let g:SDorgfoldlevel 	= &foldlevel
    let g:SDorgfoldmethod 	= &foldmethod
endfunction

" restore original settings
function! SDRestoreDiffMode()
    let &diff             		= g:SDorgdiff
    let &scrollbind 		= g:SDorgscrollbind
    let &wrap             		= g:SDorgwrap
    let &foldcolumn 		= g:SDorgfoldcolumn
    let &foldenable 		= g:SDorgfoldenable
    let &foldlevel    		= g:SDorgfoldlevel
    let &foldmethod 		= g:SDorgfoldmethod
endfunction
        
" this is useful for mapping
function! SDSwitchDiffMode()
    if &diff
        call SDRestoreDiffMode()
    else
        diffthis
    endif
endfunction

" remember restoring prediff mode
function! SDDiffPrepareLeave()
    if match(expand("<afile>:e"),'sddiff','i') > -1
        " diffed buffer gets unloaded twice by :vert diffs
        " only react to the second unload
        let s:SDLeaveDiff = s:SDLeaveDiff + 1
        " restore prediff settings (see SDPrepareLeave)
        if (s:SDSavedDiff > 0) && (s:SDLeaveDiff > 1)
            call SDDiffLeave()
            let s:SDDiffBuff = -1
            let s:SDLeaveDiff = 0
        endif
        exec 'bdelete '
    endif
endfunction

"-----------------------------------------------------------------------------
" finalization		<<<1
"-----------------------------------------------------------------------------

" restore prediff settings
au BufWinLeave *.sddiff call SDDiffPrepareLeave()
au BufWinLeave *.sdhist call SDHistFilePrepareLeave()
au BufEnter *.sdhist call SDHistFileEnter()
au BufLeave *.sdhist call SDHistFileLeave()
au BufWinLeave *.sdodiff call SDOpenedDiffPrepareLeave()
au BufEnter *.sdodiff call SDOpenedDiffEnter()
au BufLeave *.sdodiff call SDOpenedDiffLeave()
au BufWinLeave *.sdchnglist call SDSubmitChangelist()

if !exists("loaded_sdmenu")
    let loaded_sdmenu=1
endif
">>>1
