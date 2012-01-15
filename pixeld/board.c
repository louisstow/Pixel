#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <sys/queue.h>
#include <time.h>

#include "board.h"
#include "pixeld.h"

#define ROWS		1000
#define COLS		1200
#define RED         0
#define GREEN       1
#define BLUE        2

#define get_dominant(r,g,b) (\
                            (r > g && r > b ? RED : \
                            (g > r && g > b ? GREEN : \
                            (b > g && b > r ? BLUE : \
                                (r == b && r == g ? \
                                    (rand() % 3)\
                                : \
                                (r == b ? (rand() % 2 == 0 ? RED : BLUE)\
                                :\
                                (r == g ? (rand() % 2 == 0 ? RED : GREEN)\
                                :\
                                (g == b ? (rand() % 2 == 0 ? GREEN : BLUE)\
                                :\
                                RED\
                                ))))\
                            ))))

TAILQ_HEAD(tailhead, journal) head;

struct pixel 
**init_board(unsigned int rows, unsigned int cols)
{
	unsigned int i, j;
	struct pixel **board;
	board = xmalloc(rows * sizeof(struct pixel *));
	
	for (i = 0; i < rows; i++) {
		board[i] = xmalloc(sizeof(struct pixel) * cols);
		for (j = 0; j < cols; j++) {
			board[i][j].colour[0] = '.';
			board[i][j].mdata = xmalloc(sizeof(struct metadata));
		}
	}

	return board;
}

void 
init_journal(void)
{
	TAILQ_INIT(&head);
}

void strip_nl(char *s) {
	int i;

	for (i = 0; i < strlen(s); i++) { 
		if (s[i] == '\n')
			s[i] = '\0';
	}
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
	int i, j, fd, val;
	struct pixel *pp = &b[r][c];

	if (p == NULL) {
		pp->colour[0] = '.';
		return 0;
	}

	if (p->colour[0] != '.')
		strcpy(pp->colour, p->colour);
	if (p->cost[0] != '.')
		sprintf(pp->cost, "%03d", atoi(p->cost));
	if (p->oid[0] != '.')
		sprintf(pp->oid, "%04d", atoi(p->oid));
	
	fd = open("journal.data", O_CREAT | O_RDWR);

	if (fd == -1) {
		perror("open");
		exit(-1);
	}

	for (i = 0; i < ROWS; i++) {
		for (j = 0; j < COLS; j++) {
			val = write(fd, &b[r][c], sizeof(struct journal));

			if (val < sizeof(struct journal)) {
				perror("write");
				exit(-1);
			}
		}
	}

	close(fd);

	return 1;
}

