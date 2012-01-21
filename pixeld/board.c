#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <sys/mman.h>
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
#define USER_SIZE	65535

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
TAILQ_HEAD(penishead, summary) sumhead;

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
			board[i][j].immunity = '0';
		}
	}

	return board;
}

void 
init_journal(void)
{
	TAILQ_INIT(&head);
	TAILQ_INIT(&sumhead);
}

void 
strip_nl(char *s) 
{
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
	int i, j, fd;
	struct pixel *pp = &b[r][c];
	struct pixel *mp, *fp;

	if (p == NULL) {
		pp->colour[0] = '.';
		return 0;
	}

	if (p->colour[0] != '.')
		strcpy(pp->colour, p->colour);
	if (p->cost[0] != '.')
		sprintf(pp->cost, "%03lx", strtoul(p->cost, NULL, 16));
	if (p->oid[0] != '.')
		sprintf(pp->oid, "%04lx", strtoul(p->oid, NULL, 16));
	
	fd = open("journal.data", O_CREAT | O_RDWR | O_TRUNC, S_IRUSR | S_IWUSR);

	if (fd == -1) {
		perror("open");
		exit(-1);
	}

	fp = mp = (struct pixel *)xmalloc(sizeof(struct pixel) * ROWS * COLS);
	for (i = 0; i < ROWS; i++) {
		for (j = 0; j < COLS; j++) {
			memcpy(mp, &b[i][j], sizeof(struct pixel));
			mp++;
		}
	}
	write(fd, fp, sizeof(struct pixel) * ROWS * COLS);

	free(fp);
	close(fd);

	return 1;
}

int 
read_board(struct pixel **bp)
{
	int i, j, fd;

	fd = open("journal.data", O_RDONLY);

	if (fd == -1)
		return 0;

	for (i = 0; i < ROWS; i++) {
		for (j = 0; j < COLS; j++) {
			read(fd, &bp[i][j], sizeof(struct pixel));
		}
	}

	close(fd);

	return 1;
}

int
get_meta(int row, int col, char *type, struct pixel **board) 
{
	struct pixel *bp;
	bp = &board[row][col];

	if (!strcmp(type, "immunity")) {
		if (bp->immunity == '1')
			return 1;
		else
			return 0;
	}

	return 0;
}

int
set_meta(int row, int col, char *type, char *val, struct pixel **board) 
{
	struct pixel *bp;
	bp = &board[row][col];

	if (!strcmp(type, "immunity")) {
		bp->immunity = val[0];
		return 1;
	}

	return 0;
}

