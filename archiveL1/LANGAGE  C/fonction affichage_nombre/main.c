#include <stdio.h>
#include <stdlib.h>

void afficherNombre(int a, int b)
{
    int i, cpt;
    if(b > 0)
    {
        cpt = a/b;
        for(i = 0; i < cpt; i++)
        {
            printf("0");
        }
    }
    printf("%d", a);
}

int main()
{
    int a, b;
    printf("Entrez le nombre entier a afficher : ");
    scanf("%d", &a);

    printf("Entrez le nombre de chiffres : ");
    scanf("%d", &b);
    afficherNombre(a, b);
}