void 
print_board(int s, struct pixel **b) {
	FILE *f;
	struct pixel *p;
	unsigned int i, j;

	if ((f = fdopen(s, "w+")) == NULL)
		return;

	for (i = 0; i < 1000; i++) {
		for (j = 0; j < 1200; j++) {
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

void 
run_cron(int s, struct pixel **board) {
    struct pixel *p, *o;
    unsigned int i, j, k, row, col;

    //search a 1 pixel radius
    int circle[8][2] = {
        {-1, -1},
        {-1, 0},
        {-1, 1},
        {0, -1},
        {0, 1},
        {1, -1},
        {1, 0},
        {1, 1}
    };

    unsigned int color, r, g, b, dominant; //player colors
    unsigned int ocolor, or, og, ob, odominant; //opponent colors
    unsigned int odds = 0;

    char key[10];

    srand(time(NULL));

    for (i = 0; i < ROWS; i++) {
        for (j = 0; j < COLS; j++) {
            p = &board[i][j];

            if (p->colour[0] == '.') {
                continue;
            }

            //extract colour channels
            color = atoi(p->colour);
            r = (color & 0xFF0000) >> 16;
            g = (color & 0x00FF00) >> 8;
            b = (color & 0x0000FF);

            dominant = get_dominant(r, g, b);

            for (k = 0; k < 8; k++) {
                //apply the direction
                row = i + circle[k][0];
                col = j + circle[k][1];

                //if the pixel is out of bounds
                if (row < 0 || col < 0 || row > ROWS || col > COLS)
                    continue;

                o = &board[row][col];

                //skip the pixel if not exists or the same owners
                if (o->colour[0] == '.' || strcmp(o->oid, p->oid) == 0)
                    continue;

                //build the pixel location string
                memset(key, '\0', 10);
                sprintf(key, "%d,%d", col, row);

                //if the pixel has immunity skip them and take away immunity
                //if(get_meta(key, "immunity") == 1) {
                //    set_meta(key, "immunity", 0);
                //    continue;
                //}

                //extract opponent colors
                ocolor = atoi(p->colour);
                or = (ocolor & 0xFF0000) >> 16;
                og = (ocolor & 0x00FF00) >> 8;
                ob = (ocolor & 0x0000FF);

                odominant = get_dominant(or, og, ob);

                //if the players dominant color beats the opponent
                if(dominant == RED && odominant == GREEN ||
                   dominant == GREEN && odominant == BLUE ||
                   dominant == BLUE && odominant == RED) {

                    odds += 600;
                    fprintf(stderr, "Dominant color\n");
                }

                //reward brighter colours
                if (dominant == RED) {
                    odds += (r - g) + (r - b);
                } else if (dominant == GREEN) {
                    odds += (g - r) + (g - b);
                } else if (dominant == BLUE) {
                    odds += (b - r) + (b - g);
                }

                //are they lucky enough to win?
                if ((rand() % 1000) < odds) {
                    //they win, change owner!
                    strcpy(board[row][col].oid, p->oid);
                    fprintf(stderr, "WIN, change owner\n");
                    //TODO: for the user who lost, update their lose count
                    //TODO: for the user who won, update their win count
                }
            }
        }
    }
}

/* parse PQL command from the web server */
int
parse_query(int sock, char *qry, struct pixel **board)
{
	int i, *c, *cp;
	FILE *f;
	char *s,  *qp, timestamp[32], *key, *value;
	struct pixel *bp;
	struct journal *jp;

	if (qry[0] == 'l') {
		f = fdopen(sock, "r+");
		for (jp = head.tqh_first; jp != NULL; jp = jp->entries.tqe_next) {
			fprintf(stderr, "journal: %u %u\n", atol(qry + 2), atol(jp->timestamp));
			if (atol(qry + 2) < atol(jp->timestamp))
				break;
		}

		for (; jp != NULL; jp = jp->entries.tqe_next) {
			strip_nl(jp->query);
			fprintf(f, "%s\n", jp->query);
		}

		fflush(f);
		return 1;
	}

	if (qry[0] == 'g') {
		print_board(sock, board);
		return 1;
	}

    if (qry[0] == 'c') {
        run_cron(sock, board);
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
		
	} else if (qp[0] == 'd') {
		cp = c = extract_pixels(qry);

		while(*cp != -1) {
			bp = &board[*cp][*(cp+1)];
			bp->colour[0] = '.';
			add_journal(qry, qp + 2);
			cp += 2;
		}
		fprintf(stderr, "delete success\n");
	} else if (qp[0] == 'm') {
		cp = c = extract_pixels(qry);

		while(*cp != -1) {
			bp = &board[*cp][*(cp+1)];	
			key = xmalloc(strlen(qry));
			value = xmalloc(strlen(qry));

			sscanf(qp + 2, "%s %s", key, value);

			if (!strcmp("immunity", key))
				bp->mdata->immunity = value[0];

			c += 2;
		}
		
		free(key);
		free(value);
	}

	free(c);
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
	s = '\0';
	sscanf(p, "%d,%d", &coods[i++], &coods[i++]);

finish:
	coods[i] = -1;
	free(orig);
	return coods;
}
