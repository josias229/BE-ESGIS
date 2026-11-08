function createColor(){

    let couleur = '#';

    for(i = 0; i < 6; i++){
        let valeur = Math.floor(Math.random() * 16);
        if(valeur >= 10 && valeur <= 16){
        switch (valeur){
            case 10 : valeur = 'A';
            break;
            case 11 : valeur = 'B';
            break;
            case 12 : valeur = 'C';
            break;
            case 13 : valeur = 'D';
            break;
            case 14 : valeur = 'E';
            break;
            case 15 : valeur = 'F';
            break;
            }
        }
    couleur = couleur + valeur;
    }
    return couleur;
}


function genereCouleur(){
    let couleur1 = createColor();

    /*console.log(couleur)*/

    let div1 = document.getElementById('case1');

    div1.style.backgroundColor = couleur1;
    div1.style.transition = '';

    document.getElementById('col1').innerHTML = couleur1;

    let couleur2 = createColor();

    while(couleur2 === couleur1){
        couleur2 = createColor();
    }

    let div2 = document.getElementById('case2');

    
    div2.style.backgroundColor = couleur2;
    div2.style.transition = '';
    document.getElementById('col2').innerHTML = couleur2;

    couleur3 = createColor();

    while(couleur3 === couleur2 || couleur3 === couleur1){
        couleur3 = createColor();
    }

    div3 = document.getElementById('case3');

    div3.style.backgroundColor = couleur3;
    div3.style.transition = '';
    document.getElementById('col3').innerHTML = couleur3;

}

document.getElementById('button').addEventListener('click', genereCouleur);