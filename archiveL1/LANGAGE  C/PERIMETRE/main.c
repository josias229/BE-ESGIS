#include <stdio.h>
#include <stdlib.h>

int perimetre(int longueur, int largeur)
    {
        int result;
        result = (longueur + largeur) * 2;
        return result;
    }


int main()
{
    int lon, larg, peri;
    printf("Entrez la longueur et la largeur : ");
    scanf("%d %d", &lon, &larg);
    peri = perimetre(lon, larg);
    printf("Le perimetre est : %d", peri);
}
