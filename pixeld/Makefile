CC=gcc

pixeld: pixeld.o board.o
	$(CC) -lrt -g -o pixeld pixeld.o board.o 

test: pixeld.o board.o net.o test.o
	$(CC) -o test test.o board.o test.o

test.o: test.c
	gcc -Wall -g -c test.c

pixeld.o: pixeld.c
	gcc -Wall -g -c pixeld.c

board.o: board.c
	gcc -lrt -Wall -g -c board.c

clean:
	rm -rf *.o pixeld test
