// Grave Data
const graveData = [
  { id: '1', name: 'John Anderson', birthDate: '1945-03-12', deathDate: '2018-07-22', section: 'A', row: 1, plot: 3, coordinates: { x: 0, y: 2 } },
  { id: '2', name: 'Mary Thompson', birthDate: '1952-08-15', deathDate: '2020-11-30', section: 'A', row: 1, plot: 5, coordinates: { x: 0, y: 4 } },
  { id: '3', name: 'Robert Williams', birthDate: '1938-01-20', deathDate: '2019-05-14', section: 'A', row: 2, plot: 2, coordinates: { x: 1, y: 1 } },
  { id: '4', name: 'Elizabeth Davis', birthDate: '1960-11-03', deathDate: '2021-03-08', section: 'A', row: 2, plot: 4, coordinates: { x: 1, y: 3 } },
  { id: '5', name: 'James Miller', birthDate: '1942-06-25', deathDate: '2017-12-19', section: 'A', row: 3, plot: 1, coordinates: { x: 2, y: 0 } },
  { id: '6', name: 'Patricia Brown', birthDate: '1955-09-08', deathDate: '2022-01-15', section: 'A', row: 3, plot: 3, coordinates: { x: 2, y: 2 } },
  { id: '7', name: 'Michael Johnson', birthDate: '1948-04-17', deathDate: '2019-08-22', section: 'B', row: 1, plot: 2, coordinates: { x: 0, y: 1 } },
  { id: '8', name: 'Linda Wilson', birthDate: '1963-12-30', deathDate: '2023-06-11', section: 'B', row: 1, plot: 4, coordinates: { x: 0, y: 3 } },
  { id: '9', name: 'David Martinez', birthDate: '1940-02-14', deathDate: '2018-10-05', section: 'B', row: 2, plot: 1, coordinates: { x: 1, y: 0 } },
  { id: '10', name: 'Barbara Garcia', birthDate: '1958-07-21', deathDate: '2021-09-28', section: 'B', row: 2, plot: 5, coordinates: { x: 1, y: 4 } },
  { id: '11', name: 'Richard Rodriguez', birthDate: '1935-05-09', deathDate: '2016-04-13', section: 'B', row: 3, plot: 2, coordinates: { x: 2, y: 1 } },
  { id: '12', name: 'Susan Lee', birthDate: '1961-10-28', deathDate: '2022-07-30', section: 'B', row: 3, plot: 4, coordinates: { x: 2, y: 3 } },
];

// Services Data
const servicesList = [
  { id: 'cleaning', name: 'Tombstone Cleaning', price: '$150' },
  { id: 'repair', name: 'Tombstone Repair', price: '$300+' },
  { id: 'engraving', name: 'Additional Engraving', price: '$200+' },
  { id: 'restoration', name: 'Full Restoration', price: '$500+' },
  { id: 'landscaping', name: 'Plot Landscaping', price: '$100' },
];

const additionalServicesList = [
  { id: 'flowers', name: 'Fresh Flowers Placement', price: '$50' },
  { id: 'photo', name: 'Before/After Photos', price: '$25' },
  { id: 'sealant', name: 'Protective Sealant', price: '$75' },
];

