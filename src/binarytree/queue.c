#include "queue.h"

void enqueue(queue_node** queue)
{
    queue_node * new_queue_node;
     new_queue_node = (  queue_node *)malloc( sizeof(  queue_node ) );
    if(  new_queue_node == NULL) {
          fprintf (stderr, "\ndynamic memory allocation failed\n");
          exit (EXI_FAILURE);
    }

    queue_node * next;
    next = *queue ;

    
    * queue = new_queue_node;

    if (next == NULL) last = new_queue_node;

    first = *queue;
    
}



queue_node* dequeue(queue_node ** queue)
{
    

}


