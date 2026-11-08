#include <stdio.h>
#include <stdlib.h>

int main()
{
    float tempC, tempF;

    printf("Entrez la temperature en degre : ");
    scanf("%f", &tempC);

    tempF = ((tempC * 9) / 5) + 32;

    printf("La temperature en Farad est : %f", tempF);
}
