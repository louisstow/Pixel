CC=gcc

pixeld: pixeld.o board.o net.o
	$(CC) -o pixeld pixeld.o board.o net.o

test: pixeld.o board.o net.o test.o
	$(CC) -o test test.o board.o net.o test.o

test.o:
	gcc -c test.o

pixeld.o:
	gcc -c pixeld.c

board.o:
	gcc -c board.c

net.o:
	gcc -c net.c

clean:
	rm -rf *.o pixeld test
