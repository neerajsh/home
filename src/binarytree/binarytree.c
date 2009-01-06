// binarytree.cpp : Defines the entry point for the console application.
//

#include <stdio.h>

////////////////////////////////////////////////////////
// This represents the node of the binary search tree //
////////////////////////////////////////////////////////
typedef struct node
{
    int data;
    struct node * left;
    struct node * right;
    
}node;


void build123(node ** pproot)
{

}

void insert(node ** pproot, int data)
{
    if(!pproot)
    {
        printf("Error: pproot is null\r\n");
        return;
    }
    node * pnew ;
    
    pnew = (node *)malloc(sizeof(node) );
    if(!pnew)
    {
        fprintf(stderr, "\n dynamic allocation failed\n");
        exit(1);
    }

}


int main(int argc, char *argv[])
{
    printf("Hello world");    
    return 0;
}
