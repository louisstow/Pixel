CC=gcc

pixeld: pixeld.o board.o
	$(CC) -o pixeld pixeld.o board.o 

test: pixeld.o board.o net.o test.o
	$(CC) -o test test.o board.o test.o

test.o: test.c
	gcc -c test.c

pixeld.o: pixeld.c
	gcc -c pixeld.c

board.o: board.c
	gcc -c board.c

clean:
	rm -rf *.o pixeld test
