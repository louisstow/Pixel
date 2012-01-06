#include <stdio.h>
#include <stdlib.h>

#define COLOUR_SIZE 	6
#define COST_SIZE 	3
#define OID_SIZE	4

typedef struct {
	char colour[COLOUR_SIZE];
	char cost[COST_SIZE];
	char oid[OID_SIZE];
} pixel;

pixel 
**init_board(unsigned int rows, unsigned int cols)
{
	unsigned int i, j;
	pixel **board;
	board = malloc(rows * sizeof(pixel *));
	
	for (i = 0; i < rows; i++) {
		board[i] = malloc(sizeof(pixel) * cols);
		for (j = 0; j < cols; j++)
			board[i][j].colour[0] = '.';
	}

	return board;
}

void 
print_board(pixel **b, unsigned int rows, unsigned int cols) {
	unsigned int i, j;
	pixel *p;

	for (i = 0; i < rows; i++) {
		for (j = 0; j < cols; j++) {
			p = &b[i][j];
			if (p->colour[0] == '.')
				printf(". ");
			else
				printf("%s%s%s ", p->colour, p->cost, p->oid);
		}
		printf("\n");
	}
}
