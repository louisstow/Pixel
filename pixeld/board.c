#include <stdio.h>
#include <stdlib.h>
#include <string.h>

#include "board.h"

#define ROWS		1000
#define COLS		1200

struct pixel 
**init_board(unsigned int rows, unsigned int cols)
{
	unsigned int i, j;
	struct pixel **board;
	board = malloc(rows * sizeof(struct pixel *));
	
	for (i = 0; i < rows; i++) {
		board[i] = malloc(sizeof(struct pixel) * cols);
		for (j = 0; j < cols; j++)
			board[i][j].colour[0] = '.';
	}

	return board;
}

int
write_pixel(struct pixel **b, struct pixel *p, int r, int c)
{
	struct pixel *pp = &b[r][c];

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
print_board(int s, struct pixel **b) {
	FILE *f;
	struct pixel *p;
	unsigned int i, j;

	if ((f = fdopen(s, "w+")) == NULL)
		return;

	for (i = 0; i < ROWS; i++) {
		for (j = 0; j < COLS; j++) {
			p = &b[i][j];
			if (p->colour[0] == '.')
				fprintf(f, ".");
			else
				fprintf(f, "%s%s%s", 
				        p->colour, 
					p->cost, 
					p->oid);
		}
		fprintf(f, "\n");
	}
}

/* parse PQL command from the web server */
int
parse_query(int sock, char *qry, struct pixel **board)
{
	char *s = malloc(strlen(qry)); 
	char *qp;

	if (qry[0] == 'l')
		return 1;

	if (qry[0] == 'g') {
		print_board(sock, board);
		return 1;
	}

	strcpy(s, qry);
	if (strtok(s, " ") == NULL)
		return 0;
	
	qp = malloc(strlen(qry));
	memcpy(qp, qry + strlen(s) + 1, strlen(qry) - strlen(s));

	free(s);
	return 1;
}

int 
*extract_pixels(char *qry)
{
	char *s, *p, *orig;
	int i, j, n, *coods;

	p = s = orig = malloc(strlen(qry) + 1);
	strcpy(s, qry);

	n = 1;
	for (i = 0; s[i] != ' '; i++) {
		if (s[i] == '|')
			n++;
	}

	coods = malloc(sizeof(int) * n * 2 + 1);

	for (i = 0; *s != ' '; s++) {
		if (*s == '|') {
			*s = '\0';
			if (sscanf(p, "%d,%d", &coods[i++], &coods[i++]) < 2)
				goto finish;
			p = s+1;
		}
	}
	*s = '\0';
	sscanf(p, "%d,%d", &coods[i++], &coods[i++]);

finish:
	coods[i] = -1;
	free(orig);
	return coods;
}
