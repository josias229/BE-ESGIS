#include <stdio.h>
#include <stdlib.h>

int main()
{

    float ancien_index, new_index, TVA, prix, montant_a_payer;
    printf("Entrez l'ancien index du compteur : ");
    scanf("%f", &ancien_index);

    printf("Entrez le nouveau index : ");
    scanf("%f", &new_index);

    printf("Entrez le prix du KW : ");
    scanf("%f", &prix);

    montant_a_payer = (new_index - ancien_index) * prix;

    montant_a_payer = montant_a_payer + (montant_a_payer * 20 / 100);

    printf("Le montant de la facture est : %f F !", montant_a_payer);
}
