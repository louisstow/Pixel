#define RED		0
#define GREEN	1
#define BLUE	2

#define get_dominant(r,g,b) (\
							(r > g && r > b ? RED : \
							(g > r && g > b ? GREEN : \
							(b > g && b > r ? BLUE : \
								(r == b && r == g ? \
									(rand() % 3)\
								: \
								(r == b ? (rand() % 2 == 0 ? RED : BLUE)\
								:\
								(r == g ? (rand() % 2 == 0 ? RED : GREEN)\
								:\
								(g == b ? (rand() % 2 == 0 ? GREEN : BLUE)\
								:\
								RED\
								))))\
							))))

void 
run_cycle(struct pixel **b) {
	struct pixel *p, *o;
	unsigned int i, j, k, row, col;
	
	//search a 1 pixel radius
	int circle[8][2] = {
		{-1, -1},
		{-1, 0},
		{-1, 1},
		{0, -1},
		{0, 1},
		{1, -1},
		{1, 0},
		{1, 1}
	};
	
	unsigned int color, r, g, b, dominant; //player colors
	unsigned int ocolor, or, og, ob, odominant; //opponent colors
	unsigned int odds = 0;
	
	srand(time(NULL));

	for (i = 0; i < ROWS; i++) {
		for (j = 0; j < COLS; j++) {
			p = &b[i][j];
			
			if (p->colour[0] == '.') {
				continue;
			}
			
			//extract colour channels
			color = atoi(p->colour);
			r = (color & 0xFF0000) >> 16;
			g = (color & 0x00FF00) >> 8;
			b = (color & 0x0000FF);
			
			dominant = get_dominant(r, g, b);
			
			for (k = 0; k < 8; k++) {
				//apply the direction
				row = i + circle[k][0];
				col = j + circle[k][1];
				
				//if the pixel is out of bounds
				if (row < 0 || col < 0 || row > ROWS || col > COLS)
					continue;
				
				o = &b[row][col];
				
				//skip the pixel if not exists
				if (o->colour[0] == '.') {
					continue;
				}
				
				//extract opponent colors
				ocolor = atoi(p->colour);
				or = (ocolor & 0xFF0000) >> 16;
				og = (ocolor & 0x00FF00) >> 8;
				ob = (ocolor & 0x0000FF);
				
				odominant = get_dominant(or, og, ob);
				
				//if the players dominant color beats the opponent
				if(dominant == RED && odominant == GREEN ||
				   dominant == GREEN && odominant == BLUE ||
				   dominant == BLUE && odominant == RED) {
				 
					odds += 600;
				}
				
				//reward brighter colours
				if (dominant == RED) {
					odds += (r - g) + (r - b);
				} else if (dominant == GREEN) {
					odds += (g - r) + (g - b);
				} else if (dominant == BLUE) {
					odds += (b - r) + (b - g);
				}
				
				//are they lucky enough to win?
				if ((rand() % 1000) < odds) {
					//they win, change owner!
					(b[row][col])->owner = p->owner;
				}
			}
		}
	}
}