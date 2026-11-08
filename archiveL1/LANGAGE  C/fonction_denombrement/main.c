#include <stdio.h>
#include <stdlib.h>

long factorielle(long a)
{
    long result_fact, cpt;
    cpt = 1;
    result_fact = 1;
    if((a == 0) || (a == 1)){
        result_fact = 1;
    }
    else
    {
        do{
            result_fact = result_fact * cpt;
            cpt++;
        }while(cpt <= a);
    }

    return result_fact;
}

int main()
{
    long p, n, arrangement, combinaison;

    do{
        printf("Entrez le nombre p : ");
        scanf("%ld", &p);
    }while(p < 0);

    do{
        printf("Entrez le nombre n : ");
        scanf("%ld", &n);
;    }while(n < 0);

    arrangement = (factorielle(n)/factorielle(n-p));

    combinaison = (factorielle(n)/(factorielle(p)*factorielle(n-p)));

    printf("Nombres d'arrangement de %ld elements pris parmi %ld elements est %ld\n\n", p, n, arrangement);
    printf("Nombres de combinaison de %ld elements pris parmi %ld elements est %ld\n", p, n, combinaison);
}
