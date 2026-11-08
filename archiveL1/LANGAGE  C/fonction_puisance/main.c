#include <stdio.h>
#include <stdlib.h>

int puissance(int base, int exposant)
{
    int cpt, result;
    result = 1;
    for(cpt = 0; cpt < exposant; cpt++)
    {
        result = result * base;
    }

    return result;
}

int main()
{
    int base, exposant, result;
    printf("Entrez un nombre : ");
    scanf("%d", &base);

    printf("Entrez un nombre : ");
    scanf("%d", &exposant);

    result = puissance(base, exposant);

    printf("%d exposant %d egale %d", base, exposant, result);
}
