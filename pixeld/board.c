#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/queue.h>

#include "board.h"
#include "pixeld.h"

#define ROWS		1000
#define COLS		1200

TAILQ_HEAD(tailhead, journal) head;

struct pixel 
**init_board(unsigned int rows, unsigned int cols)
{
	unsigned int i, j;
	struct pixel **board;
	board = xmalloc(rows * sizeof(struct pixel *));
	
	for (i = 0; i < rows; i++) {
		board[i] = xmalloc(sizeof(struct pixel) * cols);
		for (j = 0; j < cols; j++)
			board[i][j].colour[0] = '.';
	}

	return board;
}

void 
init_journal(void)
{
	TAILQ_INIT(&head);
}

void
add_journal(char *query, char *ts)
{
	struct journal *jp;

	jp = xmalloc(sizeof(struct journal));
	jp->query = strdup(query);
	jp->timestamp = strdup(ts);

	TAILQ_INSERT_TAIL(&head, jp, entries);
}

int
write_pixel(struct pixel **b, struct pixel *p, int r, int c)
{
	int i, val;
	struct pixel *pp = &b[r][c];

	if (p == NULL) {
		pp->colour[0] = '.';
		return 0;
	}

	if (p->colour != NULL)
		strcpy(pp->colour, p->colour);
	if (p->cost != NULL)
		sprintf(pp->cost, "%03d", atoi(p->cost));
	if (p->oid != NULL)
		sprintf(pp->oid, "%04d", atoi(p->oid));
	
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
			if (p->colour[0] == '.') {
				fprintf(f, ".");
			} else
				fprintf(f, "%s%s%s", 
				        p->colour, 
					p->cost, 
					p->oid);
		}
	}
	fflush(f);
}

/* parse PQL command from the web server */
int
parse_query(int sock, char *qry, struct pixel **board)
{
	int i, *c, *cp;
	FILE *f;
	char *s,  *qp, timestamp[32];
	struct pixel *bp;
	struct journal *jp;

	if (qry[0] == 'l') {
		f = fdopen(sock, "r+");
		for (jp = head.tqh_first; jp != NULL; jp = jp->entries.tqe_next)
			fprintf(f, "%s: %s", jp->timestamp, jp->query);

		fflush(f);
		return 1;
	}

	if (qry[0] == 'g') {
		print_board(sock, board);
		return 1;
	}

	s = strdup(qry);
	if (strtok(s, " ") == NULL)
		return 0;

	qp = xmalloc(strlen(qry));
	memcpy(qp, qry + strlen(s) + 1, strlen(qry) - strlen(s));

	if (qp[0] == 'g') {
		f = fdopen(sock, "r+");
		cp = c = extract_pixels(qry);
		while (*cp != -1) {
			bp = &board[*cp][*(cp+1)];
			if (bp->colour[0] == '.')
				fprintf(f, "%c", bp->colour[0]);
			else
				fprintf(f, "%s%s%s", bp->colour, 
						     bp->cost,
						     bp->oid);
			cp += 2;
		}

		fflush(f);
	} else if (qp[0] == 'w') {
		cp = c = extract_pixels(qry);

		while (*cp != -1) {
			bp = xmalloc(sizeof(struct pixel));
			sscanf(qp + 2, "%s %s %s %s", bp->colour, 
			                              bp->cost, 
						      bp->oid,
						      timestamp);
			if (write_pixel(board, bp, *cp, *(cp+1)) == 1) {
				add_journal(qry, timestamp);
				printf("write success\n");
			} else
				printf("write fail\n");

			cp += 2;
			free(bp);
		}
		
		free(c);
	}

	free(s);
	return 1;
}

int 
*extract_pixels(char *qry)
{
	char *s, *p, *orig;
	int i, j, n, *coods;

	p = s = orig = strdup(qry);

	n = 1;
	for (i = 0; s[i] != ' '; i++) {
		if (s[i] == '|')
			n++;
	}

	coods = xmalloc(sizeof(int) * n * 2 + 1);

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