// Articles Data
const articlesList = [
  {
    id: 1,
    title: 'Choosing the Right Tombstone Material: A Complete Guide',
    excerpt: 'Understanding the differences between granite, marble, and bronze can help you make an informed decision that will last for generations.',
    date: '2024-11-15',
    category: 'Materials',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Tombstone Maintenance: Seasonal Care Tips',
    excerpt: 'Learn how to properly care for and maintain tombstones through different seasons to preserve their beauty and integrity.',
    date: '2024-11-10',
    category: 'Maintenance',
    readTime: '4 min read',
  },
  {
    id: 3,
    title: 'The History of Cemetery Symbolism',
    excerpt: 'Discover the meanings behind common symbols found on tombstones, from angels and doves to crosses and flowers.',
    date: '2024-11-05',
    category: 'History',
    readTime: '7 min read',
  },
  {
    id: 4,
    title: 'Restoration vs. Replacement: Making the Right Choice',
    excerpt: 'When a tombstone shows signs of wear, understanding when to restore versus replace can save money and preserve history.',
    date: '2024-10-28',
    category: 'Restoration',
    readTime: '6 min read',
  },
  {
    id: 5,
    title: 'Modern Tombstone Design Trends',
    excerpt: 'Explore contemporary approaches to memorial design, from laser etching to custom sculptures and personalized engravings.',
    date: '2024-10-20',
    category: 'Design',
    readTime: '5 min read',
  },
  {
    id: 6,
    title: 'Environmental Considerations in Cemetery Planning',
    excerpt: 'Learn about eco-friendly burial options and sustainable cemetery practices that are better for the environment.',
    date: '2024-10-12',
    category: 'Environment',
    readTime: '6 min read',
  },
];

// State
let selectedGrave = null;

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Map Elements
const mapSectionsContainer = document.getElementById('map-sections');
const mapSelectedDetails = document.getElementById('map-selected-details');
const clearSelectionBtn = document.getElementById('clear-selection-btn');

// Service Elements
const serviceSelect = document.getElementById('service-select');
const additionalServicesContainer = document.getElementById('additional-services-container');
const serviceSelectedGraveInfo = document.getElementById('service-selected-grave-info');
const serviceSubmitBtn = document.getElementById('service-submit-btn');
const serviceForm = document.getElementById('service-form');

// Articles Elements
const articlesGrid = document.getElementById('articles-grid');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderGraves(graveData);
  setupTabs();
  setupSearch();
  
  // Initialize Modules
  renderMap();
  renderServicesForm();
  renderArticles();
  
  // Re-initialize icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Functions
function setupTabs() {
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
    });
  });
}

function switchTab(tabName) {
  // Update buttons
  tabButtons.forEach(b => {
    if (b.dataset.tab === tabName) {
      b.classList.remove('text-slate-500', 'hover:text-slate-900');
      b.classList.add('bg-white', 'text-slate-950', 'shadow');
    } else {
      b.classList.add('text-slate-500', 'hover:text-slate-900');
      b.classList.remove('bg-white', 'text-slate-950', 'shadow');
    }
  });

  // Update content
  tabContents.forEach(content => {
    if (content.id === tabName) {
      content.classList.remove('hidden');
      content.classList.add('block');
    } else {
      content.classList.add('hidden');
      content.classList.remove('block');
    }
  });
}

function setupSearch() {
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = graveData.filter(grave => 
      grave.name.toLowerCase().includes(term)
    );
    renderGraves(filtered);
  });
}

