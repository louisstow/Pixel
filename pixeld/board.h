#include <sys/queue.h>


#define COLOUR_SIZE 	6
#define COST_SIZE 	3
#define OID_SIZE	4

#define ROWS		1200	
#define COLS		1000

struct pixel {
	char colour[COLOUR_SIZE + 1];
	char cost[COST_SIZE + 1];
	char oid[OID_SIZE + 1];
	struct metadata *mdata;
};

struct metadata {
	struct pixel *pixel;
	char immunity;
};

struct journal {
	char *timestamp;
	char *query;
	TAILQ_ENTRY(journal) entries;
};

struct summary {
    char oid[OID_SIZE + 1];
    unsigned int wins;
    unsigned int loses;
    
    TAILQ_ENTRY(summary) summaries;
};

void init_journal(void);
int *extract_pixels(char *qry);
int read_board(struct pixel **bp);
int parse_query(int sock, char *qry, struct pixel **board);
struct pixel  **init_board(unsigned int rows, unsigned int cols);
struct summary* find_owner(char *oid);
void run_cron(int s, struct pixel **board);
void init_metadata(struct pixel **board, unsigned int rows, unsigned int cols);
