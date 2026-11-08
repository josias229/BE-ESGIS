#include <stdio.h>
#include <stdlib.h>

int main()
{
    int note;
    printf("Entrez la note : ");
    scanf("%d", &note);
    if(note < 0 || note > 20){
        printf("Note invalide");
    }
    else if(note < 10){
        printf("Note mediocre !");
    }
    else if(note < 12){
        printf("Mention passable !");
    }
    else if(note < 14){
        printf("Mention Assez-Bien !");
    }
    else if(note < 16){
        printf("Mention Bien !");
    }
    else if(note < 18){
        printf("Mention Tres-Bien !");
    }
    else{
        printf("Mention Excellent !");
    }
}
