#include <stdio.h>
#include <stdlib.h>

int main()
{
    int val_abs, nbr;

    printf("Entrez un nombre : ");
    scanf("%d", &nbr);
    if(nbr > 0){
        val_abs = nbr;
    }
    else{
        val_abs = -nbr;
    }

    printf("La valeur absolue du nombre %d est %d.\n", nbr, val_abs);
}
