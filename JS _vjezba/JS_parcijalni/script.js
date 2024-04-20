const searchInput = document.getElementById('searchInput');
const searchResultsContainer = document.getElementById('searchResults');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');

let timeoutId;

searchInput.addEventListener('input', function() {
  clearTimeout(timeoutId);
  const searchTerm = this.value.trim();

  if (searchTerm === '') {
    clearSearchResults();
    return;
  }

  timeoutId = setTimeout(function() {
    search(searchTerm);
  }, 500);
});

function search(searchTerm) {
  const url = `https://itunes.apple.com/search?term=${searchTerm}&entity=song`;

  loader.style.display = 'block';
  errorMessage.textContent = '';

  fetch(url)
    .then(response => {
      loader.style.display = 'none';
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.results.length === 0) {
        errorMessage.textContent = 'Nije pronađen rezultat.';
      } else {
        displaySearchResults(data.results);
      }
    })
    .catch(error => {
      loader.style.display = 'none';
      errorMessage.textContent = error.message;
    });
}

function displaySearchResults(results) {
  searchResultsContainer.innerHTML = '';
  results.forEach(result => {
    const li = document.createElement('li');
    li.textContent = `${result.trackName} - ${result.artistName}`;
    searchResultsContainer.appendChild(li);
  });
}

function clearSearchResults() {
  searchResultsContainer.innerHTML = '';
  errorMessage.textContent = '';
}