#include <stdio.h>
#include <stdlib.h>

#define COLOUR_SIZE 	6
#define COST_SIZE 	3
#define OID_SIZE	4

struct {
	char colour[COLOUR_SIZE];
	char cost[COST_SIZE];
	char oid[OID_SIZE];
} pixel;

struct pixel 
**init_board(unsigned int rows, unsigned int cols)
{
	unsigned int i, j;
	struct pixel **board;
	board = malloc(rows * sizeof(pixel *));
	
	for (i = 0; i < rows; i++) {
		board[i] = malloc(sizeof(pixel) * cols);
		for (j = 0; j < cols; j++)
			board[i][j].colour[0] = '.';
	}

	return board;
}

int
write_pixel(struct pixel **b, struct pixel *p, int r, int c)
{
	struct pixel *pp = b[r][c];

	if (p == NULL) {
		p->colour[0] = '.';
		return 0;
	}

	if (p->colour != NULL)
		memcpy(pp->colour, p->colour, COLOUR_SIZE);
	if (p->cost != NULL)
		memcpy(pp->cost, p->cost, COST_SIZE);
	if (p->oid != NULL)
		memcpy(pp->oid, p->oid, OID_SIZE);

	return 1;
}

void 
print_board(pixel **b, unsigned int rows, unsigned int cols) {
	unsigned int i, j;
	struct pixel *p;

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