function renderGraves(graves) {
  if (graves.length === 0) {
    searchResults.innerHTML = `
      <div class="p-8 text-center text-slate-500 bg-white rounded-lg border border-slate-200">
        <p>No results found. Please try a different search term.</p>
      </div>
    `;
    return;
  }

  searchResults.innerHTML = graves.map(grave => `
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
      <div class="flex items-start justify-between gap-4">
        <div class="flex-1 space-y-3">
          <div>
            <h3 class="text-lg font-semibold text-slate-900">${grave.name}</h3>
            <div class="flex items-center gap-2 text-slate-600 mt-1 text-sm">
              <i data-lucide="calendar" class="w-4 h-4"></i>
              <span>${grave.birthDate} - ${grave.deathDate}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2 text-slate-700 text-sm">
            <i data-lucide="map-pin" class="w-4 h-4 text-slate-500"></i>
            <span>Section ${grave.section} • Row ${grave.row} • Plot ${grave.plot}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button onclick="selectGraveAndShowMap('${grave.id}')" class="flex items-center px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm transition-colors">
            <i data-lucide="map-pin" class="w-4 h-4 mr-2"></i>
            View Location
          </button>
          <button onclick="selectGraveAndShowServices('${grave.id}')" class="flex items-center px-4 py-2 border border-slate-200 text-slate-900 rounded-md hover:bg-slate-100 text-sm transition-colors">
            <i data-lucide="wrench" class="w-4 h-4 mr-2"></i>
            Order Service
          </button>
        </div>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

// --- Map Logic ---
function renderMap() {
  const sections = ['A', 'B'];
  const gridSize = { rows: 4, cols: 6 };

  mapSectionsContainer.innerHTML = sections.map(section => {
    const sectionGraves = graveData.filter(g => g.section === section);
    
    // Generate Grid Cells
    let gridCellsHTML = '';
    
    // Column Headers
    gridCellsHTML += `<div class="text-center text-slate-500 py-2 text-xs">Row</div>`;
    for(let i=0; i < gridSize.cols; i++) {
      gridCellsHTML += `<div class="text-center text-slate-500 py-2 text-xs">Plot ${i+1}</div>`;
    }

    // Rows
    for(let rowIdx=0; rowIdx < gridSize.rows; rowIdx++) {
      // Row Label
      gridCellsHTML += `<div class="flex items-center justify-center text-slate-500 text-sm">${rowIdx + 1}</div>`;
      
      // Cells
      for(let colIdx=0; colIdx < gridSize.cols; colIdx++) {
        const grave = graveData.find(g => g.section === section && g.coordinates.x === rowIdx && g.coordinates.y === colIdx);
        const isSelected = selectedGrave && selectedGrave.id === grave?.id;
        
        let cellClass = 'bg-slate-200 border-slate-300 cursor-default';
        let content = '';
        let onClick = '';

        if (grave) {
          if (isSelected) {
            cellClass = 'bg-blue-600 border-blue-700 hover:bg-blue-700 cursor-pointer';
          } else {
            cellClass = 'bg-slate-600 border-slate-700 hover:bg-slate-700 hover:scale-105 cursor-pointer';
          }
          content = `<div class="text-white text-center px-1"><div class="text-[10px] truncate">${grave.name}</div></div>`;
          onClick = `onclick="handleMapGraveClick('${grave.id}')"`;
        }

        gridCellsHTML += `
          <button ${onClick} class="h-16 rounded border-2 transition-all w-full ${cellClass}" ${!grave ? 'disabled' : ''} title="${grave ? grave.name : 'Available'}">
            ${content}
          </button>
        `;
      }
    }

    return `
      <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 bg-slate-100 text-slate-900 rounded-full text-sm font-medium">Section ${section}</span>
            <span class="text-slate-600 text-sm">${sectionGraves.length} plots occupied</span>
          </div>
          <hr class="border-slate-100">
          <div class="overflow-x-auto">
            <div class="inline-block min-w-full" style="min-width: 600px;">
              <div class="grid gap-2" style="grid-template-columns: 40px repeat(${gridSize.cols}, minmax(0, 1fr));">
                ${gridCellsHTML}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Update Selected Details
  if (selectedGrave) {
    mapSelectedDetails.classList.remove('hidden');
    clearSelectionBtn.classList.remove('hidden');
    mapSelectedDetails.innerHTML = `
      <div class="space-y-3">
        <h3 class="text-blue-900 font-semibold">Selected Location</h3>
        <div class="grid md:grid-cols-2 gap-4 text-slate-700 text-sm">
          <div><span class="text-slate-600">Name:</span> ${selectedGrave.name}</div>
          <div><span class="text-slate-600">Section:</span> ${selectedGrave.section}</div>
          <div><span class="text-slate-600">Row:</span> ${selectedGrave.row}</div>
          <div><span class="text-slate-600">Plot:</span> ${selectedGrave.plot}</div>
          <div class="md:col-span-2"><span class="text-slate-600">Dates:</span> ${selectedGrave.birthDate} - ${selectedGrave.deathDate}</div>
        </div>
      </div>
    `;
    
    clearSelectionBtn.onclick = () => {
      selectedGrave = null;
      renderMap();
      updateServiceSelection();
    };

  } else {
    mapSelectedDetails.classList.add('hidden');
    clearSelectionBtn.classList.add('hidden');
  }
}

function handleMapGraveClick(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
}

function selectGraveAndShowMap(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
  switchTab('map');
}

// --- Services Logic ---
function renderServicesForm() {
  // Populate Select
  serviceSelect.innerHTML = '<option value="">Select a service</option>' + 
    servicesList.map(s => `<option value="${s.id}">${s.name} - ${s.price}</option>`).join('');

  // Populate Checkboxes
  additionalServicesContainer.innerHTML = additionalServicesList.map(s => `
    <div class="flex items-center space-x-2">
      <input type="checkbox" id="${s.id}" class="rounded border-slate-300 text-blue-600 focus:ring-blue-500">
      <label for="${s.id}" class="flex-1 cursor-pointer text-slate-700 text-sm">
        ${s.name} - ${s.price}
      </label>
    </div>
  `).join('');

  // Handle Submit
  serviceForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedGrave) return;

    // Simulate submission
    const originalBtnText = serviceSubmitBtn.innerText;
    serviceSubmitBtn.innerText = 'Submitting...';
    serviceSubmitBtn.disabled = true;

    setTimeout(() => {
      alert(`Service request for ${selectedGrave.name} submitted successfully! We will contact you shortly.`);
      serviceForm.reset();
      selectedGrave = null;
      renderMap();
      updateServiceSelection();
      serviceSubmitBtn.innerText = originalBtnText;
      serviceSubmitBtn.disabled = false;
    }, 1500);
  });
}

