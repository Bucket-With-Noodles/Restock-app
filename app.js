//1.State (date)
let currentLocation = localStorage.getItem('lastLocation') || "";
let currentRestockList = JSON.parse(localStorage.getItem('shopRestockList'))||[];
let currentFridge = null;

// State variables
let itemBeingEdited = null;

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

const btnExportData = document.getElementById('btn-export-data');
const btnImportData = document.getElementById('btn-import-data');

const searchItemInput = document.getElementById('search-item-input');
const modalAddItem = document.getElementById('modal-add-item');
const modalItemName = document.getElementById('modal-item-name');
const modalItemPrice = document.getElementById('modal-item-price');
const modalItemVat = document.getElementById('modal-item-vat');
const btnSaveModalItem = document.getElementById('btn-save-modal-item');
const btnCloseModal = document.getElementById('btn-close-modal');
const globalItemList = document.getElementById('global-item-list');

// use this map to temporarily hold the data for autofill
let globalItemsDatabase = new Map();

//3. Event Listeners

// --- LIVE SEARCH LOGIC ---
searchItemInput.addEventListener('input', (event) => {
    const searchTerm = event.target.value.toLowerCase();
    // Grab all the <li> elements currently inside the fridge list
    const itemsInUI = itemListUI.querySelectorAll('li');

    itemsInUI.forEach(li => {
        const text = li.textContent.toLowerCase();
        // If the text contains the search term, show it. Otherwise, hide it.
        li.style.display = text.includes(searchTerm) ? '' : 'none';
    });
});

// --- EXPORT LOGIC ---
btnExportData.addEventListener('click', () => {
    // 1. Turn our inventory data into a beautifully formatted JSON string
    const dataStr = JSON.stringify(inventoryData, null, 2);

    // 2. Create a "Blob" (a virtual file in the browser's memory)
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // 3. Create a fake link, click it to trigger the download, and destroy it
    const a = document.createElement('a');
    a.href = url;
    a.download = `ShopLayout_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

// --- IMPORT LOGIC ---
btnImportData.addEventListener('change', (event) => {
    // 1. Get the file the user selected
    const file = event.target.files[0];
    if (!file) return;

    // 2. Use the browser's built-in FileReader to read the text inside
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            // Try to parse the text back into a JavaScript Object
            const importedData = JSON.parse(e.target.result);

            // Safety Check: Make sure the file actually has aarschot and mechelen arrays
            if (importedData.aarschot && importedData.mechelen) {

                // Overwrite our app's data with the imported data
                inventoryData = importedData;

                // Save it permanently to the phone
                saveInventoryLocally();

                alert("Layout successfully imported! Your fridges are ready.");
            } else {
                alert("Error: This doesn't look like a valid Shop Layout file.");
            }
        } catch (err) {
            alert("Error reading file. Make sure it is a valid .json file.");
        }

        // Reset the file input so they can import again if they made a mistake
        event.target.value = "";
    };

    // Start reading the file
    reader.readAsText(file);
});

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

// --- NEW MODAL & QUICK ADD LOGIC ---
btnAddItem.addEventListener('click', () => {
    if (!currentFridge) return;

    // 1. Tell the app this is a NEW item, not an edit!
    itemBeingEdited = null;
    document.querySelector('#modal-add-item h3').textContent = "Add / Create Item";

    // 2. Scan the database to populate the dropdown
    globalItemsDatabase.clear();
    globalItemList.innerHTML = "";

    for (let location in inventoryData) {
        inventoryData[location].forEach(fridge => {
            fridge.items.forEach(item => {
                const lowerName = item.name.toLowerCase();
                if (!globalItemsDatabase.has(lowerName)) {
                    globalItemsDatabase.set(lowerName, item);
                    let option = document.createElement('option');
                    option.value = item.name;
                    globalItemList.appendChild(option);
                }
            });
        });
    }

    // 3. Reset the modal fields to blank
    modalItemName.value = "";
    modalItemPrice.value = "";
    modalItemVat.value = "6";

    // 4. Show the modal
    modalAddItem.classList.remove('hidden');
});

// Auto-fill price and VAT if they select an existing item from the dropdown!
modalItemName.addEventListener('input', (event) => {
    const selectedName = event.target.value.toLowerCase();
    if (globalItemsDatabase.has(selectedName)) {
        const savedData = globalItemsDatabase.get(selectedName);
        modalItemPrice.value = savedData.price;
        if (savedData.vat) modalItemVat.value = savedData.vat;
    }
});

// Cancel Button
btnCloseModal.addEventListener('click', () => {
    modalAddItem.classList.add('hidden');
});

// Save Button
btnSaveModalItem.addEventListener('click', () => {
    const name = modalItemName.value.trim();
    const priceText = modalItemPrice.value.replace(',', '.');
    const price = parseFloat(priceText).toFixed(2);
    const vat = modalItemVat.value;

    if (!name || isNaN(price)) {
        alert("Please enter a valid name and price.");
        return;
    }

    if (itemBeingEdited) {
        // WE ARE EDITING: Just update the existing item's properties
        itemBeingEdited.name = name;
        itemBeingEdited.price = price;
        itemBeingEdited.vat = vat;
    } else {
        // WE ARE ADDING: Create a brand new item
        const newItem = {
            id: "item-" + Date.now(),
            name: name,
            price: price,
            vat: vat
        };
        currentFridge.items.push(newItem);
    }

    // Save and redraw the screen!
    saveInventoryLocally();
    modalAddItem.classList.add('hidden');
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

    // 2. Clear the old items out of the UI list just in case
    itemListUI.innerHTML = "";

    // 3. Loop through the items and display them
    fridge.items.forEach(item => {
        let li = document.createElement("li");
        li.className = 'fridge-item-btn';

        // Display the VAT next to the price (with a fallback if older items don't have it)
        const vatDisplay = item.vat ? ` (${item.vat}%)` : "";

        li.innerHTML = `
            <span>${item.name} - €${item.price}${vatDisplay}</span>
            <div style="float: right;">
                <button class="btn-edit-item" style="color: #007bff; border: none; background: none; font-size: 16px; margin-right: 15px; padding: 5px;">✏️</button>
                <button class="btn-delete-item" style="color: red; border: none; background: none; font-size: 16px; padding: 5px;">❌</button>
            </div>
        `;

        li.addEventListener('click', () => {
            // Search the master list to see if an item with this ID already exists
            let existingItem = currentRestockList.find(listItem => listItem.id === item.id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                item.quantity = 1;
                currentRestockList.push(item);
            }

            // Update the UI safely by targeting ONLY the span, leaving the X button alone
            li.querySelector('span').textContent = "✅ " + (existingItem ? existingItem.quantity : 1) + "x " + item.name;
            li.classList.add('selected');

            saveListLocally();
        });

        // 2. EDIT LOGIC
        const editBtn = li.querySelector('.btn-edit-item');
        editBtn.addEventListener('click', (event) => {
            event.stopPropagation(); // Don't add to list!

            // Tell the app which item we are targeting
            itemBeingEdited = item;

            // Change the title and fill the inputs with the current data
            document.querySelector('#modal-add-item h3').textContent = "Edit Item";
            modalItemName.value = item.name;
            modalItemPrice.value = item.price;
            modalItemVat.value = item.vat || "6";

            // Pop open the modal
            modalAddItem.classList.remove('hidden');
        });

        // 3. DELETE LOGIC
        const deleteBtn = li.querySelector('.btn-delete-item');
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (confirm(`Delete ${item.name} from this fridge permanently?`)) {
                currentFridge.items = currentFridge.items.filter(i => i.id !== item.id);
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


