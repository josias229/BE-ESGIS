#include <stdio.h>
#include <stdlib.h>

int main()
{
    float a, b, c, xo, x1, x2, delta;

    printf("Entrez les coefficients a b et c de l'equation \n");
    scanf("%f %f %f", &a, &b, &c);

    if(a == 0){
        if(b == 0){
            if(c == 0){
                printf("L'equation n'a pas de solution");
            }
        }
        else{
            xo = c / b;
            printf("L'equation admet une solution dans R : %f", xo);
        }
    }
    else{
        delta = (b * b) - (4 * a * c);
        if(delta < 0){
            printf("L'equation n'admet pas de solution dans R");
        }
        else if(delta == 0){
            xo = (-b / (2 * a));
            printf("L'equation admet une solution unique xo dans R : xo = %f", xo);
        }
        else{
            x1 = (-b - sqrt(delta)) / ( 2 * a);
            x2 = (-b + sqrt(delta)) / ( 2 * a);

            printf("L'equation admet deux solutions distinctes dans R : x1 = %f et x2 = %f", x1, x2);
        }
    }
}