function updateServiceSelection() {
  if (selectedGrave) {
    serviceSelectedGraveInfo.classList.remove('hidden');
    serviceSelectedGraveInfo.innerHTML = `
      <div class="text-slate-900 font-medium">Selected Location: ${selectedGrave.name}</div>
      <div class="text-slate-600 text-sm">Section ${selectedGrave.section} • Row ${selectedGrave.row} • Plot ${selectedGrave.plot}</div>
      <button onclick="selectedGrave = null; renderMap(); updateServiceSelection();" class="text-blue-600 hover:underline text-sm mt-1">Change location</button>
    `;
    serviceSubmitBtn.disabled = false;
    serviceSubmitBtn.innerText = 'Submit Service Request';
    serviceSubmitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  } else {
    serviceSelectedGraveInfo.classList.add('hidden');
    serviceSubmitBtn.disabled = true;
    serviceSubmitBtn.innerText = 'Please select a location first';
    serviceSubmitBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }
}

function selectGraveAndShowServices(id) {
  selectedGrave = graveData.find(g => g.id === id);
  renderMap();
  updateServiceSelection();
  switchTab('services');
}

// --- Articles Logic ---
function renderArticles() {
  articlesGrid.innerHTML = articlesList.map(article => `
    <div class="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
      <div class="space-y-4">
        <div class="space-y-2">
          <span class="inline-flex items-center rounded-full border border-transparent bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-900 transition-colors hover:bg-slate-200/80">
            ${article.category}
          </span>
          <h3 class="text-lg font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
            ${article.title}
          </h3>
        </div>

        <p class="text-slate-600 text-sm line-clamp-3">
          ${article.excerpt}
        </p>

        <div class="flex items-center justify-between pt-4 border-t border-slate-100">
          <div class="flex items-center gap-2 text-slate-500 text-xs">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            <span>${new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <span class="text-slate-500 text-xs">${article.readTime}</span>
        </div>

        <button class="text-sm font-medium text-slate-900 hover:underline flex items-center mt-2 group-hover:gap-2 transition-all">
          Read More
          <i data-lucide="arrow-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    </div>
  `).join('');
}

