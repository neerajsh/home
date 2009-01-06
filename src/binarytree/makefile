
CC=gcc
CFLAGS=-c -Wall
LDFLAGS=
SOURCES=binarytree.c queue.c
OBJECTS = $(SOURCES:.c=.o)
EXECUTABLE=binarytree	

all: $(SOURCES) $(EXECUTABLE)

$(EXECUTABLE):$(OBJECTS) 
	$(CC) $(LDFLAGS) $(OBJECTS) -o $@
.c.o: 
	$(CC) $(CFLAGS) $< -o $@
clean: 
	rm -rf *o $(EXECUTABLE) 
