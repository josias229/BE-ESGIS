function verify(event, id1, id2){
    const input = document.getElementById(id1).value;
    const errorMessage = document.getElementById(id2);
    if(input.trim() === ''){
        event.preventDefault();
        errorMessage.textContent = 'Ce champ doit être rempli';
        errorMessage.style.display = 'block';
        document.getElementById(id1).style.border = '1px solid red';
    }
    else{
        errorMessage.style.display = 'none';
        document.getElementById(id1).style.border = '1px solid black';
    }
}

/*function verifymail(event, id1, id2){
    const input = document.getElementById(id1).value;
    const errorMessage = document.getElementById(id2);
    if(input.trim() === ''){
        event.preventDefault();
        errorMessage.textContent = 'Ce champ doit être rempli';
        errorMessage.style.display = 'block';
        document.getElementById(id1).style.border = '1px solid red';
    }
    else if(input.trim() === ''){
        function validmail(email){
            const regex = /^[^\s@]+@[^\s@]+$/
            return regex.test(email);
        }
        const input = document.getElementById(id1).value;
        const errorMessage = document.getElementById(id2);

        if(!verifymail(input)){
            errorMessage.textContent = 'Adresse mail invalide';
            errorMessage.style.display = 'block';
            document.getElementById(id1).style.border = '1px solid red';
        }
    }
    else{
        errorMessage.style.display = 'none';
        document.getElementById(id1).style.border = '1px solid black';
    }
}*/

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'nom', 'nom_error');
})

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'prenom', 'prenom_error');
})

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'age', 'age_error');
})

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'sujet', 'sujet_error');
})

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'demande', 'demande_error');
})

document.getElementById('myForm').addEventListener('submit', function(event){
    verify(event, 'mail', 'mail_error');
})


document.getElementById('myForm').addEventListener('submit', function(event){
    const input = document.getElementsByName('contacter');
    let select = false;

    for(i = 0; i < input.length; i++){
        if(input[i].checked){
            select = true;
            break
        }
    }

    if(!select){
        event.preventDefault();
        const errorMessage = document.getElementById('contacter_error');
        errorMessage.textContent = 'Veuiillez sélectionner une option';
        errorMessage.style.display = 'block';
    }else{
        document.getElementById('contacter_error').style.display = 'none';
    }
    
})

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