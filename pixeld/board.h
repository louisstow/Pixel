#include <sys/queue.h>


#define COLOUR_SIZE 	6
#define COST_SIZE 	3
#define OID_SIZE	4

#define ROWS		1000
#define COLS		1200

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

int *extract_pixels(char *qry);
void init_journal(void);
int parse_query(int sock, char *qry, struct pixel **board);
struct pixel  **init_board(unsigned int rows, unsigned int cols);
struct summary* find_owner(char *oid);
void run_cron(int s, struct pixel **board);
