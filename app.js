//1.State (date)
let currentLocation = localStorage.getItem('lastLocation') || "";
let currentRestockList = JSON.parse(localStorage.getItem('shopRestockList'))||[];
let currentFridge = null;

//{} are classes with inside an [] array
let defaultInventory = {
    aarschot: [],
    mechelen: []
};

// Load from memory, OR use the default empty arrays if memory is null
let inventoryData = JSON.parse(localStorage.getItem('shopInventory')) || defaultInventory;

let historyData = JSON.parse(localStorage.getItem('shopHistory')) || [];


//2. DOM elements (elements from the html)
const screenLocation = document.getElementById('screen-location');
const screenApp = document.getElementById('screen-app');
const locationButtons = document.querySelectorAll('.btn-location');
const listLocationLabel = document.getElementById('list-location-label');

const navButtons = document.querySelectorAll('.nav-btn');

const fridgeListUI = document.getElementById('fridge-list');

const viewFridges = document.getElementById('view-fridges');
const viewFridgeDetail = document.getElementById('view-fridge-detail');
const currentFridgeName = document.getElementById('current-fridge-name');
const itemListUI = document.getElementById('item-list');
const btnBack = document.getElementById('btn-back');

const viewCurrentList = document.getElementById('view-current-list');
const viewHistory = document.getElementById('view-history');
const masterListUI = document.getElementById('master-list');
const listDateUI = document.getElementById('list-date');

const btnAddFridge = document.getElementById('btn-add-fridge');

const btnAddItem = document.getElementById('btn-add-item');

const historyListUI = document.getElementById('history-list');
const btnFinishList = document.getElementById('btn-finish-list');

const btnSwitchLocation = document.getElementById('btn-switch-location');

//3. Event Listeners
    locationButtons.forEach(button => {
        button.addEventListener('click', (event) => {

            //event.target is the specific location button that was clicked
            let clickedLocation = event.currentTarget.getAttribute('data-location');

            // 2. THE FIX: If this button doesn't have a data-location (like the Finish button), stop this specific function immediately!
            if (!clickedLocation) return;

            currentLocation = clickedLocation;

            localStorage.setItem('lastLocation', currentLocation);

            renderFridges(currentLocation);

            listLocationLabel.textContent = currentLocation.toUpperCase();

            screenLocation.classList.remove('active');
            screenLocation.classList.add('hidden');

            screenApp.classList.remove('hidden');
            screenApp.classList.add('active');

        });
    });

    btnBack.addEventListener('click', () => {

        viewFridgeDetail.classList.remove('active');
        viewFridgeDetail.classList.add('hidden');
        viewFridges.classList.remove('hidden');
        viewFridges.classList.add('active');

        btnBack.classList.add('hidden');
    })

navButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        // 1. Remove the 'active' class from ALL nav buttons so they look unselected
        navButtons.forEach(btn => btn.classList.remove('active'));

        // 2. Add 'active' class to the specific button that was clicked
        event.target.classList.add('active');

        // 3. Get the ID of the view we want to show (stored in data-target)
        const targetViewId = event.target.getAttribute('data-target');

        // 4. Hide all main views first
        viewFridges.classList.add('hidden');
        viewFridges.classList.remove('active');

        viewFridgeDetail.classList.add('hidden');
        viewFridgeDetail.classList.remove('active');

        viewCurrentList.classList.add('hidden');
        viewCurrentList.classList.remove('active');

        viewHistory.classList.add('hidden');
        viewHistory.classList.remove('active');

        // 5. Hide the back button anytime we switch tabs
        btnBack.classList.add('hidden');

        // 6. Show the specific view that was requested
        document.getElementById(targetViewId).classList.remove('hidden');
        document.getElementById(targetViewId).classList.add('active');

        // 7. If the user clicked the "Current List" tab, we need to run a function to draw the list!

        // If it is, call a function named: renderCurrentList();
        if(targetViewId == 'view-current-list') {
            renderCurrentList();
        }
        if(targetViewId == 'view-history') {
            renderHistory();
        }

    });
});

