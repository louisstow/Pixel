CC=gcc

pixeld: pixeld.o board.o
	$(CC) -lrt -O2 -o pixeld pixeld.o board.o 

test: pixeld.o board.o net.o test.o
	$(CC) -o test test.o board.o test.o

test.o: test.c
	gcc -Wall -O2 -c test.c

pixeld.o: pixeld.c
	gcc -Wall -O2 -c pixeld.c

board.o: board.c
	gcc -lrt -Wall -O2 -c board.c

clean:
	rm -rf *.o pixeld test
