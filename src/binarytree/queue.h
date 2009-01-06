#pragma once


typedef struct queue_node
{
    queue_node * next;
    int data;
} queue_node;


queue_node * first;
queue_node * last;

void enqueue(queue_node**  queue);
queue_node * dequeue(queue_node ** queue);

void print_queue(queue_node * queue);
