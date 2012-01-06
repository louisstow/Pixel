#include <sys/types.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <string.h>
#include <sys/socket.h>
#include <netdb.h>

#include "net.h"

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
