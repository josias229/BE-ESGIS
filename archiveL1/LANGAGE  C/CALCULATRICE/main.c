#include <stdio.h>
#include <stdlib.h>

int main()
{
    float nbr1, nbr2, result;
    char operateur;

    printf("Entrez le premier nombre : ");
    scanf("%f", &nbr1);

    printf("Entrez l'operateur (+, -, * ou /)");
    operateur = getche();

    printf("Entrez le second nombre : ");
    scanf("%f", &nbr2);

    switch(operateur){
        case '+': result = nbr1 + nbr2;
        printf("%f + %f = %f", nbr1, nbr2, result);
        break;
        case '-': result = nbr1 - nbr2;
        printf("%f - %f = %f", nbr1, nbr2, result);
        break;
        case '*': result = nbr1 * nbr2;
        printf("%f * %f = %f", nbr1, nbr2, result);
        break;
        case '/': result = nbr1/nbr2;
        printf("%f / %f = %f", nbr1, nbr2, result);
        break;
    }
}
