# this is a bashrc file where there is always a prompt in the first line, and
# a very simple one on the actual line
#
# created by isopropyl@gmx.at, feb. 2003
# if you make an improvement, let me know :-)

# ==================================================================
# some colors
black="\[\033[0;30m\]"
dark_gray="\[\033[1;30m\]"
blue="\[\033[0;34m\]"
light_blue="\[\033[1;34m\]"
green="\[\033[0;32m\]"
light_green="\[\033[1;32m\]"
cyan="\[\033[0;36m\]"
light_cyan="\[\033[1;36m\]"
red="\[\033[0;31m\]"
light_red="\[\033[1;31m\]"
purple="\[\033[0;35m\]"
light_purple="\[\033[1;35m\]"
brown="\[\033[0;33m\]"
yellow="\[\033[1;33m\]"
light_gray="\[\033[0;37m\]"
white="\[\033[1;37m\]"
# ==================================================================

# If running interactively, then:
if [ "$PS1" ]; then


    # ==================================================================
    # my alias
    alias guntar='tar -xzvlf'
    alias gtar='tar -zcvf'

    # set the prompt 
    PS1="$yellow \u@\h: $light_purple \$(date) $light_cyan\w\n$light_purple\$ $light_green"
    

    
# ==================================================================

    # don't put duplicate lines in the history. See bash(1) for more options
    # export HISTCONTROL=ignoredups
    
    # enable color support of ls and also add handy aliases
    eval `dircolors -b`
    alias ls='ls --color=auto'
    alias dir='ls --color=auto --format=vertical'
    alias vdir='ls --color=auto --format=long'

    # some more ls aliases
    alias ll='ls -la'
    alias la='ls -A'
    alias l='ls -CF'
    alias cls='clear'

    # If this is an xterm set the title to user@host:dir
    case $TERM in
    xterm*)
        PROMPT_COMMAND='echo -ne "\033]0;${USER}@${HOSTNAME}: ${PWD}\007"'
        ;;
    *)
        ;;
    esac

    # enable programmable completion features (you don't need to enable
    # this, if it's already enabled in /etc/bash.bashrc).
    #if [ -f /etc/bash_completion ]; then
    #  . /etc/bash_completion
    #fi

    
fi
cd ~
clear

#cat ~/banners/banner.txt
#echo ''
fortune -s
