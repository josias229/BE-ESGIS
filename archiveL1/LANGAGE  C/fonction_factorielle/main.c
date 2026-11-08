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
    long a, result;
    do{
        printf("Entrez un nombre : ");
        scanf("%ld", &a);
    }while(a < 0);
    result = factorielle(a);
    printf("La factorielle du nombre %ld est %ld", a, result);
}
