#include <stdio.h>
#include <stdlib.h>

int main()
{
    int annee_naissance, annee_actuelle, age;
    printf("Entrez l'annee de naissance : ");
    scanf("%d", &annee_naissance);

    printf("Entrez l'annee en cours : ");
    scanf("%d", &annee_actuelle);

    age = annee_actuelle - annee_naissance;

    printf("Vous avez %d ans.");
}