void 
print_board(int s, struct pixel **b) 
{
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
run_cron(int sock, struct pixel **board) 
{
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
	
	struct summary *owner;
	
    srand(time(NULL));

    for (i = 0; i < ROWS; i++) {
        for (j = 0; j < COLS; j++) {
            p = &board[i][j];

            if (p->colour[0] == '.') {
                continue;
            }

            //extract colour channels
            color = strtoul(p->colour, NULL, 16);
            r = (color & 0xFF0000) >> 16;
            g = (color & 0x00FF00) >> 8;
            b = (color & 0x0000FF);

            dominant = get_dominant(r, g, b);

            for (k = 0; k < 8; k++) {
                //apply the direction
                row = i + circle[k][0];
                col = j + circle[k][1];
                odds = 0;

                //if the pixel is out of bounds
                if (row < 0 || col < 0 || row > ROWS || col > COLS)
                    continue;

                o = &board[row][col];

                //skip the pixel if not exists or the same owners
                if (o->colour[0] == '.' || strcmp(o->oid, p->oid) == 0)
                    continue;


                //if the pixel has immunity skip them and take away immunity
                fprintf(stderr, "%d %d immunity %d\n", col, row, get_meta(row, col, "immunity", board));
				
				if (get_meta(row, col, "immunity", board) == 1) {
					fprintf(stderr, "%d %d Has immunity\n", col, row);
                    set_meta(row, col, "immunity", "0", board);
                    continue;
                }

                //extract opponent colors
                ocolor = strtoul(o->colour, NULL, 16);
                or = (ocolor & 0xFF0000) >> 16;
                og = (ocolor & 0x00FF00) >> 8;
                ob = (ocolor & 0x0000FF);

                odominant = get_dominant(or, og, ob);

                fprintf(stderr, "Opponent %d %d (%d) R[%d] G[%d] B[%d]\n", col, row, odominant, or, og, ob);
                
                //if the players dominant color beats the opponent
                if ((dominant == RED && odominant == GREEN) ||
                   (dominant == GREEN && odominant == BLUE) ||
                   (dominant == BLUE && odominant == RED)) {

                    odds += 600;
                    fprintf(stderr, "Dominant color\n");
                }

                //reward brighter colours
                if (dominant == RED) {
                    odds += ((r - g) + (r - b)) / 4;
                } else if (dominant == GREEN) {
                    odds += ((g - r) + (g - b)) / 4;
                } else if (dominant == BLUE) {
                    odds += ((b - r) + (b - g)) / 4;
                }

                fprintf(stderr, "Odds for %d %d  are %d (%d) R[%d] G[%d] B[%d]\n", j, i, odds, dominant, r, g, b);
                
                //are they lucky enough to win?
                if ((rand() % 1000) < odds) {
                    //they win, change owner!
                    fprintf(stderr, "WIN, change owner\n");
					
					//update winner
					owner = find_owner(p->oid);
					owner->wins++;
					
					owner = find_owner(board[row][col].oid);
					owner->loses++;
					
					strcpy(board[row][col].oid, p->oid);
					strcpy(board[row][col].cost, "1f4");
					
                    //TODO: for the user who lost, update their lose count
                    //TODO: for the user who won, update their win count
                }
            }
        }
    }
	
	struct summary *s;
	FILE *fp = fdopen(sock, "w+");
	
	for (s = sumhead.tqh_first; s != NULL; s = s->summaries.tqe_next)
		fprintf(fp, "%s,%u,%u|", s->oid, s->wins, s->loses);

	while (sumhead.tqh_first != NULL)
		TAILQ_REMOVE(&sumhead, sumhead.tqh_first, summaries);
	
	fflush(fp);
}

/* find the summary struct or create another */
struct summary*
find_owner(char *oid)
{
	struct summary *s;
	fprintf(stderr, "%s\n", oid);

	for (s = sumhead.tqh_first; s != NULL; s = s->summaries.tqe_next)
		if (!strcmp(s->oid, oid))
			return s;
	
	s = xmalloc(sizeof(struct summary));
	strcpy(s->oid, oid);
	s->wins = 0;
	s->loses = 0;

	TAILQ_INSERT_TAIL(&sumhead, s, summaries);

	return s;
}

/* parse PQL command from the web server */
int
parse_query(int sock, char *qry, struct pixel **board)
{
	int *c = NULL, *cp;
	FILE *f;
	char *s = NULL,  *qp, timestamp[32], *key, *value;
	struct pixel *bp;
	struct journal *jp;

	if (qry[0] == 'l') {
		f = fdopen(sock, "r+");
		for (jp = head.tqh_first; jp != NULL; jp = jp->entries.tqe_next) {
			fprintf(stderr, "journal: %ld %ld\n", atol(qry + 2), atol(jp->timestamp));
			if (atol(qry + 2) <= atol(jp->timestamp))
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
		printf("METADATA\n");
		cp = c = extract_pixels(qry);

		key = xmalloc(strlen(qry));
		value = xmalloc(strlen(qry));

		while(*cp != -1) {
			bp = &board[*cp][*(cp+1)];	
			sscanf(qp + 2, "%s %s", key, value);
			
			if (!strcmp("immunity", key))
				bp->immunity = value[0];

			cp += 2;
		}

		free(key);
		free(value);
	}

	if (c != NULL)
		free(c);
	if (c != NULL)
		free(s);

	return 1;
}

int 
*extract_pixels(char *qry)
{
	char *s, *p, *orig;
	int i, n, *coods;

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
			if (sscanf(p, "%d,%d", &coods[i], &coods[i+1]) < 2)
				goto finish;
			i += 2;
			p = s+1;
		}
	}
	s = '\0';
	sscanf(p, "%d,%d", &coods[i], &coods[i+1]);
	i += 2;

finish:
	coods[i] = -1;
	free(orig);
	return coods;
}
