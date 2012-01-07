CC=gcc

pixeld: pixeld.o board.o net.o
	$(CC) -o pixeld pixeld.o board.o net.o

test: pixeld.o board.o net.o test.o
	$(CC) -o test test.o board.o net.o test.o

test.o: test.c
	gcc -c test.c

pixeld.o: pixeld.c
	gcc -c pixeld.c

board.o: board.c
	gcc -c board.c

net.o: net.c
	gcc -c net.c

clean:
	rm -rf *.o pixeld test
