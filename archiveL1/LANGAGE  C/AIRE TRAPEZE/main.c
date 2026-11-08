#include <stdio.h>
#include <stdlib.h>

int main()
{
    float gbase, pbase, aire;

    printf("Entrez la longueur de la grande base et de la petite base : ");
    scanf("%f %f", &gbase, &pbase);

    aire = (gbase * pbase) / 2;

    printf("L\'aire du trapèze est : %f.", aire);
}
