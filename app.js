//1.State
let currentLocation = "";

//2. DOM elements (elements from the html)
const screenLocation = document.getElementById('screen-location');
const screenApp = document.getElementById('screen-app');
const locationButtons = document.querySelectorAll('.btn-location');
const listLocationLabel = document.getElementById('list-location-label');

const navButtons = document.querySelectorAll('.nav-btn');

//3. Event Listeners
    // Change your locationButton variable (which is a list of buttons) to use forEach:
    locationButtons.forEach(button => {
        button.addEventListener('click', (event) => {

            //event.target is the specific location button that was clicked
            currentLocation = event.target.getAttribute('data-location');

            listLocationLabel.textContent = currentLocation.toUpperCase();

            screenLocation.classList.remove('active');
            screenLocation.classList.add('hidden');

            screenApp.classList.remove('hidden');
            screenApp.classList.add('active');

        });
    });