btnSwitchLocation.addEventListener('click', () => {
    // 1. Hide the main app screen
    screenApp.classList.remove('active');
    screenApp.classList.add('hidden');

    // 2. Show the location selection screen
    screenLocation.classList.remove('hidden');
    screenLocation.classList.add('active');
});

btnAddFridge.addEventListener('click', () => {
    // 1. Ask the user for a name
    const fridgeName = prompt("Enter the name of the new fridge:");

    // 2. If they hit cancel or typed nothing, stop the function
    if (!fridgeName) return;

    // 3. Create the new fridge object
    const newFridge = {
        id: "fridge-" + Date.now(), // Creates a unique ID based on the exact millisecond!
        name: fridgeName,
        items: [] // Starts with no drinks
    };

    // 4. Push it into the correct location array
    inventoryData[currentLocation].push(newFridge);

    // 5. Save and redraw the screen
    saveInventoryLocally();
    renderFridges(currentLocation);
});

btnAddItem.addEventListener('click', () => {
    // 1. Safety check: Make sure a fridge is actually open
    if (!currentFridge) return;

    // 2. Ask for the details
    const itemName = prompt("Enter the drink name (e.g., Lipton Ice Tea):");
    if (!itemName) return;

    const itemPrice = prompt("Enter the price (e.g., 2.50):");
    if (!itemPrice) return;

    // 3. Create the new item object
    const newItem = {
        id: "item-" + Date.now(),
        name: itemName,
        // parseFloat turns a string into a decimal, toFixed(2) forces 2 decimal places
        price: parseFloat(itemPrice.replace(',', '.')).toFixed(2)
    };

    // 4. Push it into the currently open fridge
    currentFridge.items.push(newItem);

    // 5. Save the whole inventory and redraw the screen!
    saveInventoryLocally();
    openFridge(currentFridge);
});

btnFinishList.addEventListener('click', () => {
    // 1. Don't save empty lists
    if (currentRestockList.length === 0) {
        alert("The list is empty!");
        return;
    }


    // 2. Package the current list into a history object
    const savedList = {
        id: "history-" + Date.now(),
        date: new Date().toLocaleString(),
        location: currentLocation.toUpperCase(),
        items: [...currentRestockList] // Creates a hard copy of the array
    };

    // 3. Push it to the front of the history array (.unshift puts it at the top)
    historyData.unshift(savedList);

    if (historyData.length > 5) {
        historyData.pop();
    }

    // 4. Clear the current list
    currentRestockList = [];

    // 5. Save everything to localStorage
    saveListLocally();
    localStorage.setItem('shopHistory', JSON.stringify(historyData));

    // 6. Redraw the UI
    renderCurrentList();
    alert("List saved to history!");
});

// 4. FUNCTIONS

function renderFridges(locationKey) {
    if (!locationKey) return;
    // 1. Clear out any old fridges from the screen just in case
    fridgeListUI.innerHTML = "";

    // 2. Grab the array of fridges for the selected location from our data object
    const fridges = inventoryData[locationKey];

    // 3. Write a .forEach() loop that goes through the 'fridges' array.
    fridges.forEach(fridge => {
        let li = document.createElement("li");
        li.className = 'fridge-item-btn';

        //innerHTML is used to create the text AND a tiny delete button inside the li
        li.innerHTML = `
            <span>${fridge.name}</span>
            <button class="btn-delete" style="float: right; color: red;">X</button>
        `;

        // Make the whole li open the fridge
        li.addEventListener('click', () => {
            openFridge(fridge);
        });

        // NEW: Grab the specific delete button
        const deleteBtn = li.querySelector('.btn-delete');

        deleteBtn.addEventListener('click', (event) => {
            // his prevents the 'li' click listener from running
            event.stopPropagation();

            // Confirm they actually want to delete it
            if (confirm("Are you sure you want to delete this fridge and all its items?")) {

                // Filter it out of the array
                inventoryData[currentLocation] = inventoryData[currentLocation].filter(f => f.id !== fridge.id);

                // Save and redraw
                saveInventoryLocally();
                renderFridges(currentLocation);
            }
        });
        fridgeListUI.appendChild(li);
    });
}

