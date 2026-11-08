#include <stdio.h>
#include <stdlib.h>

int somme(int a, int b){
    int resultat_somme =  a + b;
    return resultat_somme;
}

int main()
{
    int nbr1, nbr2, result;
    printf("Entrez un nombre : ");
    scanf("%d", &nbr1);
    printf("Entrez un nombre : ");
    scanf("%d", &nbr2);
    result = somme(nbr1, nbr2);
    printf("La somme de %d et de %d est %d", nbr1, nbr2, result);
}
