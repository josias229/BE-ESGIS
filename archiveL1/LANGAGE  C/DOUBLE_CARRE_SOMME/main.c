#include <stdio.h>
#include <stdlib.h>

int main()
{
    float nbr1, nbr2, nbr3, somme, double1, double2, double3, moyenne, difference, produit;

    printf("Entrez les trois nombres : ");
    scanf("%f %f %f", &nbr1, &nbr2, &nbr3);

    somme = nbr1 + nbr2 + nbr3;

    moyenne = somme / 3;

    difference = nbr1 - nbr2 - nbr3;

    produit = nbr1 * nbr2 * nbr3;

    printf("Le double de %f est %f \n", nbr1, (nbr1 * 2));

    printf("Le double de %f est %f \n", nbr2, (nbr2 * 2));

    printf("Le double de %f est %f \n", nbr3, (nbr3 * 2));

    printf("Le carre de %f est %f \n", nbr1, (nbr1 * nbr1));

    printf("Le carre de %f est %f \n", nbr2, (nbr2 * nbr2));

    printf("Le carre de %f est %f \n", nbr3, (nbr3 * nbr3));

    printf("Le cube de %f est %f \n", nbr1, (nbr1 * nbr1 * nbr1));

    printf("Le cube de %f est %f \n", nbr2, (nbr2 * nbr2 * nbr2));

    printf("Le cube de %f est %f \n", nbr3, (nbr3 * nbr3 * nbr3));

    printf("La somme des trois nombres est %f, leur difference est %f et leur produit est %f", somme, difference, produit);

    return 0;

}