function openFridge(fridge) {
    // 1. Update the header title so the user knows where they are
    currentFridge = fridge;
    currentFridgeName.textContent = fridge.name;

    viewFridges.classList.remove('active');
    viewFridges.classList.add('hidden');
    viewFridgeDetail.classList.remove('hidden');
    viewFridgeDetail.classList.add('active');
    btnBack.classList.remove('hidden');

    // 5. Clear the old items out of the UI list just in case
    // Inside your openFridge function:
    itemListUI.innerHTML = "";

    fridge.items.forEach(item => {
        let li = document.createElement("li");
        li.className = 'fridge-item-btn';

        li.innerHTML = `
            <span>${item.name} - €${item.price}</span>
            <button class="btn-delete-item" style="float: right; color: red;">X</button>
        `;

        li.addEventListener('click', () => {

            // 1. Search the master list to see if an item with this ID already exists
            // This reads as: "Find a listItem where the listItem's ID matches the clicked item's ID"
            let existingItem = currentRestockList.find(listItem => listItem.id === item.id);

            if (existingItem) {
                // 2. The item is already in the list! Just increase its quantity property by 1.
                existingItem.quantity += 1;

            } else {
                // 4. It's not in the list yet. Create a new 'quantity' property on the item and set it to 1.
                item.quantity = 1;
                currentRestockList.push(item);
            }

            // 2. Update the UI safely by targeting ONLY the span, leaving the X button alone!
            li.querySelector('span').textContent = "✅ " + (existingItem ? existingItem.quantity : 1) + "x " + item.name;
            li.classList.add('selected');

            // Print to console to verify!
            console.log(currentRestockList);
            saveListLocally();

        });

        const deleteBtn = li.querySelector('.btn-delete-item');
        deleteBtn.addEventListener('click', (event) => {

            //Prevents adding the item to the shopping list
            event.stopPropagation();

            if (confirm(`Delete
            ${item.name} from this fridge permanently?`)) {
                // Filter it out of the current fridge's items array
                currentFridge.items = currentFridge.items.filter(i => i.id !== item.id);

                // Save and redraw
                saveInventoryLocally();
                openFridge(currentFridge);
            }
        });

        itemListUI.appendChild(li);
    });

}

function renderCurrentList() {
    // 1. Clear the UI list
    masterListUI.innerHTML = "";

    // 2. Set today's date in the UI
    const today = new Date();
    listDateUI.textContent = today.toLocaleDateString();

    // 3. If the array is empty, show a friendly message
    if (currentRestockList.length === 0) {
        masterListUI.innerHTML = "<p>Your restock list is empty.</p>";
        return;
    }

    currentRestockList.forEach(restock => {
        let li = document.createElement("li");
        li.textContent = restock.quantity + "x " + restock.name;
        li.className = 'fridge-item-btn';

        li.addEventListener('click', () => {

            // 1. Subtract 1 from the quantity
            restock.quantity -= 1;

            // 2. Check if the quantity is now 0
            if (restock.quantity === 0) {
                currentRestockList = currentRestockList.filter(item => item.id !== restock.id);
            }

            renderCurrentList()
            saveListLocally();
        });

        masterListUI.appendChild(li);
    });

}
function saveListLocally(){
    localStorage.setItem('shopRestockList', JSON.stringify(currentRestockList));
}

// --- PWA SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('ServiceWorker registered successfully!');
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

function saveInventoryLocally() {
    localStorage.setItem('shopInventory', JSON.stringify(inventoryData));
}

function renderHistory() {
    historyListUI.innerHTML = "";

    if (historyData.length === 0) {
        historyListUI.innerHTML = "<p>No previous lists found.</p>";
        return;
    }

    historyData.forEach(historicalList => {
        let li = document.createElement("li");
        li.className = 'fridge-item-btn';

        // Add the date and location as a bold header
        let htmlContent = `<strong>${historicalList.date} - ${historicalList.location}</strong><br><hr style="margin: 5px 0;">`;

        // Loop through the items in that specific historical list
        historicalList.items.forEach(item => {
            htmlContent += `${item.quantity}x ${item.name}<br>`;
        });

        li.innerHTML = htmlContent;
        historyListUI.appendChild(li);
    });
}


