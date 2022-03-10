// Variable to hold db connection
let db;

// Establish connection to IndexedDb database called `offline_budget` version 1
const request = indexedDB.open("offline_budget", 1);

request.onupgradeneeded = function (event) {
  // Save reference to db
  const db = event.target.result;

  // Create object store called `new_budget` and autoIncrement the version number
  db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

// Function to execute when submission is attempted without an internet connection
function saveRecord(record) {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const budgetObjectStore = transaction.objectStore("new_budget");

  budgetObjectStore.add(record);
}

function uploadBudget() {
  const transaction = db.transaction(["new_budget"], "readwrite");

  const budgetObjectStore = transaction.objectStore("new_budget");

  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = () => {
    if (getAll.result.length > 0) {
      fetch("/api/transaction", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }

          const transaction = db.transaction(["new_budget"], "readwrite");
          const budgetObjectStore = transaction.objectStore("new_budget");
          budgetObjectStore.clear();

          alert("All saved transactions have been applied");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// Event listener for app coming back onling
window.addEventListener("online", uploadBudget);
