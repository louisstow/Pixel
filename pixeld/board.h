#define COLOUR_SIZE 	6
#define COST_SIZE 	3
#define OID_SIZE	4

struct pixel {
	char colour[COLOUR_SIZE];
	char cost[COST_SIZE];
	char oid[OID_SIZE];
};

int *extract_pixels(char *qry);
int parse_query(int sock, char *qry, struct pixel **board);
struct pixel  **init_board(unsigned int rows, unsigned int cols);
