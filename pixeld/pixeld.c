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

#include "pixeld.h"
#include "board.h"

#define BUF_SIZE 4096

int
create_listen(char *port)
{
	int sfd, s;
	struct addrinfo hints;
	struct addrinfo *result, *rp;
	struct sockaddr_storage peer_addr;
	socklen_t l;

	memset(&hints, 0, sizeof(struct addrinfo));
	hints.ai_family = AF_UNSPEC;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_flags = AI_PASSIVE;
	hints.ai_protocol = 0;
	hints.ai_canonname = NULL;
	hints.ai_addr = NULL;
	hints.ai_next = NULL;

	s = getaddrinfo(NULL, port, &hints, &result);
	if (s)
		return -1;
	
	for (rp = result; rp != NULL; rp = rp->ai_next) {
		sfd = socket(rp->ai_family, rp->ai_socktype,
		            rp->ai_protocol);
		if (sfd == -1)
			continue;
		if (bind(sfd, rp->ai_addr, rp->ai_addrlen) == 0)
			break;

		close(sfd);
	}

	if (rp == NULL)
		return -1;
	
	freeaddrinfo(result);

	if (listen(sfd, 5) == -1) {
		perror("listen");
		return -1;
	}

	return sfd;
}

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
	char buf[BUF_SIZE];
	int fd, sock, r;
	socklen_t sin_size;
	struct pixel **board;
	struct journal **j;
	struct sockaddr_storage r_addr;

	sock = create_listen("5607");
	board = init_board(1000, 1200);
	init_journal();

	for(;;) {
		sin_size = sizeof r_addr;
		fd = accept(sock, (struct sockaddr *)&r_addr, &sin_size);

		if (fd == -1) {
			perror("accept");
			continue;
		}
		fprintf(stderr, "got connection from www\n");

		if ((r = recv(fd, buf, sizeof(buf), 0)) == -1) {
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
