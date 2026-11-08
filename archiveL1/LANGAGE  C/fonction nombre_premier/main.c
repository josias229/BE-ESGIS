#include <stdio.h>
#include <stdlib.h>

int nombre_premier(int n)
{
    int i, reste, cpt, result;
    cpt = 0;
    for(i = 1; i <= n; i++)
    {
        reste = n%i;
        if(reste == 0)
        {
            cpt++;
        }
    }

    if(cpt == 2)
    {
        result = 1;
    }
    else{
        result = 0;
    }

    return result;
}

int main()
{
    int nbr, result;
    printf("Entrez un nombre : ");
    scanf("%d", &nbr);
    result = nombre_premier(nbr);
    printf("Le resultat est %d", result);
}
