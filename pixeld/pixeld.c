#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <arpa/inet.h>
#include <sys/wait.h>
#include <signal.h>

#include "net.h"
#include "board.h"

#define BUF_SIZE 4096

void 
*xmalloc(size_t size)
{
	void *p;

	if ((p = malloc(size)) == NULL) {
		perror("malloc");
		exit(-1);
	}

	return p; 
}

int 
main(int argc, char *argv[])
{
	char *buf;
	int fd, sock, r;
	socklen_t sin_size;
	struct pixel **board;
	struct sockaddr_storage r_addr;

	buf = xmalloc(BUF_SIZE);
	sock = create_listen("5607");
	board = init_board(1000, 1200);

	for(;;) {
		sin_size = sizeof r_addr;
		fd = accept(sock, (struct sockaddr *)&r_addr, &sin_size);

		if (fd == -1) {
			perror("accept");
			continue;
		}
		fprintf(stderr, "got connection from www\n");

		if ((r = recv(fd, buf, 127, 0)) == -1) {
			close(fd);
			continue;
		}
		if (r >= BUF_SIZE) {
			close(fd);
			continue;
		}

		buf[r] = '\0';
		parse_query(fd, buf, board);
		fprintf(stderr, "finished\n");
		close(fd);
	}
}
